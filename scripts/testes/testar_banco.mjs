import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { unaccent } from '@electric-sql/pglite/contrib/unaccent';
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
const db = new PGlite({ extensions: { pg_trgm, unaccent } });

// simulação mínima do Supabase
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
`);

let ok = 0, falhas = 0;
const t0 = Date.now();
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  const sql = fs.readFileSync(path.join(dir, f), 'utf8');
  try {
    await db.exec(sql);
    console.log('OK migração', f);
  } catch (e) {
    console.log('FALHA migração', f, '->', e.message, e.position ? `(pos ${e.position})` : '');
    if (e.position) console.log('   ...' + sql.slice(Math.max(0, e.position - 300), Number(e.position) + 100));
    process.exit(1);
  }
}
console.log(`migrações em ${Date.now() - t0} ms`);

await db.exec(`
  grant usage on schema public, auth, extensions, storage to anon, authenticated;
  grant all on all tables in schema public to authenticated;
  grant select on all tables in schema public to anon;
  grant all on all sequences in schema public to authenticated;
  grant all on storage.objects to authenticated;
`);

const q = async (sql, params) => (await db.query(sql, params)).rows;
const um = async (sql, p) => (await q(sql, p))[0];
async function como(uid, fn) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false); set role authenticated;`);
  try { return await fn(); } finally { await db.exec('reset role;'); }
}
async function teste(nome, fn, deveFalhar = false) {
  try {
    const r = await fn();
    if (deveFalhar) { falhas++; console.log('FALHA', nome, '- deveria ser bloqueado, mas passou', JSON.stringify(r ?? '')); }
    else { ok++; console.log('ok  ', nome, r !== undefined ? `-> ${JSON.stringify(r)}` : ''); }
  } catch (e) {
    if (deveFalhar) { ok++; console.log('ok  ', nome, '(bloqueado: ' + e.message.slice(0, 100) + ')'); }
    else { falhas++; console.log('FALHA', nome, '->', e.message); }
  }
}

// ---------------------------------------------------------------- dados carregados
await teste('carga: contagens', () => um(`select (select count(*) from cidades)::int cidades, (select count(*) from fornecedores)::int fornecedores,
  (select count(*) from materiais)::int materiais, (select count(*) from requisicoes)::int requisicoes, (select count(*) from pedidos)::int pedidos,
  (select count(*) from colaboradores)::int colaboradores, (select count(*) from modelos_documentos)::int modelos, (select count(*) from auditoria)::int auditoria`));
await teste('carga: nenhum dado pessoal de fornecedor', async () => { const r = await um(`select count(*)::int n from fornecedores where tipo='PF' or cpf is not null or contato is not null or celular1 is not null`); if (r.n) throw new Error(r.n + ' com dado pessoal'); return r; });
await teste('carga: acentos preservados', async () => (await q(`select nome from cidades where nome like '%Ã%' or nome like '%Ç%' or nome like '%Á%' limit 4`)).map((r) => r.nome));
await teste('carga: cidades duplicadas por estado separadas', () => um(`select nome, count(*)::int estados from cidades group by nome having count(*) > 3 order by 2 desc limit 1`));
await teste('carga: valor de pedido histórico', () => um(`select id, round(valor_pedido(id), 2)::text valor from pedidos order by id limit 1`));
await teste('carga: sequência continua após o maior id', async () => { const r = await um(`insert into materiais (nome) values ('TESTE SEQ') returning id`); await q(`delete from materiais where id=$1`, [r.id]); return r; });
await teste('busca sem acento (sem_acento)', async () => (await q(`select nome from cidades where sem_acento(nome) like '%itau de minas%' limit 2`)).map((r) => r.nome));

// ---------------------------------------------------------------- usuários
const admin = (await q(`insert into auth.users (email, raw_user_meta_data) values ('admin@atlas.com', '{"nome":"Admin"}') returning id`))[0];
const ana = (await q(`insert into auth.users (email, raw_user_meta_data) values ('ana@atlas.com', '{"nome":"Ana RH"}') returning id`))[0];
const beto = (await q(`insert into auth.users (email, raw_user_meta_data) values ('beto@atlas.com', '{"nome":"Beto Obra"}') returning id`))[0];
await teste('primeiro usuário vira admin, demais não', async () => (await q(`select nome, admin from usuarios order by nome`)).map((r) => `${r.nome}:${r.admin}`));
await teste('usuário comum não se torna admin', () => como(ana.id, () => q(`update usuarios set admin=true where id=auth.uid() returning id`)).then((r) => { if (r.length) throw new Error('virou admin'); return 'nada alterado'; }));

// ---------------------------------------------------------------- RLS dados pessoais
await teste('sem permissão: não vê colaboradores', () => como(ana.id, async () => { const r = await um('select count(*)::int n from colaboradores'); if (r.n !== 0) throw new Error('viu'); return r; }));
await teste('sem permissão: não cadastra colaborador', () => como(ana.id, () => q(`insert into colaboradores (nome) values ('X')`)), true);
await q(`insert into permissoes values ($1,'colaboradores',4),($1,'seguranca',4),($1,'documentacao_colaboradores',2)`, [ana.id]);
let colab;
await teste('nível 4: cadastra colaborador', async () => { colab = (await como(ana.id, () => q(`insert into colaboradores (nome, cpf) values ('JOÃO DA SILVA', '111.222.333-44') returning id`)))[0]; return colab; });
await teste('nível 4: não desativa (exige 5)', () => como(ana.id, () => q(`update colaboradores set status='desativado' where id=$1`, [colab.id])), true);
await teste('admin desativa e reativa', () => como(admin.id, async () => { await q(`update colaboradores set status='desativado' where id=$1`, [colab.id]); await q(`update colaboradores set status='ativo' where id=$1`, [colab.id]); return 'ok'; }));
await teste('anônimo não lê colaboradores', async () => { await db.exec(`select set_config('request.jwt.claim.sub','',false); set role anon;`); try { const r = await q('select count(*)::int n from colaboradores'); if (r[0].n) throw new Error('viu'); return r[0]; } finally { await db.exec('reset role'); } });
await teste('nomes para seleção sem acesso ao cadastro (beto)', () => como(beto.id, async () => (await q(`select nome from colaboradores_opcoes('joao')`)).map((r) => r.nome)));
await teste('beto não lê CPF', () => como(beto.id, async () => (await q(`select cpf from colaboradores`)).length));

// ---------------------------------------------------------------- versionamento e NR
await teste('segurança: novo registro manda o anterior para histórico (usuário nível 4)', () => como(ana.id, async () => {
  await q(`insert into seguranca (colaborador_id, data_aso, tipo_aso) values ($1, '2025-01-10', 'ADMISSIONAL')`, [colab.id]);
  await q(`insert into seguranca (colaborador_id, data_aso, tipo_aso) values ($1, '2026-01-10', 'PERIÓDICO')`, [colab.id]);
  return (await q(`select tipo_aso, status from seguranca where colaborador_id=$1 order by id`, [colab.id])).map((r) => `${r.tipo_aso}:${r.status}`);
}));
await teste('NR-35: vencimento calculado (730 dias)', () => como(ana.id, () => um(`insert into treinamentos_nr (colaborador_id, nr, data_realizacao) values ($1,'NR-35','2025-01-01') returning data_vencimento::text`, [colab.id])));
await teste('NR-33 vencida aparece no painel', () => como(ana.id, async () => { await q(`insert into treinamentos_nr (colaborador_id, nr, data_realizacao) values ($1,'NR-33','2024-01-01')`, [colab.id]); return q(`select tipo, item, referencia, vencimento::text from vencimentos where colaborador_id=$1`, [colab.id]); }));
await teste('beto (sem segurança) não vê vencimentos pessoais', () => como(beto.id, () => um(`select count(*)::int n from vencimentos where colaborador_id is not null`)));

// ---------------------------------------------------------------- compras
const obra = (await um(`select id from obras order by id limit 1`)).id;
const mat = (await q(`select id from materiais where status='ativo' order by id limit 2`)).map((r) => r.id);
const forn = (await q(`select id from fornecedores order by id limit 2`)).map((r) => r.id);
await q(`insert into permissoes values ($1,'requisicao',4),($1,'requisicao_recebimento',4)`, [beto.id]);
let req;
await teste('beto abre requisição (solicitante automático)', async () => { req = (await como(beto.id, () => q(`insert into requisicoes (obra_id, urgente) values ($1, true) returning id, solicitante_id = auth.uid() as dono`, [obra])))[0]; return req; });
await teste('não finaliza sem itens', () => como(beto.id, () => q(`select finalizar_requisicao($1)`, [req.id])), true);
await teste('inclui itens', () => como(beto.id, async () => { await q(`insert into requisicao_itens (requisicao_id, material_id, quantidade, unidade) values ($1,$2,10,'UN'),($1,$3,5,'M')`, [req.id, mat[0], mat[1]]); return 'ok'; }));
await teste('finaliza', () => como(beto.id, () => q(`select finalizar_requisicao($1)`, [req.id])));
await teste('não edita após finalizar', () => como(beto.id, async () => { const r = await q(`update requisicoes set obs='x' where id=$1 returning id`, [req.id]); if (!r.length) throw new Error('0 linhas (RLS)'); return r; }), true);
await teste('beto não libera (sem alçada)', () => como(beto.id, () => q(`select liberar_requisicao($1, true)`, [req.id])), true);
await q(`insert into permissoes values ($1,'pcl',2),($1,'pca',2),($1,'orcamento',4),($1,'pedido',4),($1,'situacao_compra_entrega',4)`, [ana.id]);
await q(`insert into alcadas (usuario_id, obra_id, pode_liberar, pode_aprovar, valor_maximo) values ($1,$2,true,true,500)`, [ana.id, obra]);
await teste('ana lê a própria alçada', () => como(ana.id, async () => (await q(`select count(*)::int n from alcadas`))[0]));
await teste('ana libera negando 1 item', () => como(ana.id, async () => { await q(`select liberar_requisicao($1, true, null, (select array_agg(id) from requisicao_itens where requisicao_id=$1 and material_id=$2))`, [req.id, mat[1]]); return (await q(`select liberado from requisicao_itens where requisicao_id=$1 order by id`, [req.id])).map((r) => r.liberado); }));
let orc1, orc2;
await teste('dois orçamentos', () => como(ana.id, async () => {
  orc1 = (await um(`insert into orcamentos (requisicao_id, fornecedor_id, valor_frete) values ($1,$2,20) returning id`, [req.id, forn[0]])).id;
  orc2 = (await um(`insert into orcamentos (requisicao_id, fornecedor_id) values ($1,$2) returning id`, [req.id, forn[1]])).id;
  const item = (await um(`select id from requisicao_itens where requisicao_id=$1 and liberado`, [req.id])).id;
  await q(`insert into orcamento_itens (orcamento_id, requisicao_item_id, quantidade, valor_unitario, valor_ipi) values ($1,$3,10,30,15),($2,$3,10,80,0)`, [orc1, orc2, item]);
  await q(`select finalizar_orcamento($1)`, [orc1]);
  return { orc1, orc2 };
}));
let ped;
await teste('gera pedido do orçamento mais barato', () => como(ana.id, async () => { ped = (await um(`select gerar_pedido($1, (select array_agg(id) from orcamento_itens where orcamento_id=$1)) as id`, [orc1])).id; return { ped, valor: (await um(`select valor_pedido($1)::text v`, [ped])).v }; }));
await teste('envia para aprovação', () => como(ana.id, () => q(`select enviar_pedido_aprovacao($1)`, [ped])));
await q(`update alcadas set valor_maximo = 100 where usuario_id=$1`, [ana.id]);
await teste('aprovação acima do limite é barrada (335 > 100)', () => como(ana.id, () => q(`select aprovar_pedido($1, true)`, [ped])), true);
await q(`update alcadas set valor_maximo = 500 where usuario_id=$1`, [ana.id]);
await teste('aprovação dentro do limite', () => como(ana.id, async () => { await q(`select aprovar_pedido($1, true)`, [ped]); return (await um(`select status from pedidos where id=$1`, [ped])).status; }));
await teste('situação: enviado total', () => como(ana.id, () => q(`insert into requisicao_situacoes (requisicao_id, situacao) values ($1,'enviado_total') returning id`, [req.id])));
await teste('não conclui sem receber', () => como(beto.id, () => q(`select concluir_requisicao($1)`, [req.id])), true);
await teste('beto recebe e conclui', () => como(beto.id, async () => {
  const item = (await um(`select id from requisicao_itens where requisicao_id=$1 and liberado`, [req.id])).id;
  await q(`select registrar_recebimento($1, 'atendido', 'fornecedor', '12345')`, [item]);
  await q(`select concluir_requisicao($1)`, [req.id]);
  return (await um(`select status from requisicoes where id=$1`, [req.id])).status;
}));
await teste('painel geral de requisições', () => como(ana.id, () => um(`select id, status, solicitante, itens, orcamentos, pedido_status, situacao_compra, itens_recebidos from requisicoes_painel where id=$1`, [req.id])));

// ---------------------------------------------------------------- recrutamento, alertas, auditoria
await q(`insert into permissoes values ($1,'recrutamento_selecao',3),($1,'alerta_adm',6),($1,'profissional',4),($1,'logs',2)`, [ana.id]);
await q(`insert into recrutamento_parametros values ($1,true,true,false,false)`, [ana.id]);
await teste('recrutamento: etapa1 -> etapa2 -> etapa3, efetivar barrado sem permissão', () => como(ana.id, async () => {
  const cand = (await um(`insert into colaboradores (nome, etapa_recrutamento) values ('CANDIDATO TESTE','etapa1') returning id`)).id;
  const a = (await um(`select avancar_etapa($1) e`, [cand])).e;
  const b = (await um(`select avancar_etapa($1) e`, [cand])).e;
  let c; try { await q(`select avancar_etapa($1)`, [cand]); c = 'passou'; } catch { c = 'barrado'; }
  return [a, b, c];
}));
await teste('alertas de contribuição sindical (sem duplicar no ano)', () => como(ana.id, async () => {
  await q(`insert into profissionais (colaborador_id, obra_id, admissao) values ($1,$2,'2025-03-01')`, [colab.id, obra]);
  const n1 = (await um(`select lancar_alertas_contribuicao_sindical() n`)).n;
  const n2 = (await um(`select lancar_alertas_contribuicao_sindical() n`)).n;
  return { primeira: n1, repetida: n2 };
}));
await teste('auditoria registrou as ações com o usuário', () => como(ana.id, async () => (await q(`select tabela, operacao, count(*)::int n from auditoria where usuario_id = auth.uid() group by 1,2 order by 1,2 limit 8`)).map((r) => `${r.tabela}/${r.operacao}:${r.n}`)));
await teste('beto não lê auditoria', () => como(beto.id, () => um(`select count(*)::int n from auditoria`)));

// ---------------------------------------------------------------- storage
await teste('storage: beto não envia para atestados', () => como(beto.id, () => q(`insert into storage.objects (bucket_id, name) values ('arquivos','atestados/2026/x.pdf')`)), true);
await teste('storage: nível 2 em documentação só lê, não envia', () => como(ana.id, () => q(`insert into storage.objects (bucket_id, name) values ('arquivos','documentos/2026/x.pdf')`)), true);
await teste('storage: ana (colaboradores 4) envia foto', () => como(ana.id, () => q(`insert into storage.objects (bucket_id, name) values ('arquivos','colaboradores/1/2026/f.jpg') returning name`)));

console.log(`\n${ok} ok, ${falhas} falha(s)`);
process.exit(falhas ? 1 : 0);

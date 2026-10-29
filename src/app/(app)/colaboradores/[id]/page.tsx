import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Celula } from '@/components/Celula';
import { AcoesRegistro } from '@/components/AcoesRegistro';
import { BotaoLink, Cabecalho, Cartao, Dado, Selo, Vazio } from '@/components/ui';
import { resolverRotulos } from '@/lib/crud';
import { fmtData } from '@/lib/formatar';
import { obterModulo } from '@/lib/modulos';
import { exigirSessao, pode } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';
import { FotoColaborador } from './FotoColaborador';

export const metadata = { title: 'Ficha do colaborador' };

// Seções da ficha, na ordem em que aparecem.
const SECOES = ['profissionais', 'classificacoes', 'seguranca', 'treinamentos-nr', 'ferias', 'atestados', 'advertencias',
  'documentos-colaborador', 'telefones', 'dependentes', 'transporte'];

export default async function Ficha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await exigirSessao('colaboradores', 2);
  const supabase = await supabaseServidor();
  const mod = obterModulo('colaboradores')!;

  const { data: c } = await supabase.from('colaboradores').select('*').eq('id', id).maybeSingle();
  if (!c) notFound();
  const rotulosColab = await resolverRotulos(mod, [c], true);

  const foto = c.foto_path ? (await supabase.storage.from('arquivos').createSignedUrl(c.foto_path, 3600)).data?.signedUrl : null;
  const caminho = `/colaboradores/${id}`;

  const secoes = await Promise.all(
    SECOES.map(async (chave) => {
      const m = obterModulo(chave)!;
      if (!pode(sessao, m.permissao, 2)) return null;
      let q = supabase.from(m.tabela).select('*').eq('colaborador_id', id);
      if (m.temStatus !== false) q = q.in('status', m.historico ? ['ativo', 'historico'] : ['ativo']);
      const { data } = await q.order(m.ordem.coluna, { ascending: m.ordem.asc ?? true }).limit(50);
      const linhas = (data as Record<string, any>[]) ?? [];
      const rotulos = await resolverRotulos(m, linhas);
      return { m, linhas, rotulos };
    }),
  );

  const podeEditar = pode(sessao, 'colaboradores', 3);
  const em = (v: unknown) => (v ? String(v) : '');

  return (
    <>
      <Cabecalho
        voltar="/m/colaboradores"
        titulo={<span className="flex flex-wrap items-center gap-2">{c.nome}
          {c.status !== 'ativo' && <Selo cor="cinza">{c.status}</Selo>}
          {c.etapa_recrutamento && <Selo cor="roxo">Candidato — {c.etapa_recrutamento}</Selo>}</span>}
        subtitulo={[c.apelido, c.cpf].filter(Boolean).join(' · ')}
        acoes={
          <>
            {pode(sessao, 'documentos_padronizados', 2) && <BotaoLink href={`/documentos?colaborador=${id}`}>Gerar documentos</BotaoLink>}
            {podeEditar && <BotaoLink variante="primario" href={`/m/colaboradores/${id}?voltar=${caminho}`}>Editar dados</BotaoLink>}
            <AcoesRegistro chave="colaboradores" id={id} status={c.status} podeStatus={pode(sessao, 'colaboradores', 5)} />
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <FotoColaborador id={id} url={foto ?? null} podeEditar={podeEditar} />
        <Cartao titulo="Dados pessoais">
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Dado rotulo="Nascimento">{fmtData(c.data_nascimento)}</Dado>
            <Dado rotulo="Estado civil">{em(c.estado_civil)}</Dado>
            <Dado rotulo="Naturalidade">{rotulosColab.naturalidade_cidade_id?.[c.naturalidade_cidade_id]}</Dado>
            <Dado rotulo="Formação">{em(c.formacao)}</Dado>
            <Dado rotulo="RG">{[c.rg, c.rg_orgao_emissor].filter(Boolean).join(' ')}</Dado>
            <Dado rotulo="PIS">{em(c.pis)}</Dado>
            <Dado rotulo="CTPS">{[c.ctps, c.ctps_serie && `série ${c.ctps_serie}`].filter(Boolean).join(' ')}</Dado>
            <Dado rotulo="CNH">{[c.cnh_numero, c.cnh_categoria, c.cnh_vencimento && `vence ${fmtData(c.cnh_vencimento)}`].filter(Boolean).join(' · ')}</Dado>
            <Dado rotulo="E-mail">{em(c.email)}</Dado>
            <Dado rotulo="E-mail corporativo">{em(c.email_corporativo)}</Dado>
            <Dado rotulo="Endereço">{[c.logradouro, c.complemento, c.bairro, rotulosColab.cidade_id?.[c.cidade_id], c.cep].filter(Boolean).join(', ')}</Dado>
            <Dado rotulo="Banco">{[c.banco, c.banco_agencia && `ag. ${c.banco_agencia}`, c.banco_conta && `conta ${c.banco_conta}`].filter(Boolean).join(' · ')}</Dado>
          </dl>
        </Cartao>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        {secoes.filter(Boolean).map((s) => {
          const { m, linhas, rotulos } = s!;
          const colunas = m.campos.filter((x) => x.lista && x.nome !== 'colaborador_id').slice(0, 5);
          return (
            <Cartao key={m.chave} titulo={m.titulo}
              acoes={pode(sessao, m.permissao, 4) && (
                <BotaoLink pequeno href={`/m/${m.chave}/novo?colaborador_id=${id}&voltar=${caminho}`}>Adicionar</BotaoLink>
              )}>
              {linhas.length === 0 ? <Vazio>Nenhum registro.</Vazio> : (
                <div className="-mx-4 -my-4 overflow-x-auto">
                  <table className="tabela">
                    <thead><tr>{colunas.map((x) => <th key={x.nome}>{x.rotulo}</th>)}<th /></tr></thead>
                    <tbody>
                      {linhas.map((r) => (
                        <tr key={r.id} className={r.status === 'historico' ? 'text-slate-400' : ''}>
                          {colunas.map((x) => <td key={x.nome}><Celula c={x} v={r[x.nome]} rotulos={rotulos[x.nome]} /></td>)}
                          <td className="text-right whitespace-nowrap">
                            {r.status === 'historico' && <Selo cor="amarelo">histórico</Selo>}{' '}
                            <Link href={`/m/${m.chave}/${r.id}?voltar=${caminho}`} className="text-marca-600 hover:underline">abrir</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Cartao>
          );
        })}
      </div>
    </>
  );
}

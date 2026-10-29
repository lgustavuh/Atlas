-- =====================================================================
-- Permissões (Row Level Security)
-- A regra fica no banco: nenhuma tela consegue "esquecer" de verificar.
-- =====================================================================

insert into public.modulos (codigo, nome, grupo, ordem) values
  ('obras', 'Obras', 'Clientes', 10),
  ('republicas', 'Repúblicas', 'Clientes', 11),
  ('transporte_hospedagem', 'Transporte e hospedagem', 'Clientes', 12),
  ('localidade', 'Localidade', 'Cadastros', 20),
  ('fornecedores', 'Fornecedores', 'Cadastros', 21),
  ('cargos', 'Cargos', 'Departamento Pessoal', 30),
  ('colaboradores', 'Colaboradores', 'Departamento Pessoal', 31),
  ('profissional', 'Profissional', 'Departamento Pessoal', 32),
  ('classificacao', 'Classificação', 'Departamento Pessoal', 33),
  ('ferias', 'Férias', 'Departamento Pessoal', 34),
  ('atestados', 'Atestados', 'Departamento Pessoal', 35),
  ('advertencias', 'Advertências', 'Departamento Pessoal', 36),
  ('documentacao_colaboradores', 'Documentação de colaboradores', 'Departamento Pessoal', 37),
  ('documentos_padronizados', 'Documentos padronizados', 'Departamento Pessoal', 38),
  ('recrutamento_selecao', 'Recrutamento e seleção', 'Departamento Pessoal', 39),
  ('recrutamento_parametros', 'Parâmetros de recrutamento', 'Administração', 90),
  ('alerta_adm', 'Alertas administrativos', 'Departamento Pessoal', 40),
  ('alerta_adm_visualiza', 'Quem visualiza alertas', 'Administração', 91),
  ('seguranca', 'Segurança do trabalho', 'Segurança', 50),
  ('materiais', 'Materiais', 'Almoxarifado', 60),
  ('requisicao', 'Requisições', 'Compras', 61),
  ('pcl', 'Liberação de requisições', 'Compras', 62),
  ('orcamento', 'Orçamentos', 'Compras', 63),
  ('pedido', 'Pedidos de compra', 'Compras', 64),
  ('pca', 'Aprovação de pedidos', 'Compras', 65),
  ('situacao_compra_entrega', 'Situação da compra e entrega', 'Compras', 66),
  ('requisicao_recebimento', 'Recebimento', 'Compras', 67),
  ('pcla', 'Alçadas de liberação/aprovação', 'Administração', 92),
  ('veiculos', 'Veículos', 'Almoxarifado', 70),
  ('manutencao_veiculos', 'Manutenção de veículos', 'Almoxarifado', 71),
  ('biblioteca_download', 'Biblioteca padrão (consulta)', 'Documentos', 80),
  ('biblioteca_upload', 'Biblioteca padrão (envio)', 'Documentos', 81),
  ('biblioteca_areas', 'Áreas da biblioteca', 'Administração', 93),
  ('biblioteca_relacionamento', 'Acesso às áreas da biblioteca', 'Administração', 94),
  ('compartilhamentos', 'Compartilhamento de arquivos', 'Documentos', 82),
  ('usuarios', 'Usuários e permissões', 'Administração', 95),
  ('logs', 'Auditoria', 'Administração', 96);

insert into public.nrs (codigo, nome, validade_dias) values
  ('NR-10', 'Segurança em instalações e serviços em eletricidade', 730),
  ('NR-33', 'Segurança e saúde nos trabalhos em espaços confinados', 365),
  ('NR-35', 'Trabalho em altura', 730);

-- ---------------------------------------------------------------------
-- Habilita RLS em todas as tabelas do schema public
-- ---------------------------------------------------------------------
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Políticas padrão por módulo
--   ver: nível 2 · cadastrar: 4 · alterar: 3 · excluir: 5
--   "referência" = qualquer usuário logado pode ler (listas de seleção)
-- ---------------------------------------------------------------------
create or replace function pg_temp.politicas(p_tabela text, p_modulo text, p_leitura_livre boolean, p_status boolean)
returns void language plpgsql as $$
begin
  execute format('create policy ver on public.%I for select to authenticated using (%s)',
    p_tabela, case when p_leitura_livre then 'true' else format('public.tem_nivel(%L, 2)', p_modulo) end);
  execute format('create policy cadastrar on public.%I for insert to authenticated with check (public.tem_nivel(%L, 4))', p_tabela, p_modulo);
  execute format('create policy alterar on public.%I for update to authenticated using (public.tem_nivel(%L, 3)) with check (public.tem_nivel(%L, 3))', p_tabela, p_modulo, p_modulo);
  execute format('create policy excluir on public.%I for delete to authenticated using (public.tem_nivel(%L, 5))', p_tabela, p_modulo);
  if p_status then
    execute format('create trigger exigir_nivel_status before update of status on public.%I
                    for each row execute function public.tg_exigir_nivel_status(%L)', p_tabela, p_modulo);
  end if;
end $$;

select pg_temp.politicas(t, m, livre, st) from (values
  ('paises', 'localidade', true, true),
  ('estados', 'localidade', true, true),
  ('cidades', 'localidade', true, true),
  ('cargos', 'cargos', true, true),
  ('obras', 'obras', true, true),
  ('grupos_fornecedores', 'fornecedores', true, true),
  ('fornecedores', 'fornecedores', true, true),
  ('fornecedores_grupos', 'fornecedores', true, false),
  ('materiais_grupos', 'materiais', true, true),
  ('materiais', 'materiais', true, true),
  ('materiais_grupos_itens', 'materiais', true, false),
  ('nrs', 'seguranca', true, false),
  ('veiculos', 'veiculos', true, true),
  ('republicas', 'republicas', true, true),
  ('biblioteca_areas', 'biblioteca_areas', true, true),
  ('modelos_documentos', 'documentos_padronizados', true, true),
  -- dados pessoais: leitura só com nível no módulo
  ('colaboradores', 'colaboradores', false, true),
  ('colaborador_telefones', 'colaboradores', false, false),
  ('colaborador_dependentes', 'colaboradores', false, false),
  ('profissionais', 'profissional', false, true),
  ('classificacoes', 'classificacao', false, true),
  ('ferias', 'ferias', false, true),
  ('seguranca', 'seguranca', false, true),
  ('treinamentos_nr', 'seguranca', false, true),
  ('atestados', 'atestados', false, true),
  ('advertencias', 'advertencias', false, true),
  ('documentos_colaborador', 'documentacao_colaboradores', false, true),
  ('alertas', 'alerta_adm', false, true),
  ('alertas_excecoes', 'alerta_adm', false, true),
  ('alertas_visualizadores', 'alerta_adm_visualiza', false, false),
  ('recrutamento_parametros', 'recrutamento_parametros', false, false),
  ('manutencoes_veiculos', 'manutencao_veiculos', false, true),
  ('manutencoes_veiculos_arquivos', 'manutencao_veiculos', false, true),
  ('transporte_hospedagem', 'transporte_hospedagem', false, true),
  ('alcadas', 'pcla', false, true),
  ('biblioteca_area_usuarios', 'biblioteca_relacionamento', false, false)
) as v(t, m, livre, st);

-- ---------------------------------------------------------------------
-- Casos especiais
-- ---------------------------------------------------------------------
-- Módulos
create policy ver on public.modulos for select to authenticated using (true);

-- Cada usuário enxerga as próprias alçadas (para saber o que pode liberar/aprovar).
create policy ver_proprias on public.alcadas for select to authenticated using (usuario_id = auth.uid());

-- Usuários: cada um vê o próprio cadastro; gestão exige o módulo "usuarios".
create policy ver on public.usuarios for select to authenticated
  using (id = auth.uid() or public.tem_nivel('usuarios', 2));
create policy alterar on public.usuarios for update to authenticated
  using (public.tem_nivel('usuarios', 3))
  with check (public.tem_nivel('usuarios', 3) and (public.eh_admin() or admin = false));

create policy ver on public.permissoes for select to authenticated
  using (usuario_id = auth.uid() or public.tem_nivel('usuarios', 2));
create policy cadastrar on public.permissoes for insert to authenticated with check (public.tem_nivel('usuarios', 4));
create policy alterar on public.permissoes for update to authenticated using (public.tem_nivel('usuarios', 3));
create policy excluir on public.permissoes for delete to authenticated using (public.tem_nivel('usuarios', 5));

-- Downloads de documentos: registro automático, leitura por quem vê documentação.
create policy ver on public.documentos_colaborador_downloads for select to authenticated
  using (public.tem_nivel('documentacao_colaboradores', 2));
create policy cadastrar on public.documentos_colaborador_downloads for insert to authenticated
  with check (public.tem_nivel('documentacao_colaboradores', 2) and usuario_id = auth.uid());

-- Auditoria: somente leitura (gravada por gatilho).
create policy ver on public.auditoria for select to authenticated using (public.tem_nivel('logs', 2));

-- Biblioteca: precisa do módulo e de acesso à área.
create policy ver on public.biblioteca_documentos for select to authenticated
  using (public.tem_nivel('biblioteca_download', 2)
         and (public.tem_nivel('biblioteca_areas', 3)
              or exists (select 1 from public.biblioteca_area_usuarios a
                         where a.area_id = biblioteca_documentos.area_id and a.usuario_id = auth.uid())));
create policy cadastrar on public.biblioteca_documentos for insert to authenticated
  with check (public.tem_nivel('biblioteca_upload', 4));
create policy alterar on public.biblioteca_documentos for update to authenticated
  using (public.tem_nivel('biblioteca_upload', 3));
create policy excluir on public.biblioteca_documentos for delete to authenticated
  using (public.tem_nivel('biblioteca_upload', 5));
create trigger exigir_nivel_status before update of status on public.biblioteca_documentos
  for each row execute function public.tg_exigir_nivel_status('biblioteca_upload');

-- Compartilhamentos: quem enviou, o destinatário ou todos (para_usuario_id nulo).
create policy ver on public.compartilhamentos for select to authenticated
  using (public.tem_nivel('compartilhamentos', 2)
         and (de_usuario_id = auth.uid() or para_usuario_id = auth.uid() or para_usuario_id is null));
create policy cadastrar on public.compartilhamentos for insert to authenticated
  with check (public.tem_nivel('compartilhamentos', 4) and de_usuario_id = auth.uid());
create policy alterar on public.compartilhamentos for update to authenticated
  using (de_usuario_id = auth.uid() or public.tem_nivel('compartilhamentos', 5));

-- ---------------------------------------------------------------------
-- Compras: leitura para quem participa do fluxo; mudanças de etapa só pelas funções.
-- ---------------------------------------------------------------------
create or replace function public.participa_compras() returns boolean
language sql stable security definer set search_path = public as $$
  select public.tem_nivel_algum(array['requisicao', 'pcl', 'orcamento', 'pedido', 'pca',
                                      'situacao_compra_entrega', 'requisicao_recebimento', 'pcla'], 2)
$$;

do $$
declare t text;
begin
  foreach t in array array['requisicoes', 'requisicao_itens', 'requisicao_historico', 'orcamentos',
                           'orcamento_itens', 'pedidos', 'pedido_historico', 'requisicao_situacoes', 'recebimentos']
  loop
    execute format('create policy ver on public.%I for select to authenticated using (public.participa_compras())', t);
  end loop;
end $$;

-- Requisição: edição livre só enquanto "aberta".
create policy cadastrar on public.requisicoes for insert to authenticated
  with check (public.tem_nivel('requisicao', 4) and status = 'aberta');
create policy alterar on public.requisicoes for update to authenticated
  using (status = 'aberta' and (solicitante_id = auth.uid() or public.tem_nivel('requisicao', 3)))
  with check (status = 'aberta');

create policy cadastrar on public.requisicao_itens for insert to authenticated
  with check (public.tem_nivel('requisicao', 4) and exists (
    select 1 from public.requisicoes r where r.id = requisicao_id and r.status = 'aberta'));
create policy alterar on public.requisicao_itens for update to authenticated
  using (public.tem_nivel('requisicao', 3) and exists (
    select 1 from public.requisicoes r where r.id = requisicao_id and r.status = 'aberta'));
create policy excluir on public.requisicao_itens for delete to authenticated
  using (public.tem_nivel('requisicao', 3) and exists (
    select 1 from public.requisicoes r where r.id = requisicao_id and r.status = 'aberta'));

-- Orçamento: só para requisição liberada; edição enquanto "aberto".
create policy cadastrar on public.orcamentos for insert to authenticated
  with check (public.tem_nivel('orcamento', 4) and status = 'aberto' and exists (
    select 1 from public.requisicoes r where r.id = requisicao_id and r.status = 'liberada'));
create policy alterar on public.orcamentos for update to authenticated
  using (public.tem_nivel('orcamento', 3) and status = 'aberto') with check (status = 'aberto');
create policy excluir on public.orcamentos for delete to authenticated
  using (public.tem_nivel('orcamento', 5) and status = 'aberto');

create policy cadastrar on public.orcamento_itens for insert to authenticated
  with check (public.tem_nivel('orcamento', 4) and exists (
    select 1 from public.orcamentos o where o.id = orcamento_id and o.status = 'aberto'));
create policy alterar on public.orcamento_itens for update to authenticated
  using (public.tem_nivel('orcamento', 3) and exists (
    select 1 from public.orcamentos o where o.id = orcamento_id and o.status = 'aberto'));
create policy excluir on public.orcamento_itens for delete to authenticated
  using (public.tem_nivel('orcamento', 3) and exists (
    select 1 from public.orcamentos o where o.id = orcamento_id and o.status = 'aberto'));

-- Situação da compra e recebimento: lançamentos diretos.
create policy cadastrar on public.requisicao_situacoes for insert to authenticated
  with check (public.tem_nivel('situacao_compra_entrega', 4));
create policy alterar on public.requisicao_situacoes for update to authenticated
  using (public.tem_nivel('situacao_compra_entrega', 5));
-- (recebimentos e pedidos só mudam pelas funções de compras)

-- ---------------------------------------------------------------------
-- Nomes de colaboradores para listas de seleção, sem expor dados pessoais.
-- ---------------------------------------------------------------------
create or replace function public.colaboradores_opcoes(p_busca text default null, p_ids bigint[] default null, p_limite int default 30)
returns table (id bigint, nome text, apelido text)
language sql stable security definer set search_path = public as $$
  select c.id, c.nome, c.apelido
    from colaboradores c
   where auth.uid() is not null
     and (p_ids is null or c.id = any (p_ids))
     and (p_ids is not null or (c.status = 'ativo' and c.etapa_recrutamento is null))
     and (p_busca is null or sem_acento(c.nome) like '%' || sem_acento(p_busca) || '%'
          or sem_acento(c.apelido) like '%' || sem_acento(p_busca) || '%')
   order by c.nome
   limit case when p_ids is null then p_limite else null end
$$;

create or replace function public.usuarios_opcoes(p_busca text default null, p_ids uuid[] default null)
returns table (id uuid, nome text)
language sql stable security definer set search_path = public as $$
  select u.id, u.nome from usuarios u
   where auth.uid() is not null
     and (p_ids is null or u.id = any (p_ids))
     and (p_ids is not null or u.ativo)
     and (p_busca is null or sem_acento(u.nome) like '%' || sem_acento(p_busca) || '%')
   order by u.nome
   limit 50
$$;

revoke execute on function public.colaboradores_opcoes(text, bigint[], int) from anon;
revoke execute on function public.usuarios_opcoes(text, uuid[]) from anon;

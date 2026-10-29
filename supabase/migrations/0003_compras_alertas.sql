-- =====================================================================
-- Fluxo de compras, recrutamento, alertas e armazenamento de arquivos
-- =====================================================================

create or replace function public.exigir(p_condicao boolean, p_mensagem text) returns void
language plpgsql immutable as $$
begin
  if not coalesce(p_condicao, false) then
    raise exception '%', p_mensagem using errcode = '42501';
  end if;
end $$;

-- Valor em reais no formato brasileiro (1.234,56), independente do locale do servidor.
create or replace function public.brl(v numeric) returns text
language sql immutable as $$
  select translate(to_char(round(v, 2), 'FM999,999,999,990.00'), ',.', '.,')
$$;

-- Valor do pedido: Σ (quantidade × valor unitário + IPI) dos itens do pedido + frete.
-- (mesma regra usada na aprovação por alçada do sistema antigo)
create or replace function public.valor_pedido(p_pedido_id bigint) returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(i.quantidade * i.valor_unitario + i.valor_ipi), 0) + coalesce(max(o.valor_frete), 0)
    from pedidos p
    join orcamentos o on o.id = p.orcamento_id
    left join orcamento_itens i on i.orcamento_id = o.id and i.item_pedido
   where p.id = p_pedido_id
$$;

-- ---------------------------------------------------------------------
-- Requisição
-- ---------------------------------------------------------------------
create or replace function public.finalizar_requisicao(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare r requisicoes;
begin
  select * into r from requisicoes where id = p_id for update;
  perform exigir(found, 'Requisição não encontrada.');
  perform exigir(r.solicitante_id = auth.uid() or tem_nivel('requisicao', 3), 'Sem permissão para finalizar esta requisição.');
  perform exigir(r.status = 'aberta', 'Somente requisições abertas podem ser finalizadas.');
  perform exigir(exists (select 1 from requisicao_itens where requisicao_id = p_id), 'Inclua ao menos um item.');
  update requisicoes set status = 'aguardando_liberacao' where id = p_id;
  insert into requisicao_historico (requisicao_id, acao) values (p_id, 'finalizada');
end $$;

create or replace function public.reabrir_requisicao(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare r requisicoes;
begin
  select * into r from requisicoes where id = p_id for update;
  perform exigir(found, 'Requisição não encontrada.');
  perform exigir(r.solicitante_id = auth.uid() or tem_nivel('requisicao', 3), 'Sem permissão.');
  perform exigir(r.status in ('aguardando_liberacao', 'nao_liberada'), 'Esta requisição não pode ser reaberta.');
  update requisicoes set status = 'aberta' where id = p_id;
  update requisicao_itens set liberado = null where requisicao_id = p_id;
  insert into requisicao_historico (requisicao_id, acao) values (p_id, 'reaberta');
end $$;

create or replace function public.pode_liberar(p_obra_id bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select eh_admin() or (tem_nivel('pcl', 2) and exists (
    select 1 from alcadas where usuario_id = auth.uid() and obra_id = p_obra_id and pode_liberar and status = 'ativo'))
$$;

-- p_itens_negados: itens que não serão liberados (os demais são liberados).
create or replace function public.liberar_requisicao(p_id bigint, p_liberar boolean, p_motivo text default null,
                                                     p_itens_negados bigint[] default '{}')
returns void
language plpgsql security definer set search_path = public as $$
declare r requisicoes;
begin
  select * into r from requisicoes where id = p_id for update;
  perform exigir(found, 'Requisição não encontrada.');
  perform exigir(pode_liberar(r.obra_id), 'Você não tem alçada de liberação para esta obra.');
  perform exigir(r.status = 'aguardando_liberacao', 'A requisição não está aguardando liberação.');
  perform exigir(p_liberar or nullif(trim(p_motivo), '') is not null, 'Informe o motivo da não liberação.');

  update requisicao_itens
     set liberado = p_liberar and not (id = any (coalesce(p_itens_negados, '{}')))
   where requisicao_id = p_id;
  update requisicoes set status = case when p_liberar then 'liberada' else 'nao_liberada' end::requisicao_status
   where id = p_id;
  insert into requisicao_historico (requisicao_id, acao, motivo)
  values (p_id, case when p_liberar then 'liberada' else 'nao_liberada' end, p_motivo);
end $$;

create or replace function public.cancelar_requisicao(p_id bigint, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare r requisicoes;
begin
  select * into r from requisicoes where id = p_id for update;
  perform exigir(found, 'Requisição não encontrada.');
  perform exigir(tem_nivel('requisicao', 5), 'Sem permissão para cancelar requisições.');
  perform exigir(r.status not in ('concluida', 'cancelada'), 'Requisição já encerrada.');
  update requisicoes set status = 'cancelada' where id = p_id;
  insert into requisicao_historico (requisicao_id, acao, motivo) values (p_id, 'cancelada', p_motivo);
end $$;

-- ---------------------------------------------------------------------
-- Orçamento e pedido
-- ---------------------------------------------------------------------
create or replace function public.finalizar_orcamento(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare o orcamentos;
begin
  select * into o from orcamentos where id = p_id for update;
  perform exigir(found, 'Orçamento não encontrado.');
  perform exigir(tem_nivel('orcamento', 3), 'Sem permissão.');
  perform exigir(o.status = 'aberto', 'O orçamento já foi finalizado.');
  perform exigir(exists (select 1 from orcamento_itens where orcamento_id = p_id), 'Inclua os itens orçados.');
  update orcamentos set status = 'finalizado' where id = p_id;
end $$;

create or replace function public.reabrir_orcamento(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform exigir(tem_nivel('orcamento', 3), 'Sem permissão.');
  perform exigir(not exists (select 1 from pedidos where orcamento_id = p_id and status <> 'cancelado'),
                 'Já existe pedido para este orçamento.');
  update orcamentos set status = 'aberto' where id = p_id and status = 'finalizado';
end $$;

-- Gera o pedido com os itens escolhidos do orçamento.
create or replace function public.gerar_pedido(p_orcamento_id bigint, p_itens bigint[]) returns bigint
language plpgsql security definer set search_path = public as $$
declare o orcamentos; v_req requisicoes; v_id bigint;
begin
  select * into o from orcamentos where id = p_orcamento_id for update;
  perform exigir(found, 'Orçamento não encontrado.');
  perform exigir(tem_nivel('pedido', 4), 'Sem permissão para gerar pedidos.');
  perform exigir(o.status = 'finalizado', 'Finalize o orçamento antes de gerar o pedido.');
  select * into v_req from requisicoes where id = o.requisicao_id;
  perform exigir(v_req.status = 'liberada', 'A requisição precisa estar liberada.');
  perform exigir(coalesce(array_length(p_itens, 1), 0) > 0, 'Escolha ao menos um item.');
  perform exigir(not exists (select 1 from pedidos where orcamento_id = p_orcamento_id and status <> 'cancelado'),
                 'Já existe pedido para este orçamento.');

  update orcamento_itens set item_pedido = (id = any (p_itens)) where orcamento_id = p_orcamento_id;
  insert into pedidos (requisicao_id, orcamento_id, status) values (o.requisicao_id, o.id, 'aberto')
  returning id into v_id;
  insert into pedido_historico (pedido_id, acao, valor) values (v_id, 'gerado', valor_pedido(v_id));
  return v_id;
end $$;

create or replace function public.enviar_pedido_aprovacao(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare p pedidos;
begin
  select * into p from pedidos where id = p_id for update;
  perform exigir(found, 'Pedido não encontrado.');
  perform exigir(tem_nivel('pedido', 3), 'Sem permissão.');
  perform exigir(p.status in ('aberto', 'reprovado'), 'O pedido não pode ser enviado para aprovação.');
  update pedidos set status = 'aguardando_aprovacao' where id = p_id;
  insert into pedido_historico (pedido_id, acao, valor) values (p_id, 'enviado_aprovacao', valor_pedido(p_id));
end $$;

create or replace function public.limite_aprovacao(p_obra_id bigint) returns numeric
language sql stable security definer set search_path = public as $$
  select case when eh_admin() then null else (
    select max(valor_maximo) from alcadas
     where usuario_id = auth.uid() and obra_id = p_obra_id and pode_aprovar and status = 'ativo') end
$$;

create or replace function public.aprovar_pedido(p_id bigint, p_aprovar boolean, p_motivo text default null) returns void
language plpgsql security definer set search_path = public as $$
declare p pedidos; v_obra bigint; v_valor numeric; v_limite numeric;
begin
  select * into p from pedidos where id = p_id for update;
  perform exigir(found, 'Pedido não encontrado.');
  perform exigir(p.status = 'aguardando_aprovacao', 'O pedido não está aguardando aprovação.');
  select obra_id into v_obra from requisicoes where id = p.requisicao_id;
  v_valor := valor_pedido(p_id);

  if not eh_admin() then
    perform exigir(tem_nivel('pca', 2), 'Sem permissão para aprovar pedidos.');
    v_limite := limite_aprovacao(v_obra);
    perform exigir(v_limite is not null, 'Você não tem alçada de aprovação para esta obra.');
    if p_aprovar then
      perform exigir(v_valor <= v_limite,
        format('Valor do pedido (R$ %s) maior que seu limite de aprovação (R$ %s).',
               brl(v_valor), brl(v_limite)));
    end if;
  end if;
  perform exigir(p_aprovar or nullif(trim(p_motivo), '') is not null, 'Informe o motivo da reprovação.');

  update pedidos set status = case when p_aprovar then 'aprovado' else 'reprovado' end::pedido_status where id = p_id;
  insert into pedido_historico (pedido_id, acao, valor, motivo)
  values (p_id, case when p_aprovar then 'aprovado' else 'reprovado' end, v_valor, p_motivo);
end $$;

create or replace function public.cancelar_pedido(p_id bigint, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform exigir(tem_nivel('pedido', 5), 'Sem permissão para cancelar pedidos.');
  update pedidos set status = 'cancelado' where id = p_id and status <> 'cancelado';
  insert into pedido_historico (pedido_id, acao, motivo) values (p_id, 'cancelado', p_motivo);
end $$;

-- ---------------------------------------------------------------------
-- Recebimento na obra
-- ---------------------------------------------------------------------
create or replace function public.registrar_recebimento(p_item_id bigint, p_situacao recebimento_situacao,
                                                        p_nf_origem nf_origem default null, p_numero_nf text default null,
                                                        p_motivo text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_req bigint; v_status requisicao_status;
begin
  perform exigir(tem_nivel('requisicao_recebimento', 4), 'Sem permissão para registrar recebimentos.');
  select i.requisicao_id, r.status into v_req, v_status
    from requisicao_itens i join requisicoes r on r.id = i.requisicao_id where i.id = p_item_id;
  perform exigir(v_req is not null, 'Item não encontrado.');
  perform exigir(v_status = 'liberada', 'Só é possível receber itens de requisições liberadas.');
  perform exigir(p_situacao = 'atendido' or nullif(trim(p_motivo), '') is not null, 'Informe o motivo do não atendimento.');
  insert into recebimentos (requisicao_id, requisicao_item_id, nf_origem, numero_nf, situacao, motivo_nao_atendido)
  values (v_req, p_item_id, p_nf_origem, p_numero_nf, p_situacao, p_motivo)
  on conflict (requisicao_item_id) do update
     set nf_origem = excluded.nf_origem, numero_nf = excluded.numero_nf, situacao = excluded.situacao,
         motivo_nao_atendido = excluded.motivo_nao_atendido, usuario_id = auth.uid(), criado_em = now();
end $$;

create or replace function public.desfazer_recebimento(p_item_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform exigir(tem_nivel('requisicao_recebimento', 5), 'Sem permissão.');
  delete from recebimentos r using requisicoes q
   where r.requisicao_item_id = p_item_id and q.id = r.requisicao_id and q.status = 'liberada';
end $$;

create or replace function public.concluir_requisicao(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare r requisicoes;
begin
  select * into r from requisicoes where id = p_id for update;
  perform exigir(found, 'Requisição não encontrada.');
  perform exigir(tem_nivel('requisicao_recebimento', 4), 'Sem permissão.');
  perform exigir(r.status = 'liberada', 'A requisição não está liberada.');
  perform exigir(not exists (
    select 1 from requisicao_itens i
     where i.requisicao_id = p_id and i.liberado
       and not exists (select 1 from recebimentos x where x.requisicao_item_id = i.id)),
    'Registre o recebimento de todos os itens liberados antes de concluir.');
  update requisicoes set status = 'concluida', concluida_em = now(), concluida_por = auth.uid() where id = p_id;
  insert into requisicao_historico (requisicao_id, acao) values (p_id, 'concluida');
end $$;

create or replace function public.nome_usuario(p_id uuid) returns text
language sql stable security definer set search_path = public as $$
  select nome from usuarios where id = p_id and auth.uid() is not null
$$;
revoke execute on function public.nome_usuario(uuid) from anon;

-- Painel geral das requisições (antiga "Lista Requisições Status Geral").
create or replace view public.requisicoes_painel with (security_invoker = true) as
select r.id, r.data, r.urgente, r.status, r.obra_id, o.razao_social as obra, o.codigo as obra_codigo,
       r.solicitante_id, public.nome_usuario(r.solicitante_id) as solicitante,
       (select count(*) from requisicao_itens i where i.requisicao_id = r.id) as itens,
       (select count(*) from orcamentos x where x.requisicao_id = r.id and x.status <> 'cancelado') as orcamentos,
       (select p.status from pedidos p where p.requisicao_id = r.id and p.status <> 'cancelado'
         order by p.id desc limit 1) as pedido_status,
       (select s.situacao from requisicao_situacoes s where s.requisicao_id = r.id and s.status = 'ativo'
         order by s.id desc limit 1) as situacao_compra,
       (select count(*) from recebimentos x where x.requisicao_id = r.id) as itens_recebidos
  from requisicoes r
  join obras o on o.id = r.obra_id;

-- ---------------------------------------------------------------------
-- Recrutamento e seleção: etapa1 → etapa2 → etapa3 → efetivado
-- ---------------------------------------------------------------------
create or replace function public.pode_etapa(p_etapa int) returns boolean
language sql stable security definer set search_path = public as $$
  select eh_admin() or (tem_nivel('recrutamento_selecao', 3) and exists (
    select 1 from recrutamento_parametros p where p.usuario_id = auth.uid()
       and case p_etapa when 1 then p.etapa1 when 2 then p.etapa2 when 3 then p.etapa3 else p.etapa4 end))
$$;

create or replace function public.avancar_etapa(p_colaborador_id bigint) returns text
language plpgsql security definer set search_path = public as $$
declare c colaboradores; v_nova etapa_recrutamento;
begin
  select * into c from colaboradores where id = p_colaborador_id for update;
  perform exigir(found and c.etapa_recrutamento is not null, 'Candidato não encontrado.');
  case c.etapa_recrutamento
    when 'etapa1' then perform exigir(pode_etapa(1), 'Sem permissão na etapa 1.'); v_nova := 'etapa2';
    when 'etapa2' then perform exigir(pode_etapa(2), 'Sem permissão na etapa 2.'); v_nova := 'etapa3';
    else
      perform exigir(pode_etapa(4), 'Sem permissão para efetivar.');
      perform exigir(c.cpf is not null, 'Preencha o CPF antes de efetivar.');
      update colaboradores set etapa_recrutamento = null where id = p_colaborador_id;
      return 'efetivado';
  end case;
  update colaboradores set etapa_recrutamento = v_nova where id = p_colaborador_id;
  return v_nova::text;
end $$;

-- ---------------------------------------------------------------------
-- Alertas
-- ---------------------------------------------------------------------
-- Lança o alerta anual de contribuição sindical para colaboradores ativos sem exceção.
create or replace function public.lancar_alertas_contribuicao_sindical() returns int
language plpgsql security definer set search_path = public as $$
declare v_qtd int;
begin
  perform exigir(tem_nivel('alerta_adm', 6), 'Sem permissão para lançar alertas.');
  insert into alertas (colaborador_id, identificador, texto)
  select distinct p.colaborador_id, 'contribuicao_sindical',
         format('Verificar contribuição sindical de %s referente a %s.', c.nome, extract(year from now()))
    from profissionais p join colaboradores c on c.id = p.colaborador_id
   where p.status = 'ativo' and p.demissao is null and c.status = 'ativo' and c.etapa_recrutamento is null
     and not exists (select 1 from alertas_excecoes e where e.colaborador_id = p.colaborador_id
                        and e.identificador = 'contribuicao_sindical' and e.status = 'ativo')
     and not exists (select 1 from alertas a where a.colaborador_id = p.colaborador_id
                        and a.identificador = 'contribuicao_sindical'
                        and a.criado_em >= date_trunc('year', now()));
  get diagnostics v_qtd = row_count;
  return v_qtd;
end $$;

-- Nome do colaborador ativo (null se inativo/candidato) — sem expor o restante do cadastro.
create or replace function public.nome_colaborador_ativo(p_id bigint) returns text
language sql stable security definer set search_path = public as $$
  select nome from colaboradores
   where id = p_id and status = 'ativo' and etapa_recrutamento is null and auth.uid() is not null
$$;
revoke execute on function public.nome_colaborador_ativo(bigint) from anon;

-- Vencimentos dos próximos 60 dias (e vencidos) para o painel inicial.
-- security_invoker: cada usuário só enxerga as linhas que suas permissões permitem.
create or replace view public.vencimentos with (security_invoker = true) as
select * from (
  select 'NR' as tipo, t.nr as item, t.colaborador_id, public.nome_colaborador_ativo(t.colaborador_id) as referencia,
         t.data_vencimento as vencimento, '/colaboradores/' || t.colaborador_id as link
    from treinamentos_nr t
   where t.status = 'ativo' and t.data_vencimento <= current_date + 60
  union all
  select 'ASO', coalesce(s.tipo_aso, 'ASO'), s.colaborador_id, public.nome_colaborador_ativo(s.colaborador_id),
         s.data_aso + 365, '/colaboradores/' || s.colaborador_id
    from seguranca s
   where s.status = 'ativo' and s.data_aso + 365 <= current_date + 60
  union all
  select 'CNH', 'CNH ' || coalesce(c.cnh_categoria, ''), c.id, public.nome_colaborador_ativo(c.id), c.cnh_vencimento,
         '/colaboradores/' || c.id
    from colaboradores c
   where c.cnh_vencimento <= current_date + 60
  union all
  select 'Experiência', '1º período', p.colaborador_id, public.nome_colaborador_ativo(p.colaborador_id),
         p.primeira_experiencia, '/colaboradores/' || p.colaborador_id
    from profissionais p
   where p.status = 'ativo' and p.demissao is null and p.primeira_experiencia between current_date - 5 and current_date + 15
  union all
  select 'Experiência', '2º período', p.colaborador_id, public.nome_colaborador_ativo(p.colaborador_id),
         p.segunda_experiencia, '/colaboradores/' || p.colaborador_id
    from profissionais p
   where p.status = 'ativo' and p.demissao is null and p.segunda_experiencia between current_date - 5 and current_date + 15
  union all
  select 'Férias', 'Limite de férias', f.colaborador_id, public.nome_colaborador_ativo(f.colaborador_id), f.limite,
         '/colaboradores/' || f.colaborador_id
    from ferias f
   where f.status = 'ativo' and f.inicio_gozo is null and f.limite <= current_date + 60
  union all
  select 'Documento', d.nome_documento, d.colaborador_id, public.nome_colaborador_ativo(d.colaborador_id),
         coalesce(d.data_alerta, d.data_vencimento), '/colaboradores/' || d.colaborador_id
    from documentos_colaborador d
   where d.status = 'ativo' and d.ha_vencimento and coalesce(d.data_alerta, d.data_vencimento) <= current_date + 30
) pessoas
where referencia is not null
union all
select 'Seguro', 'Seguro do veículo', null, v.modelo || ' ' || coalesce(v.placa, ''), v.seguro_termino, '/m/veiculos/' || v.id
  from veiculos v
 where v.status = 'ativo' and v.seguro_termino <= current_date + 30
union all
select 'República', 'Entrega do imóvel', null, r.nome, coalesce(r.data_alerta, r.data_previsao_entrega), '/m/republicas/' || r.id
  from republicas r
 where r.status = 'ativo' and not r.entrega_concluida and coalesce(r.data_alerta, r.data_previsao_entrega) <= current_date + 30
union all
select 'Fornecedor', 'Revisar cadastro', null, f.razao_social, f.data_alerta, '/m/fornecedores/' || f.id
  from fornecedores f
 where f.status = 'ativo' and f.data_alerta <= current_date + 15;

-- ---------------------------------------------------------------------
-- Armazenamento de arquivos (bucket privado; acesso pela pasta inicial)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('arquivos', 'arquivos', false, 52428800)
on conflict (id) do nothing;

create or replace function public.modulo_da_pasta(p_nome text) returns text
language sql immutable as $$
  select case split_part(p_nome, '/', 1)
    when 'colaboradores' then 'colaboradores'
    when 'documentos' then 'documentacao_colaboradores'
    when 'atestados' then 'atestados'
    when 'biblioteca' then 'biblioteca_upload'
    when 'compartilhamentos' then 'compartilhamentos'
    when 'veiculos' then 'manutencao_veiculos'
  end
$$;

create policy "arquivos: ler" on storage.objects for select to authenticated
  using (bucket_id = 'arquivos' and (
    public.tem_nivel(public.modulo_da_pasta(name), 2)
    or (split_part(name, '/', 1) = 'biblioteca' and public.tem_nivel('biblioteca_download', 2))));
create policy "arquivos: enviar" on storage.objects for insert to authenticated
  with check (bucket_id = 'arquivos' and public.tem_nivel(public.modulo_da_pasta(name), 4));
create policy "arquivos: excluir" on storage.objects for delete to authenticated
  using (bucket_id = 'arquivos' and public.tem_nivel(public.modulo_da_pasta(name), 5));

-- Funções de negócio não são para visitantes anônimos.
do $$
declare f text;
begin
  foreach f in array array[
    'finalizar_requisicao(bigint)', 'reabrir_requisicao(bigint)', 'liberar_requisicao(bigint, boolean, text, bigint[])',
    'cancelar_requisicao(bigint, text)', 'finalizar_orcamento(bigint)', 'reabrir_orcamento(bigint)',
    'gerar_pedido(bigint, bigint[])', 'enviar_pedido_aprovacao(bigint)', 'aprovar_pedido(bigint, boolean, text)',
    'cancelar_pedido(bigint, text)', 'registrar_recebimento(bigint, recebimento_situacao, nf_origem, text, text)',
    'desfazer_recebimento(bigint)', 'concluir_requisicao(bigint)', 'avancar_etapa(bigint)',
    'lancar_alertas_contribuicao_sindical()', 'valor_pedido(bigint)', 'limite_aprovacao(bigint)', 'pode_liberar(bigint)']
  loop
    execute format('revoke execute on function public.%s from anon, public', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

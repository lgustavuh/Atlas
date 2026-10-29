'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { EstadoAcao } from '@/components/FormAcao';
import { mensagemErro } from '@/lib/erros';
import { avisarAprovacao, avisarLiberacao, avisarPedidoParaAprovacao, avisarRequisicaoFinalizada } from '@/lib/notificar';
import { supabaseServidor } from '@/lib/supabase/server';

const txt = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? '').trim();
  return v || null;
};
const num = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? '').trim();
  if (!v) return null;
  const n = Number(v.includes(',') ? v.replace(/\./g, '').replace(',', '.') : v);
  return Number.isFinite(n) ? n : null;
};

function feito(reqId: number | string, ok = 'Salvo.'): EstadoAcao {
  revalidatePath(`/compras/${reqId}`);
  revalidatePath('/compras');
  return { ok };
}

// ------------------------------------------------------------------ Requisição
export async function criarRequisicao(_: EstadoAcao, f: FormData): Promise<EstadoAcao> {
  const obra = num(f, 'obra_id');
  if (!obra) return { erro: 'Escolha a obra que receberá os materiais.' };
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.from('requisicoes')
    .insert({ obra_id: obra, urgente: f.get('urgente') === 'on', obs: txt(f, 'obs') }).select('id').single();
  if (error) return { erro: mensagemErro(error) };
  redirect(`/compras/${data.id}`);
}

export async function salvarCabecalho(reqId: number, _: EstadoAcao, f: FormData): Promise<EstadoAcao> {
  const supabase = await supabaseServidor();
  const { error } = await supabase.from('requisicoes')
    .update({ obra_id: num(f, 'obra_id'), urgente: f.get('urgente') === 'on', obs: txt(f, 'obs') }).eq('id', reqId);
  return error ? { erro: mensagemErro(error) } : feito(reqId);
}

export async function adicionarItem(reqId: number, _: EstadoAcao, f: FormData): Promise<EstadoAcao> {
  const material = num(f, 'material_id');
  const quantidade = num(f, 'quantidade');
  if (!material) return { erro: 'Escolha o material.' };
  if (!quantidade || quantidade <= 0) return { erro: 'Informe a quantidade.' };
  const supabase = await supabaseServidor();
  const { error } = await supabase.from('requisicao_itens').insert({
    requisicao_id: reqId, material_id: material, grupo_id: num(f, 'grupo_id'), quantidade,
    unidade: txt(f, 'unidade'), obs: txt(f, 'obs'),
  });
  return error ? { erro: mensagemErro(error) } : feito(reqId, 'Item incluído.');
}

export async function removerItem(reqId: number, itemId: number) {
  const supabase = await supabaseServidor();
  const { error } = await supabase.from('requisicao_itens').delete().eq('id', itemId);
  if (error) return { erro: mensagemErro(error) };
  feito(reqId);
  return { ok: true };
}

async function rpc(nome: string, args: Record<string, unknown>) {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.rpc(nome, args);
  return { data, erro: error ? mensagemErro(error) : undefined };
}

async function requisicao(id: number) {
  const supabase = await supabaseServidor();
  const { data } = await supabase.from('requisicoes').select('id, obra_id, urgente, solicitante_id').eq('id', id).single();
  return data!;
}

export async function finalizarRequisicao(reqId: number) {
  const { erro } = await rpc('finalizar_requisicao', { p_id: reqId });
  if (erro) return { erro };
  await avisarRequisicaoFinalizada(await requisicao(reqId));
  feito(reqId);
  return { ok: true };
}

export async function reabrirRequisicao(reqId: number) {
  const { erro } = await rpc('reabrir_requisicao', { p_id: reqId });
  if (erro) return { erro };
  feito(reqId);
  return { ok: true };
}

export async function liberarRequisicao(reqId: number, _: EstadoAcao, f: FormData): Promise<EstadoAcao> {
  const liberar = f.get('decisao') === 'liberar';
  const negados = f.getAll('negar').map(Number).filter(Boolean);
  const motivo = txt(f, 'motivo');
  const { erro } = await rpc('liberar_requisicao', { p_id: reqId, p_liberar: liberar, p_motivo: motivo, p_itens_negados: negados });
  if (erro) return { erro };
  await avisarLiberacao(await requisicao(reqId), liberar, motivo ?? undefined);
  return feito(reqId, liberar ? 'Requisição liberada.' : 'Requisição não liberada.');
}

export async function cancelarRequisicao(reqId: number, _: EstadoAcao, f: FormData): Promise<EstadoAcao> {
  const { erro } = await rpc('cancelar_requisicao', { p_id: reqId, p_motivo: txt(f, 'motivo') });
  return erro ? { erro } : feito(reqId, 'Requisição cancelada.');
}

// ------------------------------------------------------------------ Orçamento
export async function criarOrcamento(reqId: number, _: EstadoAcao, f: FormData): Promise<EstadoAcao> {
  const fornecedor = num(f, 'fornecedor_id');
  if (!fornecedor) return { erro: 'Escolha o fornecedor.' };
  const supabase = await supabaseServidor();
  const { data: orc, error } = await supabase.from('orcamentos').insert({
    requisicao_id: reqId, fornecedor_id: fornecedor, tipo_condicao_pagamento: txt(f, 'tipo_condicao_pagamento'),
    condicao_pagamento: txt(f, 'condicao_pagamento'), prazo_entrega: txt(f, 'prazo_entrega'), tipo_frete: txt(f, 'tipo_frete'),
    frete_cidade_id: num(f, 'frete_cidade_id'), valor_frete: num(f, 'valor_frete') ?? 0, obs: txt(f, 'obs'),
  }).select('id').single();
  if (error) return { erro: mensagemErro(error) };

  // já cria as linhas do orçamento com os itens liberados da requisição
  const { data: itens } = await supabase.from('requisicao_itens').select('id, quantidade, unidade').eq('requisicao_id', reqId).eq('liberado', true);
  if (itens?.length) {
    const { error: e2 } = await supabase.from('orcamento_itens').insert(
      itens.map((i) => ({ orcamento_id: orc.id, requisicao_item_id: i.id, quantidade: i.quantidade, unidade: i.unidade })),
    );
    if (e2) return { erro: mensagemErro(e2) };
  }
  return feito(reqId, 'Orçamento criado. Preencha os valores.');
}

export async function salvarValoresOrcamento(reqId: number, orcId: number, _: EstadoAcao, f: FormData): Promise<EstadoAcao> {
  const supabase = await supabaseServidor();
  const { error: e0 } = await supabase.from('orcamentos').update({
    tipo_condicao_pagamento: txt(f, 'tipo_condicao_pagamento'), condicao_pagamento: txt(f, 'condicao_pagamento'),
    prazo_entrega: txt(f, 'prazo_entrega'), tipo_frete: txt(f, 'tipo_frete'), valor_frete: num(f, 'valor_frete') ?? 0, obs: txt(f, 'obs'),
  }).eq('id', orcId);
  if (e0) return { erro: mensagemErro(e0) };

  const ids = f.getAll('item').map(Number);
  for (const id of ids) {
    const qtd = num(f, `qtd_${id}`) ?? 0;
    const vu = num(f, `vu_${id}`) ?? 0;
    const base = qtd * vu;
    const perc = (k: string) => num(f, `${k}_${id}`) ?? 0;
    const p = { ipi: perc('ipi'), icms: perc('icms'), pis: perc('pis'), cofins: perc('cofins'), issqn: perc('issqn') };
    const { error } = await supabase.from('orcamento_itens').update({
      quantidade: qtd, unidade: txt(f, `un_${id}`), valor_unitario: vu,
      perc_ipi: p.ipi, perc_icms: p.icms, perc_pis: p.pis, perc_cofins: p.cofins, perc_issqn: p.issqn,
      valor_ipi: +(base * p.ipi / 100).toFixed(3), valor_icms: +(base * p.icms / 100).toFixed(3),
      valor_pis: +(base * p.pis / 100).toFixed(3), valor_cofins: +(base * p.cofins / 100).toFixed(3),
      valor_issqn: +(base * p.issqn / 100).toFixed(3),
    }).eq('id', id).eq('orcamento_id', orcId);
    if (error) return { erro: mensagemErro(error) };
  }
  return feito(reqId, 'Valores salvos.');
}

export async function finalizarOrcamento(reqId: number, orcId: number) {
  const { erro } = await rpc('finalizar_orcamento', { p_id: orcId });
  if (erro) return { erro };
  feito(reqId);
  return { ok: true };
}

export async function reabrirOrcamento(reqId: number, orcId: number) {
  const { erro } = await rpc('reabrir_orcamento', { p_id: orcId });
  if (erro) return { erro };
  feito(reqId);
  return { ok: true };
}

export async function excluirOrcamento(reqId: number, orcId: number) {
  const supabase = await supabaseServidor();
  const { error } = await supabase.from('orcamentos').delete().eq('id', orcId);
  if (error) return { erro: mensagemErro(error) };
  feito(reqId);
  return { ok: true };
}

// ------------------------------------------------------------------ Pedido
export async function gerarPedido(reqId: number, orcId: number, _: EstadoAcao, f: FormData): Promise<EstadoAcao> {
  const itens = f.getAll('pedir').map(Number).filter(Boolean);
  const { erro } = await rpc('gerar_pedido', { p_orcamento_id: orcId, p_itens: itens });
  return erro ? { erro } : feito(reqId, 'Pedido gerado.');
}

export async function enviarParaAprovacao(reqId: number, pedidoId: number) {
  const { erro } = await rpc('enviar_pedido_aprovacao', { p_id: pedidoId });
  if (erro) return { erro };
  await avisarPedidoParaAprovacao(pedidoId, await requisicao(reqId));
  feito(reqId);
  return { ok: true };
}

export async function decidirPedido(reqId: number, pedidoId: number, _: EstadoAcao, f: FormData): Promise<EstadoAcao> {
  const aprovar = f.get('decisao') === 'aprovar';
  const motivo = txt(f, 'motivo');
  const { erro } = await rpc('aprovar_pedido', { p_id: pedidoId, p_aprovar: aprovar, p_motivo: motivo });
  if (erro) return { erro };
  const supabase = await supabaseServidor();
  const { data: p } = await supabase.from('pedidos').select('criado_por').eq('id', pedidoId).single();
  await avisarAprovacao(pedidoId, p?.criado_por ?? null, reqId, aprovar, motivo ?? undefined);
  return feito(reqId, aprovar ? 'Pedido aprovado.' : 'Pedido reprovado.');
}

export async function cancelarPedido(reqId: number, pedidoId: number, _: EstadoAcao, f: FormData): Promise<EstadoAcao> {
  const { erro } = await rpc('cancelar_pedido', { p_id: pedidoId, p_motivo: txt(f, 'motivo') });
  return erro ? { erro } : feito(reqId, 'Pedido cancelado.');
}

// ------------------------------------------------------------------ Entrega e recebimento
export async function registrarSituacao(reqId: number, _: EstadoAcao, f: FormData): Promise<EstadoAcao> {
  const situacao = txt(f, 'situacao');
  if (!situacao) return { erro: 'Escolha a situação.' };
  const supabase = await supabaseServidor();
  const { error } = await supabase.from('requisicao_situacoes').insert({ requisicao_id: reqId, situacao, obs: txt(f, 'obs') });
  return error ? { erro: mensagemErro(error) } : feito(reqId, 'Situação registrada.');
}

export async function registrarRecebimento(reqId: number, itemId: number, _: EstadoAcao, f: FormData): Promise<EstadoAcao> {
  const { erro } = await rpc('registrar_recebimento', {
    p_item_id: itemId, p_situacao: f.get('situacao') === 'nao_atendido' ? 'nao_atendido' : 'atendido',
    p_nf_origem: txt(f, 'nf_origem'), p_numero_nf: txt(f, 'numero_nf'), p_motivo: txt(f, 'motivo'),
  });
  return erro ? { erro } : feito(reqId, 'Recebimento registrado.');
}

export async function desfazerRecebimento(reqId: number, itemId: number) {
  const { erro } = await rpc('desfazer_recebimento', { p_item_id: itemId });
  if (erro) return { erro };
  feito(reqId);
  return { ok: true };
}

export async function concluirRequisicao(reqId: number) {
  const { erro } = await rpc('concluir_requisicao', { p_id: reqId });
  if (erro) return { erro };
  feito(reqId);
  return { ok: true };
}

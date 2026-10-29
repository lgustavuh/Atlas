import { notFound, redirect } from 'next/navigation';
import { BotaoAcao } from '@/components/BotaoAcao';
import { FormAcao } from '@/components/FormAcao';
import { SelecaoRef } from '@/components/SelecaoRef';
import { Cabecalho, Cartao, Dado, Selo, Vazio } from '@/components/ui';
import { ACOES_HISTORICO, CONDICOES_PAGAMENTO, SITUACAO_COMPRA, STATUS_PEDIDO, STATUS_REQUISICAO, totalOrcamento } from '@/lib/compras';
import { buscarOpcoes } from '@/lib/crud';
import { fmtDataHora, fmtMoeda, fmtNumero } from '@/lib/formatar';
import { exigirSessao, participaCompras, pode } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';
import * as A from '../acoes';

export const metadata = { title: 'Requisição de compra' };

export default async function Requisicao({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const sessao = await exigirSessao();
  if (!participaCompras(sessao)) redirect('/sem-acesso');
  const supabase = await supabaseServidor();

  const { data: req } = await supabase.from('requisicoes').select('*, obras(codigo, razao_social)').eq('id', id).maybeSingle();
  if (!req) notFound();

  const [itensR, histR, orcR, pedR, sitR, recR, libR, limR] = await Promise.all([
    supabase.from('requisicao_itens').select('*, materiais(nome), materiais_grupos(nome)').eq('requisicao_id', id).order('id'),
    supabase.from('requisicao_historico').select('*').eq('requisicao_id', id).order('criado_em'),
    supabase.from('orcamentos').select('*, fornecedores(razao_social, nome_usual), orcamento_itens(*)').eq('requisicao_id', id).order('id'),
    supabase.from('pedidos').select('*, pedido_historico(*)').eq('requisicao_id', id).order('id'),
    supabase.from('requisicao_situacoes').select('*').eq('requisicao_id', id).eq('status', 'ativo').order('criado_em'),
    supabase.from('recebimentos').select('*').eq('requisicao_id', id),
    supabase.rpc('pode_liberar', { p_obra_id: req.obra_id }),
    supabase.rpc('limite_aprovacao', { p_obra_id: req.obra_id }),
  ]);
  const itens = (itensR.data as any[]) ?? [];
  const orcamentos = (orcR.data as any[]) ?? [];
  const pedidos = (pedR.data as any[]) ?? [];
  const recebimentos = Object.fromEntries(((recR.data as any[]) ?? []).map((r) => [r.requisicao_item_id, r]));
  const podeLiberar = !!libR.data;
  const limite = limR.data as number | null;
  const podeAprovar = sessao.admin || (pode(sessao, 'pca', 2) && limite !== null);

  // nomes de quem agiu em cada etapa
  const idsUsuarios = new Set<string>([req.solicitante_id, ...((histR.data ?? []) as any[]).map((h) => h.usuario_id),
    ...pedidos.flatMap((p) => p.pedido_historico.map((h: any) => h.usuario_id)), ...((sitR.data ?? []) as any[]).map((s) => s.usuario_id)].filter(Boolean));
  const nomes = Object.fromEntries((await buscarOpcoes('usuarios', undefined, [...idsUsuarios])).map((o) => [o.valor, o.rotulo]));

  const st = req.status as string;
  const aberta = st === 'aberta';
  const souSolicitante = req.solicitante_id === sessao.id;
  const pedidoAtivo = pedidos.find((p) => p.status !== 'cancelado');
  const itemDoOrc = Object.fromEntries(itens.map((i) => [i.id, i]));
  const historico = [
    ...((histR.data ?? []) as any[]).map((h) => ({ ...h, origem: 'Requisição' })),
    ...pedidos.flatMap((p) => p.pedido_historico.map((h: any) => ({ ...h, origem: `Pedido nº ${p.id}` }))),
  ].sort((a, b) => a.criado_em.localeCompare(b.criado_em));

  return (
    <>
      <Cabecalho voltar="/compras"
        titulo={<span className="flex flex-wrap items-center gap-2">Requisição nº {id}
          <Selo cor={STATUS_REQUISICAO[st].cor}>{STATUS_REQUISICAO[st].rotulo}</Selo>
          {req.urgente && <Selo cor="vermelho">urgente</Selo>}</span>}
        subtitulo={`Obra ${req.obras?.codigo} - ${req.obras?.razao_social} · aberta em ${fmtDataHora(req.data)}${req.solicitante_id ? ` por ${nomes[req.solicitante_id] ?? ''}` : ''}`}
        acoes={
          <>
            {aberta && (souSolicitante || pode(sessao, 'requisicao', 3)) && (
              <BotaoAcao variante="primario" acao={A.finalizarRequisicao.bind(null, id)} confirmar="Finalizar e enviar para liberação?">Finalizar e enviar para liberação</BotaoAcao>
            )}
            {['aguardando_liberacao', 'nao_liberada'].includes(st) && (souSolicitante || pode(sessao, 'requisicao', 3)) && (
              <BotaoAcao acao={A.reabrirRequisicao.bind(null, id)}>Reabrir para edição</BotaoAcao>
            )}
            {st === 'liberada' && pode(sessao, 'requisicao_recebimento', 4) && (
              <BotaoAcao variante="sucesso" acao={A.concluirRequisicao.bind(null, id)} confirmar="Concluir a requisição? Todos os itens liberados devem ter recebimento registrado.">Concluir requisição</BotaoAcao>
            )}
          </>
        } />

      <div className="space-y-5">
        {/* ---------------------------------------------------------- Itens */}
        <Cartao titulo={`Itens (${itens.length})`}>
          {itens.length === 0 ? <Vazio>Nenhum item. Inclua os materiais abaixo.</Vazio> : (
            <div className="-mx-4 overflow-x-auto">
              <table className="tabela">
                <thead><tr><th>Material</th><th>Grupo</th><th className="text-right">Qtd.</th><th>Unid.</th><th>Obs.</th><th>Liberação</th><th>Recebimento</th><th /></tr></thead>
                <tbody>
                  {itens.map((i) => {
                    const rec = recebimentos[i.id];
                    return (
                      <tr key={i.id}>
                        <td className="font-medium">{i.materiais?.nome}</td>
                        <td>{i.materiais_grupos?.nome}</td>
                        <td className="text-right">{fmtNumero(i.quantidade)}</td>
                        <td>{i.unidade}</td>
                        <td className="max-w-xs text-xs text-slate-600">{i.obs}</td>
                        <td>{i.liberado === true ? <Selo cor="verde">liberado</Selo> : i.liberado === false ? <Selo cor="vermelho">negado</Selo> : <span className="text-slate-300">—</span>}</td>
                        <td>{rec ? <Selo cor={rec.situacao === 'atendido' ? 'verde' : 'vermelho'}>{rec.situacao === 'atendido' ? 'recebido' : 'não atendido'}</Selo> : <span className="text-slate-300">—</span>}</td>
                        <td className="text-right">{aberta && pode(sessao, 'requisicao', 3) && <BotaoAcao pequeno variante="fantasma" acao={A.removerItem.bind(null, id, i.id)}>remover</BotaoAcao>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {aberta && pode(sessao, 'requisicao', 4) && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <FormAcao acao={A.adicionarItem.bind(null, id)} rotulo="Incluir item" limparAoSalvar>
                <div className="grid gap-3 sm:grid-cols-6">
                  <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium">Material *</label><SelecaoRef nome="material_id" refChave="materiais" obrigatorio /></div>
                  <div className="sm:col-span-1"><label className="mb-1 block text-xs font-medium">Grupo</label><SelecaoRef nome="grupo_id" refChave="materiais_grupos" /></div>
                  <div><label className="mb-1 block text-xs font-medium">Quantidade *</label><input name="quantidade" required inputMode="decimal" className="campo-input" /></div>
                  <div><label className="mb-1 block text-xs font-medium">Unidade</label><input name="unidade" placeholder="UN, M, KG..." className="campo-input" /></div>
                  <div><label className="mb-1 block text-xs font-medium">Obs.</label><input name="obs" className="campo-input" /></div>
                </div>
              </FormAcao>
            </div>
          )}
        </Cartao>

        {req.obs && <Cartao titulo="Observações"><p className="text-sm whitespace-pre-wrap">{req.obs}</p></Cartao>}

        {/* ---------------------------------------------------------- Liberação */}
        {st === 'aguardando_liberacao' && podeLiberar && (
          <Cartao titulo="Liberação">
            <FormAcao acao={A.liberarRequisicao.bind(null, id)} rotulo="Confirmar decisão">
              <fieldset className="flex gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="radio" name="decisao" value="liberar" defaultChecked /> Liberar</label>
                <label className="flex items-center gap-2"><input type="radio" name="decisao" value="negar" /> Não liberar</label>
              </fieldset>
              <div>
                <p className="mb-1 text-sm font-medium">Itens que <b>não</b> serão liberados (opcional)</p>
                <div className="grid gap-1 sm:grid-cols-2">
                  {itens.map((i) => (
                    <label key={i.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="negar" value={i.id} /> {i.materiais?.nome} — {fmtNumero(i.quantidade)} {i.unidade}</label>
                  ))}
                </div>
              </div>
              <div><label className="mb-1 block text-sm font-medium">Motivo (obrigatório se não liberar)</label><textarea name="motivo" rows={2} className="campo-input" /></div>
            </FormAcao>
          </Cartao>
        )}
        {st === 'aguardando_liberacao' && !podeLiberar && <Cartao><p className="text-sm text-slate-600">Aguardando liberação por quem tem alçada nesta obra.</p></Cartao>}

        {/* ---------------------------------------------------------- Orçamentos */}
        {(['liberada', 'concluida'].includes(st) || orcamentos.length > 0) && (
          <Cartao titulo={`Orçamentos (${orcamentos.length})`}>
            {orcamentos.length >= 2 && <MapaComparativo orcamentos={orcamentos} itens={itemDoOrc} />}
            <div className="space-y-4">
              {orcamentos.map((o) => {
                const editavel = o.status === 'aberto' && pode(sessao, 'orcamento', 3);
                const total = totalOrcamento(o.orcamento_itens, o.valor_frete);
                const temPedido = pedidos.some((p) => p.orcamento_id === o.id && p.status !== 'cancelado');
                return (
                  <div key={o.id} className="rounded-md border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
                      <div className="text-sm">
                        <b>Orçamento nº {o.id}</b> — {o.fornecedores?.nome_usual || o.fornecedores?.razao_social || 'fornecedor não informado'}
                        <span className="ml-2"><Selo cor={o.status === 'finalizado' ? 'azul' : 'cinza'}>{o.status}</Selo></span>
                        {temPedido && <span className="ml-1"><Selo cor="verde">com pedido</Selo></span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold">Total: {fmtMoeda(total)}</span>
                        {o.status === 'aberto' && pode(sessao, 'orcamento', 3) && <BotaoAcao pequeno variante="primario" acao={A.finalizarOrcamento.bind(null, id, o.id)}>Finalizar</BotaoAcao>}
                        {o.status === 'finalizado' && !temPedido && pode(sessao, 'orcamento', 3) && <BotaoAcao pequeno acao={A.reabrirOrcamento.bind(null, id, o.id)}>Reabrir</BotaoAcao>}
                        {o.status === 'aberto' && pode(sessao, 'orcamento', 5) && <BotaoAcao pequeno variante="perigo" acao={A.excluirOrcamento.bind(null, id, o.id)} confirmar="Excluir este orçamento?">Excluir</BotaoAcao>}
                      </div>
                    </div>
                    <div className="p-3">
                      {editavel ? (
                        <FormAcao acao={A.salvarValoresOrcamento.bind(null, id, o.id)} rotulo="Salvar valores">
                          <CondicoesOrcamento o={o} />
                          <div className="-mx-3 overflow-x-auto">
                            <table className="tabela">
                              <thead><tr><th>Material</th><th>Qtd.</th><th>Unid.</th><th>Valor unit.</th><th>IPI %</th><th>ICMS %</th><th>PIS %</th><th>COFINS %</th><th>ISSQN %</th></tr></thead>
                              <tbody>
                                {o.orcamento_itens.map((oi: any) => (
                                  <tr key={oi.id}>
                                    <td className="min-w-40">{itemDoOrc[oi.requisicao_item_id]?.materiais?.nome}<input type="hidden" name="item" value={oi.id} /></td>
                                    <td><input name={`qtd_${oi.id}`} defaultValue={oi.quantidade} className="campo-input w-20" inputMode="decimal" /></td>
                                    <td><input name={`un_${oi.id}`} defaultValue={oi.unidade ?? ''} className="campo-input w-16" /></td>
                                    <td><input name={`vu_${oi.id}`} defaultValue={oi.valor_unitario} className="campo-input w-28" inputMode="decimal" /></td>
                                    {['ipi', 'icms', 'pis', 'cofins', 'issqn'].map((t) => (
                                      <td key={t}><input name={`${t}_${oi.id}`} defaultValue={oi[`perc_${t}`]} className="campo-input w-16" inputMode="decimal" /></td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </FormAcao>
                      ) : (
                        <>
                          <dl className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-5">
                            <Dado rotulo="Pagamento">{[o.tipo_condicao_pagamento, o.condicao_pagamento].filter(Boolean).join(' · ')}</Dado>
                            <Dado rotulo="Prazo de entrega">{o.prazo_entrega}</Dado>
                            <Dado rotulo="Frete">{[o.tipo_frete, fmtMoeda(o.valor_frete)].filter(Boolean).join(' · ')}</Dado>
                            <Dado rotulo="Data">{fmtDataHora(o.data)}</Dado>
                            <Dado rotulo="Obs.">{o.obs}</Dado>
                          </dl>
                          {o.status === 'finalizado' && !temPedido && st === 'liberada' && pode(sessao, 'pedido', 4) ? (
                            <FormAcao acao={A.gerarPedido.bind(null, id, o.id)} rotulo="Gerar pedido com os itens marcados" variante="sucesso">
                              <TabelaItensOrc o={o} itens={itemDoOrc} selecionavel />
                            </FormAcao>
                          ) : <TabelaItensOrc o={o} itens={itemDoOrc} />}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {st === 'liberada' && pode(sessao, 'orcamento', 4) && (
              <details className="mt-4 rounded-md border border-dashed border-slate-300 p-3">
                <summary className="cursor-pointer text-sm font-medium text-marca-700">+ Novo orçamento</summary>
                <div className="mt-3">
                  <FormAcao acao={A.criarOrcamento.bind(null, id)} rotulo="Criar orçamento">
                    <div><label className="mb-1 block text-sm font-medium">Fornecedor *</label><SelecaoRef nome="fornecedor_id" refChave="fornecedores" obrigatorio /></div>
                    <CondicoesOrcamento o={{}} />
                  </FormAcao>
                </div>
              </details>
            )}
          </Cartao>
        )}

        {/* ---------------------------------------------------------- Pedido */}
        {pedidos.length > 0 && (
          <Cartao titulo="Pedido de compra">
            <div className="space-y-4">
              {pedidos.map((p) => {
                const o = orcamentos.find((x) => x.id === p.orcamento_id);
                const valor = o ? totalOrcamento(o.orcamento_itens, o.valor_frete, true) : 0;
                return (
                  <div key={p.id} className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <b>Pedido nº {p.id}</b>
                      <Selo cor={STATUS_PEDIDO[p.status].cor}>{STATUS_PEDIDO[p.status].rotulo}</Selo>
                      <span>Orçamento nº {p.orcamento_id} · <b>{fmtMoeda(valor)}</b></span>
                      {['aberto', 'reprovado'].includes(p.status) && pode(sessao, 'pedido', 3) && (
                        <BotaoAcao pequeno variante="primario" acao={A.enviarParaAprovacao.bind(null, id, p.id)}>Enviar para aprovação</BotaoAcao>
                      )}
                    </div>
                    {p.status === 'aguardando_aprovacao' && podeAprovar && (
                      <div className="rounded-md bg-amber-50 p-3">
                        <p className="mb-2 text-sm">Seu limite nesta obra: <b>{limite === null ? 'sem limite (administrador)' : fmtMoeda(limite)}</b></p>
                        <FormAcao acao={A.decidirPedido.bind(null, id, p.id)} rotulo="Confirmar">
                          <fieldset className="flex gap-4 text-sm">
                            <label className="flex items-center gap-2"><input type="radio" name="decisao" value="aprovar" defaultChecked /> Aprovar</label>
                            <label className="flex items-center gap-2"><input type="radio" name="decisao" value="reprovar" /> Reprovar</label>
                          </fieldset>
                          <textarea name="motivo" rows={2} placeholder="Motivo (obrigatório para reprovar)" className="campo-input" />
                        </FormAcao>
                      </div>
                    )}
                    {p.status !== 'cancelado' && pode(sessao, 'pedido', 5) && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-red-700">Cancelar pedido</summary>
                        <FormAcao acao={A.cancelarPedido.bind(null, id, p.id)} rotulo="Cancelar pedido" variante="perigo" className="mt-2 max-w-md">
                          <input name="motivo" placeholder="Motivo" className="campo-input" />
                        </FormAcao>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </Cartao>
        )}

        {/* ---------------------------------------------------------- Entrega */}
        {(pedidoAtivo?.status === 'aprovado' || (sitR.data ?? []).length > 0) && (
          <Cartao titulo="Situação da compra e entrega">
            <ul className="mb-3 space-y-1 text-sm">
              {((sitR.data ?? []) as any[]).map((s) => (
                <li key={s.id}><b>{SITUACAO_COMPRA[s.situacao]}</b> — {fmtDataHora(s.criado_em)}{s.usuario_id && ` · ${nomes[s.usuario_id] ?? ''}`}{s.obs && ` · ${s.obs}`}</li>
              ))}
            </ul>
            {st === 'liberada' && pode(sessao, 'situacao_compra_entrega', 4) && (
              <FormAcao acao={A.registrarSituacao.bind(null, id)} rotulo="Registrar situação" limparAoSalvar className="max-w-xl">
                <div className="grid gap-2 sm:grid-cols-2">
                  <select name="situacao" required className="campo-input" defaultValue="">
                    <option value="" disabled>Situação...</option>
                    {Object.entries(SITUACAO_COMPRA).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
                  </select>
                  <input name="obs" placeholder="Observação" className="campo-input" />
                </div>
              </FormAcao>
            )}
          </Cartao>
        )}

        {/* ---------------------------------------------------------- Recebimento */}
        {st === 'liberada' && pedidoAtivo?.status === 'aprovado' && pode(sessao, 'requisicao_recebimento', 4) && (
          <Cartao titulo="Recebimento na obra">
            <div className="space-y-3">
              {itens.filter((i) => i.liberado).map((i) => {
                const rec = recebimentos[i.id];
                return (
                  <div key={i.id} className="rounded-md border border-slate-200 p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span><b>{i.materiais?.nome}</b> — {fmtNumero(i.quantidade)} {i.unidade}</span>
                      {rec && (
                        <span className="flex items-center gap-2">
                          <Selo cor={rec.situacao === 'atendido' ? 'verde' : 'vermelho'}>{rec.situacao === 'atendido' ? 'recebido' : 'não atendido'}</Selo>
                          {rec.numero_nf && <span className="text-xs text-slate-500">NF {rec.numero_nf} ({rec.nf_origem === 'atlas' ? 'Atlas' : 'fornecedor'})</span>}
                          {pode(sessao, 'requisicao_recebimento', 5) && <BotaoAcao pequeno variante="fantasma" acao={A.desfazerRecebimento.bind(null, id, i.id)}>desfazer</BotaoAcao>}
                        </span>
                      )}
                    </div>
                    {!rec && (
                      <FormAcao acao={A.registrarRecebimento.bind(null, id, i.id)} rotulo="Registrar">
                        <div className="grid gap-2 sm:grid-cols-4">
                          <select name="situacao" className="campo-input" defaultValue="atendido">
                            <option value="atendido">Atendido (recebido)</option>
                            <option value="nao_atendido">Não atendido</option>
                          </select>
                          <select name="nf_origem" className="campo-input" defaultValue="fornecedor">
                            <option value="fornecedor">NF do fornecedor</option>
                            <option value="atlas">NF da Atlas</option>
                          </select>
                          <input name="numero_nf" placeholder="Nº da NF" className="campo-input" />
                          <input name="motivo" placeholder="Motivo (se não atendido)" className="campo-input" />
                        </div>
                      </FormAcao>
                    )}
                  </div>
                );
              })}
            </div>
          </Cartao>
        )}

        {/* ---------------------------------------------------------- Edição / cancelamento */}
        {aberta && (souSolicitante || pode(sessao, 'requisicao', 3)) && (
          <Cartao titulo="Dados da requisição">
            <FormAcao acao={A.salvarCabecalho.bind(null, id)} className="max-w-xl">
              <div><label className="mb-1 block text-sm font-medium">Obra</label>
                <SelecaoRef nome="obra_id" refChave="obras" valorInicial={String(req.obra_id)} rotuloInicial={`${req.obras?.codigo} - ${req.obras?.razao_social}`} obrigatorio /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="urgente" defaultChecked={req.urgente} className="size-4" /> Urgente</label>
              <textarea name="obs" rows={3} defaultValue={req.obs ?? ''} placeholder="Observações" className="campo-input" />
            </FormAcao>
          </Cartao>
        )}
        {!['concluida', 'cancelada'].includes(st) && pode(sessao, 'requisicao', 5) && (
          <details className="rounded-lg border border-red-100 bg-white p-4 text-sm">
            <summary className="cursor-pointer font-medium text-red-700">Cancelar requisição</summary>
            <FormAcao acao={A.cancelarRequisicao.bind(null, id)} rotulo="Cancelar requisição" variante="perigo" className="mt-3 max-w-md" confirmar="Cancelar esta requisição?">
              <input name="motivo" required placeholder="Motivo do cancelamento" className="campo-input" />
            </FormAcao>
          </details>
        )}

        {/* ---------------------------------------------------------- Histórico */}
        <Cartao titulo="Histórico">
          {historico.length === 0 ? <Vazio>Sem movimentações.</Vazio> : (
            <ol className="relative space-y-3 border-l border-slate-200 pl-4">
              {historico.map((h) => (
                <li key={`${h.origem}-${h.id}`} className="text-sm">
                  <span className="absolute -left-1.5 mt-1.5 size-3 rounded-full border-2 border-white bg-marca-500" />
                  <p><b>{ACOES_HISTORICO[h.acao] ?? h.acao}</b> <span className="text-slate-500">· {h.origem}</span>{h.valor != null && ` · ${fmtMoeda(h.valor)}`}</p>
                  <p className="text-xs text-slate-500">{fmtDataHora(h.criado_em)}{h.usuario_id && ` · ${nomes[h.usuario_id] ?? ''}`}{h.motivo && ` · ${h.motivo}`}</p>
                </li>
              ))}
            </ol>
          )}
        </Cartao>
      </div>
    </>
  );
}

function CondicoesOrcamento({ o }: { o: Record<string, any> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div><label className="mb-1 block text-xs font-medium">Forma de pagamento</label>
        <select name="tipo_condicao_pagamento" defaultValue={o.tipo_condicao_pagamento ?? ''} className="campo-input">
          <option value="">—</option>
          {CONDICOES_PAGAMENTO.map((c) => <option key={c} value={c}>{c}</option>)}
        </select></div>
      <div><label className="mb-1 block text-xs font-medium">Condição (ex.: 28/56 dias)</label><input name="condicao_pagamento" defaultValue={o.condicao_pagamento ?? ''} className="campo-input" /></div>
      <div><label className="mb-1 block text-xs font-medium">Prazo de entrega</label><input name="prazo_entrega" defaultValue={o.prazo_entrega ?? ''} className="campo-input" /></div>
      <div><label className="mb-1 block text-xs font-medium">Frete</label>
        <select name="tipo_frete" defaultValue={o.tipo_frete ?? ''} className="campo-input">
          <option value="">—</option><option value="CIF">CIF (por conta do fornecedor)</option><option value="FOB">FOB (por conta da Atlas)</option>
        </select></div>
      <div><label className="mb-1 block text-xs font-medium">Valor do frete</label><input name="valor_frete" defaultValue={o.valor_frete ?? ''} inputMode="decimal" className="campo-input" /></div>
      <div><label className="mb-1 block text-xs font-medium">Obs.</label><input name="obs" defaultValue={o.obs ?? ''} className="campo-input" /></div>
    </div>
  );
}

function TabelaItensOrc({ o, itens, selecionavel }: { o: any; itens: Record<string, any>; selecionavel?: boolean }) {
  return (
    <div className="-mx-3 overflow-x-auto">
      <table className="tabela">
        <thead><tr>{selecionavel && <th>Pedir</th>}<th>Material</th><th className="text-right">Qtd.</th><th className="text-right">Unitário</th><th className="text-right">IPI</th><th className="text-right">Total</th>{!selecionavel && <th>No pedido</th>}</tr></thead>
        <tbody>
          {o.orcamento_itens.map((oi: any) => (
            <tr key={oi.id}>
              {selecionavel && <td><input type="checkbox" name="pedir" value={oi.id} defaultChecked={Number(oi.valor_unitario) > 0} className="size-4" /></td>}
              <td>{itens[oi.requisicao_item_id]?.materiais?.nome}</td>
              <td className="text-right">{fmtNumero(oi.quantidade)} {oi.unidade}</td>
              <td className="text-right">{fmtMoeda(oi.valor_unitario)}</td>
              <td className="text-right">{fmtMoeda(oi.valor_ipi)}</td>
              <td className="text-right font-medium">{fmtMoeda(Number(oi.quantidade) * Number(oi.valor_unitario) + Number(oi.valor_ipi))}</td>
              {!selecionavel && <td>{oi.item_pedido ? <Selo cor="verde">sim</Selo> : ''}</td>}
            </tr>
          ))}
          <tr><td colSpan={selecionavel ? 5 : 4} className="text-right text-slate-500">Frete</td><td className="text-right">{fmtMoeda(o.valor_frete)}</td>{!selecionavel && <td />}</tr>
        </tbody>
      </table>
    </div>
  );
}

/** Antigo "mapa de comparação": preço unitário de cada item em cada orçamento. */
function MapaComparativo({ orcamentos, itens }: { orcamentos: any[]; itens: Record<string, any> }) {
  const itemIds = [...new Set(orcamentos.flatMap((o) => o.orcamento_itens.map((i: any) => i.requisicao_item_id)))];
  return (
    <details className="mb-4 rounded-md bg-slate-50 p-3" open>
      <summary className="cursor-pointer text-sm font-medium">Mapa comparativo de preços</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="tabela">
          <thead><tr><th>Material</th>{orcamentos.map((o) => <th key={o.id} className="text-right">{o.fornecedores?.nome_usual || o.fornecedores?.razao_social || `Orç. ${o.id}`}</th>)}</tr></thead>
          <tbody>
            {itemIds.map((iid) => {
              const valores = orcamentos.map((o) => o.orcamento_itens.find((x: any) => x.requisicao_item_id === iid));
              const positivos = valores.filter((v) => v && Number(v.valor_unitario) > 0).map((v) => Number(v.valor_unitario));
              const menor = positivos.length ? Math.min(...positivos) : null;
              return (
                <tr key={iid}>
                  <td>{itens[iid]?.materiais?.nome}</td>
                  {valores.map((v, k) => (
                    <td key={k} className={`text-right ${v && Number(v.valor_unitario) === menor ? 'font-semibold text-emerald-700' : ''}`}>{v ? fmtMoeda(v.valor_unitario) : '—'}</td>
                  ))}
                </tr>
              );
            })}
            <tr className="font-semibold"><td>Total (com IPI e frete)</td>{orcamentos.map((o) => <td key={o.id} className="text-right">{fmtMoeda(totalOrcamento(o.orcamento_itens, o.valor_frete))}</td>)}</tr>
          </tbody>
        </table>
      </div>
    </details>
  );
}

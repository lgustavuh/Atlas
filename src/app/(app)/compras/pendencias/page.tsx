import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Cabecalho, Cartao, Selo, Vazio } from '@/components/ui';
import { fmtDataHora, fmtMoeda } from '@/lib/formatar';
import { exigirSessao, participaCompras } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';

export const metadata = { title: 'Minhas pendências de compras' };

export default async function Pendencias() {
  const sessao = await exigirSessao();
  if (!participaCompras(sessao)) redirect('/sem-acesso');
  const supabase = await supabaseServidor();

  const { data: alcadas } = await supabase.from('alcadas').select('obra_id, pode_liberar, pode_aprovar, valor_maximo')
    .eq('usuario_id', sessao.id).eq('status', 'ativo');
  const obrasLiberar = sessao.admin ? null : (alcadas ?? []).filter((a) => a.pode_liberar).map((a) => a.obra_id);
  const obrasAprovar = sessao.admin ? null : (alcadas ?? []).filter((a) => a.pode_aprovar).map((a) => a.obra_id);

  let qLib = supabase.from('requisicoes_painel').select('*').eq('status', 'aguardando_liberacao').order('urgente', { ascending: false }).order('id');
  if (obrasLiberar) qLib = qLib.in('obra_id', obrasLiberar.length ? obrasLiberar : [-1]);
  let qPed = supabase.from('pedidos').select('id, data, requisicao_id, requisicoes!inner(obra_id, urgente, obras(codigo, razao_social))').eq('status', 'aguardando_aprovacao').order('id');
  if (obrasAprovar) qPed = qPed.in('requisicoes.obra_id', obrasAprovar.length ? obrasAprovar : [-1]);

  const [{ data: liberar }, { data: aprovar }] = await Promise.all([qLib, qPed]);
  const valores = await Promise.all(((aprovar as any[]) ?? []).map(async (p) => (await supabase.rpc('valor_pedido', { p_pedido_id: p.id })).data as number));
  const limitePorObra = Object.fromEntries((alcadas ?? []).map((a) => [a.obra_id, Number(a.valor_maximo)]));

  return (
    <>
      <Cabecalho titulo="Minhas pendências" subtitulo="Requisições para liberar e pedidos para aprovar nas obras em que você tem alçada." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Cartao titulo={`Requisições aguardando liberação (${liberar?.length ?? 0})`}>
          {!liberar?.length ? <Vazio>Nada para liberar.</Vazio> : (
            <ul className="divide-y divide-slate-100">
              {liberar.map((r: any) => (
                <li key={r.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div>
                    <Link href={`/compras/${r.id}`} className="font-medium text-marca-700 hover:underline">Requisição nº {r.id}</Link>
                    {r.urgente && <span className="ml-2"><Selo cor="vermelho">urgente</Selo></span>}
                    <p className="text-xs text-slate-500">Obra {r.obra_codigo} - {r.obra} · {r.itens} itens · {fmtDataHora(r.data)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
        <Cartao titulo={`Pedidos aguardando aprovação (${aprovar?.length ?? 0})`}>
          {!aprovar?.length ? <Vazio>Nada para aprovar.</Vazio> : (
            <ul className="divide-y divide-slate-100">
              {(aprovar as any[]).map((p, i) => {
                const limite = limitePorObra[p.requisicoes.obra_id];
                const acima = !sessao.admin && limite !== undefined && valores[i] > limite;
                return (
                  <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <div>
                      <Link href={`/compras/${p.requisicao_id}`} className="font-medium text-marca-700 hover:underline">Pedido nº {p.id}</Link>
                      <span className="text-slate-500"> · requisição {p.requisicao_id}</span>
                      <p className="text-xs text-slate-500">Obra {p.requisicoes.obras?.codigo} - {p.requisicoes.obras?.razao_social}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{fmtMoeda(valores[i])}</p>
                      {acima && <Selo cor="vermelho">acima do seu limite</Selo>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Cartao>
      </div>
    </>
  );
}

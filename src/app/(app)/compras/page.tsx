import Link from 'next/link';
import { Paginacao } from '@/components/Paginacao';
import { SelecaoFiltro } from '@/components/SelecaoFiltro';
import { BotaoLink, Cabecalho, Cartao, Selo, Vazio } from '@/components/ui';
import { SITUACAO_COMPRA, STATUS_PEDIDO, STATUS_REQUISICAO } from '@/lib/compras';
import { buscarOpcoes } from '@/lib/crud';
import { fmtData } from '@/lib/formatar';
import { redirect } from 'next/navigation';
import { exigirSessao, participaCompras, pode } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';

export const metadata = { title: 'Requisições de compra' };
const POR_PAGINA = 30;

export default async function Compras({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sessao = await exigirSessao();
  if (!participaCompras(sessao)) redirect('/sem-acesso');
  const sp = await searchParams;
  const supabase = await supabaseServidor();
  const pagina = Math.max(1, Number(sp.pagina) || 1);

  let q = supabase.from('requisicoes_painel').select('*', { count: 'exact' });
  if (sp.status) q = q.eq('status', sp.status);
  else q = q.not('status', 'in', '(concluida,cancelada)');
  if (sp.obra) q = q.eq('obra_id', sp.obra);
  if (sp.numero && /^\d+$/.test(sp.numero)) q = q.eq('id', sp.numero);
  const { data, count } = await q.order('urgente', { ascending: false }).order('id', { ascending: false })
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);
  const linhas = (data as any[]) ?? [];
  const rotuloObra = sp.obra ? (await buscarOpcoes('obras', undefined, [sp.obra]))[0]?.rotulo : undefined;

  const abas = [{ valor: '', rotulo: 'Em andamento' }, ...Object.entries(STATUS_REQUISICAO).map(([valor, s]) => ({ valor, rotulo: s.rotulo }))];
  const url = (status: string) => {
    const p = new URLSearchParams();
    if (status) p.set('status', status);
    if (sp.obra) p.set('obra', sp.obra);
    return `/compras?${p}`;
  };

  return (
    <>
      <Cabecalho titulo="Requisições de compra" subtitulo="Requisição → liberação → orçamento → pedido → aprovação → entrega → recebimento"
        acoes={pode(sessao, 'requisicao', 4) && <BotaoLink variante="primario" href="/compras/nova">Nova requisição</BotaoLink>} />
      <Cartao>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <nav className="flex flex-wrap rounded-md border border-slate-200 p-0.5 text-sm">
            {abas.map((a) => (
              <Link key={a.valor} href={url(a.valor)}
                className={`rounded px-2.5 py-1 ${(sp.status ?? '') === a.valor ? 'bg-marca-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {a.rotulo}
              </Link>
            ))}
          </nav>
          <SelecaoFiltro parametro="obra" refChave="obras" valor={sp.obra} rotulo={rotuloObra} placeholder="Filtrar por obra..." />
          <form className="flex gap-2">
            <input name="numero" defaultValue={sp.numero} placeholder="Nº" aria-label="Número da requisição" className="campo-input w-24" />
            <button className="rounded-md border border-slate-300 px-3 text-sm hover:bg-slate-50">Ir</button>
          </form>
        </div>
        {linhas.length === 0 ? <Vazio>Nenhuma requisição.</Vazio> : (
          <div className="-mx-4 overflow-x-auto">
            <table className="tabela">
              <thead>
                <tr><th>Nº</th><th>Data</th><th>Obra</th><th>Solicitante</th><th>Itens</th><th>Situação</th><th>Pedido</th><th>Entrega</th></tr>
              </thead>
              <tbody>
                {linhas.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/compras/${r.id}`} className="font-medium text-marca-700 hover:underline">{r.id}</Link>
                      {r.urgente && <span className="ml-1"><Selo cor="vermelho">urgente</Selo></span>}
                    </td>
                    <td>{fmtData(r.data)}</td>
                    <td>{r.obra_codigo} - {r.obra}</td>
                    <td>{r.solicitante ?? <span className="text-slate-300">—</span>}</td>
                    <td>{r.itens}{r.itens_recebidos > 0 && <span className="text-xs text-slate-500"> ({r.itens_recebidos} rec.)</span>}</td>
                    <td><Selo cor={STATUS_REQUISICAO[r.status]?.cor}>{STATUS_REQUISICAO[r.status]?.rotulo ?? r.status}</Selo></td>
                    <td>{r.pedido_status ? <Selo cor={STATUS_PEDIDO[r.pedido_status]?.cor}>{STATUS_PEDIDO[r.pedido_status]?.rotulo}</Selo> : r.orcamentos > 0 ? <span className="text-xs text-slate-500">{r.orcamentos} orçamento(s)</span> : null}</td>
                    <td className="text-xs">{r.situacao_compra ? SITUACAO_COMPRA[r.situacao_compra] : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacao pagina={pagina} total={count ?? 0} porPagina={POR_PAGINA} params={{ status: sp.status, obra: sp.obra }} />
      </Cartao>
    </>
  );
}

import Link from 'next/link';
import { Cabecalho, Cartao, Selo, Vazio } from '@/components/ui';
import { fmtData, hojeISO } from '@/lib/formatar';
import { exigirSessao, pode } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';

export const metadata = { title: 'Painel' };

const ROTULO_REQ: Record<string, string> = {
  aberta: 'Abertas', aguardando_liberacao: 'Aguardando liberação', liberada: 'Liberadas (em compra)',
};

export default async function Painel() {
  const sessao = await exigirSessao();
  const supabase = await supabaseServidor();
  const hoje = hojeISO();

  const participaCompras = ['requisicao', 'pcl', 'orcamento', 'pedido', 'pca', 'situacao_compra_entrega', 'requisicao_recebimento']
    .some((m) => pode(sessao, m, 2));

  const [venc, reqs, pedidos, alertas, visualiza] = await Promise.all([
    supabase.from('vencimentos').select('*').order('vencimento').limit(200),
    participaCompras ? supabase.from('requisicoes').select('status').in('status', ['aberta', 'aguardando_liberacao', 'liberada']) : Promise.resolve({ data: [] }),
    participaCompras ? supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('status', 'aguardando_aprovacao') : Promise.resolve({ count: 0 }),
    supabase.from('alertas').select('id, texto, criado_em').eq('status', 'ativo').order('criado_em', { ascending: false }).limit(10),
    supabase.from('alertas_visualizadores').select('usuario_id').eq('usuario_id', sessao.id).maybeSingle(),
  ]);

  const contagem: Record<string, number> = {};
  for (const r of (reqs.data as { status: string }[]) ?? []) contagem[r.status] = (contagem[r.status] ?? 0) + 1;
  const vencimentos = (venc.data as any[]) ?? [];
  const mostrarAlertas = sessao.admin || !!visualiza.data;

  return (
    <>
      <Cabecalho titulo={`Olá, ${sessao.nome.split(' ')[0]}`} subtitulo={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })} />

      {participaCompras && (
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Object.entries(ROTULO_REQ).map(([s, r]) => (
            <Link key={s} href={`/compras?status=${s}`} className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs hover:border-marca-500">
              <p className="text-2xl font-semibold text-slate-900">{contagem[s] ?? 0}</p>
              <p className="text-sm text-slate-500">Requisições: {r.toLowerCase()}</p>
            </Link>
          ))}
          <Link href="/compras/pendencias" className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs hover:border-marca-500">
            <p className="text-2xl font-semibold text-slate-900">{(pedidos as { count: number | null }).count ?? 0}</p>
            <p className="text-sm text-slate-500">Pedidos aguardando aprovação</p>
          </Link>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Cartao titulo="Vencimentos (próximos 60 dias e vencidos)" className="lg:col-span-2">
          {vencimentos.length === 0 ? <Vazio>Nada vencendo. Tudo em dia.</Vazio> : (
            <div className="-mx-4 max-h-[28rem] overflow-auto">
              <table className="tabela">
                <thead><tr><th>Tipo</th><th>Item</th><th>Referência</th><th>Vencimento</th></tr></thead>
                <tbody>
                  {vencimentos.map((v, i) => {
                    const vencido = v.vencimento < hoje;
                    return (
                      <tr key={i}>
                        <td><Selo cor={vencido ? 'vermelho' : 'amarelo'}>{v.tipo}</Selo></td>
                        <td>{v.item}</td>
                        <td><Link href={v.link} className="text-marca-700 hover:underline">{v.referencia}</Link></td>
                        <td className={vencido ? 'font-medium text-red-600' : ''}>{fmtData(v.vencimento)}{vencido && ' (vencido)'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Cartao>

        <div className="space-y-5">
          {mostrarAlertas && pode(sessao, 'alerta_adm', 2) && (
            <Cartao titulo="Alertas administrativos" acoes={<Link href="/alertas" className="text-sm text-marca-600">Ver todos</Link>}>
              {(alertas.data ?? []).length === 0 ? <Vazio>Sem alertas ativos.</Vazio> : (
                <ul className="space-y-2 text-sm">
                  {(alertas.data as any[]).map((a) => <li key={a.id} className="rounded-md bg-amber-50 px-3 py-2 text-amber-900">{a.texto}</li>)}
                </ul>
              )}
            </Cartao>
          )}
          <Cartao titulo="Atalhos">
            <div className="grid gap-2 text-sm">
              {pode(sessao, 'requisicao', 4) && <Link className="text-marca-700 hover:underline" href="/compras/nova">+ Nova requisição de compra</Link>}
              {pode(sessao, 'colaboradores', 4) && <Link className="text-marca-700 hover:underline" href="/m/colaboradores/novo">+ Cadastrar colaborador</Link>}
              {pode(sessao, 'atestados', 4) && <Link className="text-marca-700 hover:underline" href="/m/atestados/novo">+ Lançar atestado</Link>}
              {pode(sessao, 'documentos_padronizados', 2) && <Link className="text-marca-700 hover:underline" href="/documentos">Gerar documento padronizado</Link>}
              {pode(sessao, 'biblioteca_download', 2) && <Link className="text-marca-700 hover:underline" href="/m/biblioteca">Biblioteca padrão</Link>}
            </div>
          </Cartao>
        </div>
      </div>
    </>
  );
}

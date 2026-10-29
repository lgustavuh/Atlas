import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Celula } from '@/components/Celula';
import { Paginacao } from '@/components/Paginacao';
import { SelecaoFiltro } from '@/components/SelecaoFiltro';
import { Aviso, BotaoLink, Cabecalho, Cartao, Vazio } from '@/components/ui';
import { listar, POR_PAGINA, resolverRotulos } from '@/lib/crud';
import { obterModulo } from '@/lib/modulos';
import { exigirSessao, pode } from '@/lib/sessao';

type Props = { params: Promise<{ modulo: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Props) {
  return { title: obterModulo((await params).modulo)?.titulo };
}

export default async function Lista({ params, searchParams }: Props) {
  const { modulo } = await params;
  const sp = await searchParams;
  const mod = obterModulo(modulo);
  if (!mod) notFound();
  const sessao = await exigirSessao(mod.permissao, 2);

  const status = mod.temStatus === false ? undefined : (['ativo', 'desativado', 'historico'].includes(sp.status ?? '') ? sp.status : 'ativo');
  const filtroColab = mod.campos.some((c) => c.nome === 'colaborador_id') ? sp.colaborador_id : undefined;
  const { linhas, total, pagina, rotulos, erro } = await listar(mod, {
    q: sp.q, status, pagina: Number(sp.pagina) || 1, filtros: { colaborador_id: filtroColab ?? '' },
  });
  const colunas = mod.campos.filter((c) => c.lista);
  const rotuloFiltro = filtroColab ? (await resolverRotulos(mod, [{ colaborador_id: filtroColab }], true)).colaborador_id?.[filtroColab] : undefined;
  const link = (r: Record<string, any>) => {
    const id = String(r[mod.pk ?? 'id']);
    return mod.linkDetalhe ? mod.linkDetalhe(id) : `/m/${mod.chave}/${encodeURIComponent(id)}`;
  };
  const abas = mod.temStatus === false ? [] : [
    { valor: 'ativo', rotulo: 'Ativos' },
    ...(mod.historico ? [{ valor: 'historico', rotulo: 'Histórico' }] : []),
    { valor: 'desativado', rotulo: 'Desativados' },
  ];
  const urlAba = (s: string) => {
    const p = new URLSearchParams();
    if (sp.q) p.set('q', sp.q);
    if (filtroColab) p.set('colaborador_id', filtroColab);
    p.set('status', s);
    return `?${p}`;
  };
  const exportar = new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(status ? { status } : {}), ...(filtroColab ? { colaborador_id: filtroColab } : {}) });

  return (
    <>
      <Cabecalho
        titulo={mod.titulo}
        acoes={
          <>
            <a className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              href={`/api/exportar/${mod.chave}?${exportar}`}>
              Exportar Excel
            </a>
            {pode(sessao, mod.permissao, 4) && mod.chave !== 'colaboradores' && (
              <BotaoLink variante="primario" href={`/m/${mod.chave}/novo${filtroColab ? `?colaborador_id=${filtroColab}` : ''}`}>Novo</BotaoLink>
            )}
            {pode(sessao, mod.permissao, 4) && mod.chave === 'colaboradores' && <BotaoLink variante="primario" href="/m/colaboradores/novo">Novo colaborador</BotaoLink>}
          </>
        }
      />
      <Cartao>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          {abas.length > 0 && (
            <nav className="flex rounded-md border border-slate-200 p-0.5 text-sm">
              {abas.map((a) => (
                <Link key={a.valor} href={urlAba(a.valor)}
                  className={`rounded px-3 py-1 ${status === a.valor ? 'bg-marca-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {a.rotulo}
                </Link>
              ))}
            </nav>
          )}
          {mod.busca.length > 0 && (
            <form className="flex flex-1 gap-2">
              {status && <input type="hidden" name="status" value={status} />}
              {filtroColab && <input type="hidden" name="colaborador_id" value={filtroColab} />}
              <input name="q" defaultValue={sp.q} placeholder="Buscar..." aria-label="Buscar" className="campo-input max-w-sm" />
              <button className="rounded-md border border-slate-300 px-3 text-sm hover:bg-slate-50">Buscar</button>
            </form>
          )}
          {mod.campos.some((c) => c.nome === 'colaborador_id') && (
            <SelecaoFiltro parametro="colaborador_id" refChave="colaboradores" valor={filtroColab} rotulo={rotuloFiltro} placeholder="Filtrar por colaborador..." />
          )}
        </div>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {linhas.length === 0 ? (
          <Vazio>Nenhum registro encontrado.</Vazio>
        ) : (
          <div className="-mx-4 overflow-x-auto">
            <table className="tabela">
              <thead>
                <tr>{colunas.map((c) => <th key={c.nome}>{c.rotulo}</th>)}</tr>
              </thead>
              <tbody>
                {linhas.map((r) => (
                  <tr key={String(r[mod.pk ?? 'id'])}>
                    {colunas.map((c, i) => (
                      <td key={c.nome}>
                        {i === 0 ? (
                          <Link href={link(r)} className="font-medium text-marca-700 hover:underline">
                            <Celula c={c} v={r[c.nome]} rotulos={rotulos[c.nome]} />
                          </Link>
                        ) : (
                          <Celula c={c} v={r[c.nome]} rotulos={rotulos[c.nome]} />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacao pagina={pagina} total={total} porPagina={POR_PAGINA} params={{ q: sp.q, status, colaborador_id: filtroColab }} />
      </Cartao>
    </>
  );
}

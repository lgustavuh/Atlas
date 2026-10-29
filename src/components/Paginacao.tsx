import Link from 'next/link';

export function Paginacao({ pagina, total, porPagina, params }: { pagina: number; total: number; porPagina: number; params: Record<string, string | undefined> }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const url = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    sp.set('pagina', String(p));
    return `?${sp.toString()}`;
  };
  return (
    <div className="flex items-center justify-between gap-3 px-1 pt-3 text-sm text-slate-500">
      <span>{total.toLocaleString('pt-BR')} registro{total === 1 ? '' : 's'}</span>
      {paginas > 1 && (
        <div className="flex items-center gap-1">
          {pagina > 1 ? <Link className="rounded px-2 py-1 hover:bg-slate-100" href={url(pagina - 1)}>‹ Anterior</Link> : <span className="px-2 py-1 text-slate-300">‹ Anterior</span>}
          <span className="px-2">Página {pagina} de {paginas}</span>
          {pagina < paginas ? <Link className="rounded px-2 py-1 hover:bg-slate-100" href={url(pagina + 1)}>Próxima ›</Link> : <span className="px-2 py-1 text-slate-300">Próxima ›</span>}
        </div>
      )}
    </div>
  );
}

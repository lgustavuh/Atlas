// Mostrado na hora em que se troca de módulo, enquanto o servidor monta a página.
// Também permite ao Next.js pré-carregar a troca ao passar o mouse nos links do menu.
export default function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="animate-pulse">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div className="h-7 w-56 rounded-md bg-slate-200" />
        <div className="h-9 w-28 rounded-md bg-slate-200" />
      </div>
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
        <div className="mb-4 h-9 w-full max-w-sm rounded-md bg-slate-100" />
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex gap-4 border-t border-slate-100 py-3">
            <div className="h-4 w-1/3 rounded bg-slate-100" />
            <div className="h-4 w-1/4 rounded bg-slate-100" />
            <div className="h-4 w-1/6 rounded bg-slate-100" />
          </div>
        ))}
      </section>
    </div>
  );
}

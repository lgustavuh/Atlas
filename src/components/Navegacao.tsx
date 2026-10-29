'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { GrupoMenu } from '@/lib/menu';

export function Navegacao({ grupos, nome, podeBuscar, sair }: { grupos: GrupoMenu[]; nome: string; podeBuscar: boolean; sair: () => Promise<void> }) {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  useEffect(() => setAberto(false), [caminho]);

  const ativo = (href: string) => (href === '/' ? caminho === '/' : caminho === href || caminho.startsWith(href + '/'));

  const conteudo = (
    <nav className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2 px-4 py-4">
        <span className="grid size-8 place-items-center rounded-md bg-marca-600 text-sm font-bold text-white">A</span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-white">Atlas</span>
          <span className="block text-xs text-slate-400">Sistema de gestão</span>
        </span>
      </Link>
      {podeBuscar && (
        <form action="/busca" className="px-3 pb-3">
          <input name="q" placeholder="Busca rápida (nome ou CPF)" aria-label="Busca rápida"
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-marca-500 focus:outline-none" />
        </form>
      )}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <Link href="/" className={`mb-2 block rounded-md px-3 py-1.5 text-sm ${ativo('/') ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/60'}`}>
          Painel
        </Link>
        {grupos.map((g) => (
          <details key={g.titulo} open={g.itens.some((i) => ativo(i.href)) || undefined} className="group mb-1">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase hover:text-slate-200">
              {g.titulo}
              <span className="transition group-open:rotate-90">›</span>
            </summary>
            <ul className="mt-0.5 mb-2 space-y-0.5">
              {g.itens.map((i) => (
                <li key={i.href + i.titulo}>
                  <Link href={i.href} aria-current={ativo(i.href) ? 'page' : undefined}
                    className={`block rounded-md py-1.5 pr-3 pl-5 text-sm ${ativo(i.href) ? 'bg-marca-600 text-white' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`}>
                    {i.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
      <div className="border-t border-slate-800 px-4 py-3 text-sm">
        <Link href="/conta" className="block truncate text-slate-300 hover:text-white">{nome}</Link>
        <form action={sair}>
          <button className="mt-1 text-xs text-slate-500 hover:text-slate-300">Sair</button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between bg-slate-900 px-4 py-2 lg:hidden">
        <span className="text-sm font-semibold text-white">Atlas</span>
        <button onClick={() => setAberto((a) => !a)} aria-expanded={aberto} aria-label="Abrir menu" className="rounded px-2 py-1 text-white">
          ☰
        </button>
      </div>
      {aberto && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setAberto(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transition-transform lg:translate-x-0 ${aberto ? 'translate-x-0' : '-translate-x-full'}`}>
        {conteudo}
      </aside>
    </>
  );
}

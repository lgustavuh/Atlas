import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variante = 'primario' | 'secundario' | 'perigo' | 'fantasma' | 'sucesso';

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-marca-600 text-white hover:bg-marca-700 shadow-sm',
  secundario: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-xs',
  perigo: 'bg-white text-red-700 border border-red-200 hover:bg-red-50',
  sucesso: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  fantasma: 'text-slate-600 hover:bg-slate-100',
};

export function classeBotao(v: Variante = 'secundario', pequeno = false) {
  return `inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition disabled:opacity-50 disabled:pointer-events-none ${
    pequeno ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm'
  } ${VARIANTES[v]}`;
}

export function Botao({ variante = 'secundario', pequeno, className = '', ...props }: ComponentProps<'button'> & { variante?: Variante; pequeno?: boolean }) {
  return <button className={`${classeBotao(variante, pequeno)} ${className}`} {...props} />;
}

export function BotaoLink({ variante = 'secundario', pequeno, className = '', ...props }: ComponentProps<typeof Link> & { variante?: Variante; pequeno?: boolean }) {
  return <Link className={`${classeBotao(variante, pequeno)} ${className}`} {...props} />;
}

export function Cabecalho({ titulo, subtitulo, acoes, voltar }: { titulo: ReactNode; subtitulo?: ReactNode; acoes?: ReactNode; voltar?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {voltar && (
          <Link href={voltar} className="mb-1 inline-block text-sm text-slate-500 hover:text-marca-600">
            ← Voltar
          </Link>
        )}
        <h1 className="text-xl font-semibold text-slate-900">{titulo}</h1>
        {subtitulo && <p className="mt-0.5 text-sm text-slate-500">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}

export function Cartao({ titulo, acoes, children, className = '' }: { titulo?: ReactNode; acoes?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-xs ${className}`}>
      {(titulo || acoes) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">{titulo}</h2>
          {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

const CORES: Record<string, string> = {
  verde: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amarelo: 'bg-amber-50 text-amber-800 ring-amber-200',
  vermelho: 'bg-red-50 text-red-700 ring-red-200',
  azul: 'bg-marca-50 text-marca-700 ring-marca-100',
  cinza: 'bg-slate-100 text-slate-600 ring-slate-200',
  roxo: 'bg-violet-50 text-violet-700 ring-violet-200',
};

export function Selo({ cor = 'cinza', children }: { cor?: keyof typeof CORES; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${CORES[cor]}`}>
      {children}
    </span>
  );
}

export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'erro' | 'sucesso' | 'alerta'; children: ReactNode }) {
  const cor = {
    info: 'border-marca-100 bg-marca-50 text-marca-900',
    erro: 'border-red-200 bg-red-50 text-red-800',
    sucesso: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    alerta: 'border-amber-200 bg-amber-50 text-amber-900',
  }[tipo];
  return <div role={tipo === 'erro' ? 'alert' : 'status'} className={`rounded-md border px-3 py-2 text-sm ${cor}`}>{children}</div>;
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-slate-500">{children}</p>;
}

export function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-slate-500">{rotulo}</dt>
      <dd className="mt-0.5 text-sm break-words text-slate-800">{children || <span className="text-slate-400">—</span>}</dd>
    </div>
  );
}

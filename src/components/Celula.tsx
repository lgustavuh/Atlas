import type { Campo } from '@/lib/modulos';
import { fmtBool, fmtData, fmtMoeda, fmtNumero } from '@/lib/formatar';

export function textoCelula(c: Campo, v: unknown, rotulos?: Record<string, string>): string {
  if (v === null || v === undefined || v === '') return '';
  switch (c.tipo) {
    case 'ref': return rotulos?.[String(v)] ?? String(v);
    case 'data': return fmtData(v);
    case 'moeda': return fmtMoeda(v);
    case 'numero': return fmtNumero(v);
    case 'booleano': return fmtBool(v);
    case 'opcoes': return c.opcoes?.find((o) => o.valor === String(v))?.rotulo ?? String(v);
    default: return String(v);
  }
}

export function Celula({ c, v, rotulos }: { c: Campo; v: unknown; rotulos?: Record<string, string> }) {
  const t = textoCelula(c, v, rotulos);
  if (!t) return <span className="text-slate-300">—</span>;
  if (c.tipo === 'textarea') return <span className="line-clamp-2 max-w-md">{t}</span>;
  return <>{t}</>;
}

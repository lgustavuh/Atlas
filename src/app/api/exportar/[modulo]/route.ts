import { NextResponse, type NextRequest } from 'next/server';
import { textoCelula } from '@/components/Celula';
import { resolverRotulos } from '@/lib/crud';
import { obterModulo } from '@/lib/modulos';
import { obterSessao, pode } from '@/lib/sessao';
import { supabaseServidor } from '@/lib/supabase/server';

/** Exporta a lista em CSV (abre direto no Excel: separador ";" e BOM UTF-8). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ modulo: string }> }) {
  const mod = obterModulo((await params).modulo);
  const sessao = await obterSessao();
  if (!mod || !sessao || !pode(sessao, mod.permissao, 2)) return new NextResponse('Sem permissão.', { status: 403 });

  const sp = req.nextUrl.searchParams;
  const supabase = await supabaseServidor();
  let consulta = supabase.from(mod.tabela).select('*').order(mod.ordem.coluna, { ascending: mod.ordem.asc ?? true }).limit(10000);
  if (mod.temStatus !== false) consulta = consulta.eq('status', sp.get('status') || 'ativo');
  if (mod.tabela === 'colaboradores') consulta = consulta.is('etapa_recrutamento', null);
  if (sp.get('colaborador_id')) consulta = consulta.eq('colaborador_id', sp.get('colaborador_id')!);
  const q = sp.get('q')?.trim().replace(/[,()%]/g, ' ');
  if (q && mod.busca.length) consulta = consulta.or(mod.busca.map((c) => `${c}.ilike.%${q}%`).join(','));

  const { data, error } = await consulta;
  if (error) return new NextResponse(error.message, { status: 400 });
  const linhas = (data as Record<string, any>[]) ?? [];
  const campos = mod.campos.filter((c) => c.tipo !== 'arquivo');
  const rotulos = await resolverRotulos(mod, linhas, true);

  const esc = (s: string) => (/[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const csv = [
    campos.map((c) => esc(c.rotulo)).join(';'),
    ...linhas.map((l) => campos.map((c) => esc(textoCelula(c, l[c.nome], rotulos[c.nome]))).join(';')),
  ].join('\r\n');

  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${mod.chave}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

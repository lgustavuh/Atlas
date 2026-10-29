import 'server-only';
import { supabaseServidor } from './supabase/server';
import { obterRef } from './refs';
import type { Modulo } from './modulos';

export const POR_PAGINA = 25;

export type Opcao = { valor: string; rotulo: string };

/** Busca opções de uma lista de seleção (texto digitado ou ids específicos). */
export async function buscarOpcoes(refChave: string, busca?: string, ids?: string[]): Promise<Opcao[]> {
  const ref = obterRef(refChave);
  if (!ref) return [];
  const supabase = await supabaseServidor();
  const chave = ref.chave ?? 'id';

  if (ref.rpc) {
    const args =
      ref.rpc === 'colaboradores_opcoes'
        ? { p_busca: busca || null, p_ids: ids?.length ? ids.map(Number) : null }
        : { p_busca: busca || null, p_ids: ids?.length ? ids : null };
    const { data } = await supabase.rpc(ref.rpc, args);
    return ((data as any[]) ?? []).map((r) => ({ valor: String(r.id), rotulo: ref.rotulo(r) }));
  }

  let consulta = supabase.from(ref.tabela).select(ref.colunas).order(ref.ordem).limit(ids?.length ? 1000 : 30);
  if (ids?.length) consulta = consulta.in(chave, ids);
  else {
    if (ref.somenteAtivos !== false) consulta = consulta.eq('status', 'ativo');
    if (busca) consulta = consulta.ilike(ref.busca, `%${busca}%`);
  }
  const { data } = await consulta;
  return ((data as any[]) ?? []).map((r) => ({ valor: String(r[chave]), rotulo: ref.rotulo(r) }));
}

/** Rótulos dos campos de referência para exibir nas listas: { campo: { id: rótulo } } */
export async function resolverRotulos(mod: Modulo, linhas: Record<string, any>[], todos = false) {
  const saida: Record<string, Record<string, string>> = {};
  const campos = mod.campos.filter((c) => c.tipo === 'ref' && (todos || c.lista));
  // agrupa por referência para fazer uma consulta por tabela
  const porRef = new Map<string, { campos: string[]; ids: Set<string> }>();
  for (const c of campos) {
    const g = porRef.get(c.ref!) ?? { campos: [], ids: new Set<string>() };
    g.campos.push(c.nome);
    for (const l of linhas) if (l[c.nome] !== null && l[c.nome] !== undefined) g.ids.add(String(l[c.nome]));
    porRef.set(c.ref!, g);
  }
  await Promise.all(
    [...porRef.entries()].map(async ([ref, g]) => {
      const opcoes = g.ids.size ? await buscarOpcoes(ref, undefined, [...g.ids]) : [];
      const mapa = Object.fromEntries(opcoes.map((o) => [o.valor, o.rotulo]));
      for (const c of g.campos) saida[c] = mapa;
    }),
  );
  return saida;
}

export type FiltroLista = { q?: string; status?: string; pagina?: number; filtros?: Record<string, string> };

export async function listar(mod: Modulo, f: FiltroLista) {
  const supabase = await supabaseServidor();
  const pagina = Math.max(1, f.pagina ?? 1);
  let consulta = supabase.from(mod.tabela).select('*', { count: 'exact' });

  if (mod.temStatus !== false) consulta = consulta.eq('status', f.status || 'ativo');
  // candidatos em recrutamento ficam na tela de recrutamento, não na lista de colaboradores
  if (mod.tabela === 'colaboradores') consulta = consulta.is('etapa_recrutamento', null);
  for (const [campo, valor] of Object.entries(f.filtros ?? {})) {
    if (valor && mod.campos.some((c) => c.nome === campo)) consulta = consulta.eq(campo, valor);
  }
  const q = f.q?.trim().replace(/[,()%]/g, ' ');
  if (q && mod.busca.length) {
    consulta = consulta.or(mod.busca.map((c) => `${c}.ilike.%${q}%`).join(','));
  }
  consulta = consulta
    .order(mod.ordem.coluna, { ascending: mod.ordem.asc ?? true, nullsFirst: false })
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);

  const { data, count, error } = await consulta;
  const linhas = (data as Record<string, any>[]) ?? [];
  const rotulos = await resolverRotulos(mod, linhas);
  return { linhas, total: count ?? 0, pagina, rotulos, erro: error?.message };
}

export async function obter(mod: Modulo, id: string) {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.from(mod.tabela).select('*').eq(mod.pk ?? 'id', id).maybeSingle();
  if (error || !data) return null;
  const rotulos = await resolverRotulos(mod, [data], true);
  return { registro: data as Record<string, any>, rotulos };
}

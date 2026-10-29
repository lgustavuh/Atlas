import { cache } from 'react';
import { redirect } from 'next/navigation';
import { supabaseServidor } from './supabase/server';

export type Sessao = {
  id: string;
  nome: string;
  email: string;
  admin: boolean;
  niveis: Record<string, number>;
};

/** Usuário logado + níveis por módulo (uma consulta por requisição). */
export const obterSessao = cache(async (): Promise<Sessao | null> => {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: usuario }, { data: permissoes }] = await Promise.all([
    supabase.from('usuarios').select('id, nome, email, admin, ativo').eq('id', user.id).maybeSingle(),
    supabase.from('permissoes').select('modulo, nivel').eq('usuario_id', user.id),
  ]);
  if (!usuario || !usuario.ativo) return null;

  const niveis: Record<string, number> = {};
  for (const p of permissoes ?? []) niveis[p.modulo] = p.nivel;
  return { id: usuario.id, nome: usuario.nome, email: usuario.email, admin: usuario.admin, niveis };
});

export function nivel(sessao: Sessao, modulo: string) {
  return sessao.admin ? 6 : (sessao.niveis[modulo] ?? 0);
}

export function pode(sessao: Sessao, modulo: string, minimo: number) {
  return nivel(sessao, modulo) >= minimo;
}

export const MODULOS_COMPRAS = ['requisicao', 'pcl', 'orcamento', 'pedido', 'pca', 'situacao_compra_entrega', 'requisicao_recebimento', 'pcla'];

export function participaCompras(sessao: Sessao) {
  return MODULOS_COMPRAS.some((m) => pode(sessao, m, 2));
}

export async function exigirSessao(modulo?: string, minimo = 2) {
  const sessao = await obterSessao();
  if (!sessao) redirect('/login');
  if (modulo && !pode(sessao, modulo, minimo)) redirect('/sem-acesso');
  return sessao;
}

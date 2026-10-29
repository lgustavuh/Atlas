/** Traduz erros do Postgres/PostgREST para mensagens legíveis. */
export function mensagemErro(e: { code?: string; message?: string } | null | undefined) {
  if (!e) return 'Erro desconhecido.';
  if (e.code === '23505') return 'Já existe um registro com esses dados.';
  if (e.code === '23503') return 'Este registro está ligado a outros e não pode ser removido.';
  if (e.code === '23514') return 'Algum valor está fora do permitido.';
  if (e.code === '42501' || /row-level security/i.test(e.message ?? '')) {
    return /row-level security/i.test(e.message ?? '') ? 'Você não tem permissão para esta ação.' : (e.message ?? '');
  }
  if (e.code === 'P0001') return e.message ?? 'Operação não permitida.';
  return e.message ?? 'Erro ao salvar.';
}

export const STATUS_REQUISICAO: Record<string, { rotulo: string; cor: 'verde' | 'amarelo' | 'vermelho' | 'azul' | 'cinza' | 'roxo' }> = {
  aberta: { rotulo: 'Aberta (rascunho)', cor: 'cinza' },
  aguardando_liberacao: { rotulo: 'Aguardando liberação', cor: 'amarelo' },
  liberada: { rotulo: 'Liberada', cor: 'azul' },
  nao_liberada: { rotulo: 'Não liberada', cor: 'vermelho' },
  concluida: { rotulo: 'Concluída', cor: 'verde' },
  cancelada: { rotulo: 'Cancelada', cor: 'cinza' },
};

export const STATUS_PEDIDO: Record<string, { rotulo: string; cor: 'verde' | 'amarelo' | 'vermelho' | 'azul' | 'cinza' }> = {
  aberto: { rotulo: 'Em montagem', cor: 'cinza' },
  aguardando_aprovacao: { rotulo: 'Aguardando aprovação', cor: 'amarelo' },
  aprovado: { rotulo: 'Aprovado', cor: 'verde' },
  reprovado: { rotulo: 'Reprovado', cor: 'vermelho' },
  cancelado: { rotulo: 'Cancelado', cor: 'cinza' },
};

export const SITUACAO_COMPRA: Record<string, string> = {
  comprado: 'Compra efetuada',
  comprado_parcial: 'Compra efetuada parcialmente',
  enviado_parcial: 'Enviado parcialmente para a obra',
  enviado_total: 'Enviado totalmente para a obra',
  enviado_estoque: 'Enviado do estoque',
};

export const CONDICOES_PAGAMENTO = ['BOLETO', 'FATURADO', 'AVISTA', 'CARTAOCREDITO', 'CARTAODEBITO', 'CARTAOBNDES'];

export const ACOES_HISTORICO: Record<string, string> = {
  finalizada: 'Finalizada e enviada para liberação',
  reaberta: 'Reaberta para edição',
  liberada: 'Liberada',
  nao_liberada: 'Não liberada',
  cancelada: 'Cancelada',
  concluida: 'Concluída (itens recebidos)',
  gerado: 'Pedido gerado',
  enviado_aprovacao: 'Enviado para aprovação',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  cancelado: 'Cancelado',
};

type ItemOrc = { quantidade: number; valor_unitario: number; valor_ipi: number; item_pedido?: boolean };

/** Mesmo cálculo da função valor_pedido do banco. */
export function totalOrcamento(itens: ItemOrc[], frete: number, somentePedido = false) {
  return itens.filter((i) => !somentePedido || i.item_pedido)
    .reduce((s, i) => s + Number(i.quantidade) * Number(i.valor_unitario) + Number(i.valor_ipi), 0) + Number(frete || 0);
}

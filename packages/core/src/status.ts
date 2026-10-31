export const ORDER_STATUSES = ['NOVO', 'CONFIRMADO', 'ENTREGUE', 'CANCELADO'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Como o painel chama cada status. */
export const ADMIN_STATUS_LABEL: Record<OrderStatus, string> = {
  NOVO: 'Novo',
  CONFIRMADO: 'Confirmado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

/** Como o restaurante vê cada status (escopo 7.5). */
export const CUSTOMER_STATUS_LABEL: Record<OrderStatus, string> = {
  NOVO: 'Recebido',
  CONFIRMADO: 'Confirmado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

/** Transições que o ADM pode fazer. */
export function canAdminTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  if (from === 'NOVO') return to === 'CONFIRMADO' || to === 'CANCELADO';
  if (from === 'CONFIRMADO') return to === 'ENTREGUE' || to === 'CANCELADO' || to === 'NOVO';
  if (from === 'ENTREGUE') return to === 'CONFIRMADO';
  return false;
}

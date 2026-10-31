/** Chaves das queries do painel. Tudo começa com 'admin' para o logout limpar de uma vez. */
export const adminKeys = {
  all: ['admin'] as const,
  me: ['admin', 'me'] as const,
  orders: ['admin', 'orders'] as const,
  orderList: (filters: { search?: string; weekId?: string }) => ['admin', 'orders', 'list', filters] as const,
  order: (id: string) => ['admin', 'orders', 'detail', id] as const,
  newCount: ['admin', 'orders', 'new-count'] as const,
  purchaseList: (weekId?: string) => ['admin', 'purchase-list', weekId ?? 'current'] as const,
  customers: ['admin', 'customers'] as const,
  customerList: (filters: { search?: string; status?: string }) =>
    ['admin', 'customers', 'list', filters] as const,
  products: ['admin', 'products'] as const,
  week: ['admin', 'week'] as const,
  settings: ['admin', 'settings'] as const,
  admins: ['admin', 'admins'] as const,
};

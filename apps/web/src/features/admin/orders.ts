import type {
  AdminOrderDetail,
  AdminOrdersResponse,
  NewOrdersCountResponse,
  OrderStatusCode,
  PurchaseListResponse,
} from '@hortifruit/schemas';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { useGuardedFetch } from './guard';
import { adminKeys } from './keys';

/** Pedidos chegam pelo app: a lista e o contador se atualizam sozinhos (escopo 7.2). */
export const ORDERS_REFRESH_MS = 30_000;

export function useOrders(filters: { search?: string; weekId?: string }) {
  const guarded = useGuardedFetch();
  return useQuery({
    queryKey: adminKeys.orderList(filters),
    queryFn: () =>
      guarded(() =>
        api
          .get('admin/orders', {
            searchParams: { search: filters.search || undefined, weekId: filters.weekId },
          })
          .json<AdminOrdersResponse>()
      ),
    placeholderData: keepPreviousData,
    refetchInterval: ORDERS_REFRESH_MS,
  });
}

export function useNewOrdersCount() {
  const guarded = useGuardedFetch();
  return useQuery({
    queryKey: adminKeys.newCount,
    queryFn: () => guarded(() => api.get('admin/orders/new-count').json<NewOrdersCountResponse>()),
    refetchInterval: ORDERS_REFRESH_MS,
  });
}

export function useOrder(id: string | null) {
  const guarded = useGuardedFetch();
  return useQuery({
    queryKey: adminKeys.order(id ?? ''),
    queryFn: () => guarded(() => api.get(`admin/orders/${id}`).json<AdminOrderDetail>()),
    enabled: !!id,
  });
}

export function useSetOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatusCode }) =>
      api.post(`admin/orders/${id}/status`, { json: { status } }).json<unknown>(),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.orders });
      void qc.invalidateQueries({ queryKey: adminKeys.purchaseList() });
    },
  });
}

export function usePurchaseList(weekId?: string) {
  const guarded = useGuardedFetch();
  return useQuery({
    queryKey: adminKeys.purchaseList(weekId),
    queryFn: () =>
      guarded(() =>
        api.get('admin/purchase-list', { searchParams: { weekId } }).json<PurchaseListResponse>()
      ),
  });
}

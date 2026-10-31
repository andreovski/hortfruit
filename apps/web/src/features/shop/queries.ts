import type {
  CatalogResponse,
  CreateOrderBody,
  IdentifyResponse,
  LookupOrdersResponse,
  OrderCreatedResponse,
  PublicOrder,
  UpdateOrderBody,
} from '@hortifruit/schemas';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { HTTPError } from 'ky';

import { api } from '@/lib/api';

export const shopKeys = {
  catalog: ['shop', 'catalog'] as const,
  order: (token: string) => ['shop', 'order', token] as const,
  lookup: (tokens: string[]) => ['shop', 'lookup', tokens] as const,
};

export function isNotFound(error: unknown) {
  return error instanceof HTTPError && error.response.status === 404;
}

export const catalogQuery = queryOptions({
  queryKey: shopKeys.catalog,
  queryFn: () => api.get('catalog').json<CatalogResponse>(),
  staleTime: 60_000,
});

export function useCatalog() {
  return useQuery(catalogQuery);
}

export function orderQuery(token: string) {
  return queryOptions({
    queryKey: shopKeys.order(token),
    queryFn: () => api.get(`orders/${encodeURIComponent(token)}`).json<PublicOrder>(),
    retry: (count, error) => !isNotFound(error) && count < 1,
  });
}

export function lookupQuery(tokens: string[]) {
  return queryOptions({
    queryKey: shopKeys.lookup(tokens),
    queryFn: () => api.post('orders/lookup', { json: { tokens } }).json<LookupOrdersResponse>(),
    enabled: tokens.length > 0,
  });
}

export const shopApi = {
  identify: (phone: string) =>
    api.post('checkout/identify', { json: { phone } }).json<IdentifyResponse>(),
  createOrder: (body: CreateOrderBody) =>
    api.post('orders', { json: body }).json<OrderCreatedResponse>(),
  updateOrder: (token: string, body: UpdateOrderBody) =>
    api.put(`orders/${encodeURIComponent(token)}`, { json: body }).json<OrderCreatedResponse>(),
  cancelOrder: (token: string) => api.post(`orders/${encodeURIComponent(token)}/cancel`),
};

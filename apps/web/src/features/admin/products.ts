import type {
  AdminProduct,
  AdminProductsResponse,
  ProductBody,
  ProductDraftBody,
  PublishBody,
} from '@hortifruit/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { useGuardedFetch } from './guard';
import { adminKeys } from './keys';

export const DRAFT_MUTATION_KEY = ['admin', 'product-draft'] as const;

export function useProducts() {
  const guarded = useGuardedFetch();
  return useQuery({
    queryKey: adminKeys.products,
    queryFn: () => guarded(() => api.get('admin/products').json<AdminProductsResponse>()),
  });
}

/** Rascunho difere do publicado? (mesma regra da API, para a atualização otimista). */
export function isChanged(product: Pick<AdminProduct, 'draft' | 'published'>): boolean {
  const { draft, published } = product;
  if (!published) return true;
  return (
    draft.priceCents !== published.priceCents ||
    draft.available !== published.available ||
    draft.badge !== published.badge
  );
}

/** Aplica uma edição de rascunho na lista em cache. */
export function applyDraft(
  data: AdminProductsResponse,
  id: string,
  patch: ProductDraftBody
): AdminProductsResponse {
  const products = data.products.map((p) => {
    if (p.id !== id) return p;
    const next = { ...p, draft: { ...p.draft, ...patch } };
    return { ...next, changed: isChanged(next) };
  });
  return {
    ...data,
    products,
    changedCount: products.filter((p) => p.changed && !p.archived).length,
  };
}

/** Preço, disponibilidade ou selo da semana (rascunho), com atualização otimista. */
export function usePatchDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: DRAFT_MUTATION_KEY,
    mutationFn: ({ id, patch }: { id: string; patch: ProductDraftBody }) =>
      api.patch(`admin/products/${id}`, { json: patch }).json<unknown>(),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: adminKeys.products });
      const previous = qc.getQueryData<AdminProductsResponse>(adminKeys.products);
      if (previous) qc.setQueryData(adminKeys.products, applyDraft(previous, id, patch));
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) qc.setQueryData(adminKeys.products, context.previous);
    },
    onSettled: () => {
      // Só busca de novo quando a última edição em andamento termina (evita piscar).
      if (qc.isMutating({ mutationKey: DRAFT_MUTATION_KEY }) <= 1) {
        void qc.invalidateQueries({ queryKey: adminKeys.products });
      }
    },
  });
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: ProductBody }) =>
      id
        ? api.patch(`admin/products/${id}`, { json: body }).json<AdminProduct>()
        : api.post('admin/products', { json: body }).json<AdminProduct>(),
    meta: { silent: true },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.products }),
  });
}

export function usePublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PublishBody) => api.post('admin/products/publish', { json: body }).json<unknown>(),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.products });
      void qc.invalidateQueries({ queryKey: adminKeys.week });
      void qc.invalidateQueries({ queryKey: adminKeys.orders });
    },
  });
}

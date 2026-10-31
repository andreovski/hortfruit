import type { Customer, CustomerBody, CustomersResponse } from '@hortifruit/schemas';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { useGuardedFetch } from './guard';
import { adminKeys } from './keys';

export type CustomerStatusFilter = 'active' | 'inactive' | 'all';

export function useCustomers(filters: { search?: string; status: CustomerStatusFilter }) {
  const guarded = useGuardedFetch();
  return useQuery({
    queryKey: adminKeys.customerList(filters),
    queryFn: () =>
      guarded(() =>
        api
          .get('admin/customers', {
            searchParams: { search: filters.search || undefined, status: filters.status },
          })
          .json<CustomersResponse>()
      ),
    placeholderData: keepPreviousData,
  });
}

export function useSaveCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: CustomerBody }) =>
      id
        ? api.patch(`admin/customers/${id}`, { json: body }).json<Customer>()
        : api.post('admin/customers', { json: body }).json<Customer>(),
    // O formulário mostra o erro (ex.: telefone repetido) junto dos campos.
    meta: { silent: true },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.customers });
      void qc.invalidateQueries({ queryKey: adminKeys.orders });
    },
  });
}

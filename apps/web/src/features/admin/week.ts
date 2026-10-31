import type { CurrentWeekResponse, OpenWeekBody } from '@hortifruit/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { useGuardedFetch } from './guard';
import { adminKeys } from './keys';

export function useCurrentWeek() {
  const guarded = useGuardedFetch();
  return useQuery({
    queryKey: adminKeys.week,
    queryFn: () => guarded(() => api.get('admin/weeks/current').json<CurrentWeekResponse>()),
    // A semana fecha sozinha na quinta 12h: o status precisa acompanhar.
    refetchInterval: 60_000,
  });
}

function useInvalidateWeek() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: adminKeys.week });
    void qc.invalidateQueries({ queryKey: adminKeys.orders });
  };
}

export function useCloseWeek() {
  const onSettled = useInvalidateWeek();
  return useMutation({
    mutationFn: () => api.post('admin/weeks/current/close').json<unknown>(),
    onSettled,
  });
}

export function useUpdateWeek() {
  const onSettled = useInvalidateWeek();
  return useMutation({
    mutationFn: (body: OpenWeekBody) => api.patch('admin/weeks/current', { json: body }).json<unknown>(),
    onSettled,
  });
}

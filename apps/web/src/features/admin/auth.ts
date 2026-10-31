import type { LoginBody, MeResponse } from '@hortifruit/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, isUnauthorized } from '@/lib/api';

import { adminKeys } from './keys';

/** ADM logado, ou null quando não há sessão (401). */
export function useMe() {
  return useQuery({
    queryKey: adminKeys.me,
    queryFn: async (): Promise<MeResponse | null> => {
      try {
        return await api.get('me').json<MeResponse>();
      } catch (error) {
        if (isUnauthorized(error)) return null;
        throw error;
      }
    },
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginBody) => api.post('sessions', { json: body }).json<unknown>(),
    meta: { silent: true },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: adminKeys.me });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete('sessions');
    },
    onSettled: () => {
      qc.removeQueries({ queryKey: adminKeys.all });
      qc.setQueryData(adminKeys.me, null);
    },
  });
}

/** Só aceita voltar para dentro do painel (nada de redirecionar para fora). */
export function safeRedirect(redirect: string | undefined): string {
  if (redirect && redirect.startsWith('/admin') && !redirect.startsWith('/admin/entrar')) {
    return redirect;
  }
  return '/admin';
}

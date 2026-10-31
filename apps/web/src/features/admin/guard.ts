import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { isUnauthorized } from '@/lib/api';

import { adminKeys } from './keys';

/**
 * Embrulha a chamada de uma query do painel: 401 (sessão vencida) zera o `me`, e o layout volta
 * para o login. As mutações já fazem isso pelo MutationCache.
 */
export function useGuardedFetch() {
  const qc = useQueryClient();
  return useCallback(
    async <T>(request: () => Promise<T>): Promise<T> => {
      try {
        return await request();
      } catch (error) {
        if (isUnauthorized(error)) qc.setQueryData(adminKeys.me, null);
        throw error;
      }
    },
    [qc]
  );
}

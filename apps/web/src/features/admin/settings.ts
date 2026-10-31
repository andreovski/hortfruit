import type {
  AdminBody,
  AdminsResponse,
  AdminUser,
  Settings,
  UpdateAdminBody,
  UpdateSettingsBody,
} from '@hortifruit/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { useGuardedFetch } from './guard';
import { adminKeys } from './keys';

export function useSettings() {
  const guarded = useGuardedFetch();
  return useQuery({
    queryKey: adminKeys.settings,
    queryFn: () => guarded(() => api.get('admin/settings').json<Settings>()),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateSettingsBody) => api.patch('admin/settings', { json: body }).json<Settings>(),
    onSuccess: (settings) => qc.setQueryData(adminKeys.settings, settings),
  });
}

export function useAdmins() {
  const guarded = useGuardedFetch();
  return useQuery({
    queryKey: adminKeys.admins,
    queryFn: () => guarded(() => api.get('admin/admins').json<AdminsResponse>()),
  });
}

export function useCreateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminBody) => api.post('admin/admins', { json: body }).json<AdminUser>(),
    meta: { silent: true },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.admins }),
  });
}

export function useUpdateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAdminBody }) =>
      api.patch(`admin/admins/${id}`, { json: body }).json<AdminUser>(),
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.admins }),
  });
}

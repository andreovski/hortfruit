import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router';
import { render } from '@testing-library/react';
import { Toaster } from 'sonner';

import { createQueryClient } from '@/lib/query-client';
import { adminRoutes } from '@/routes/admin/routes';

/** Monta só o painel (sem o app do restaurante) numa URL. */
export function renderAdmin(path: string) {
  // O router rola a página ao navegar; o jsdom não implementa.
  window.scrollTo = () => {};
  const root = createRootRoute({ component: Outlet });
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createRouter({ routeTree: root.addChildren(adminRoutes(root)), history });
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({
    ...queryClient.getDefaultOptions(),
    queries: { ...queryClient.getDefaultOptions().queries, retry: false },
  });
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
  return { ...utils, router, queryClient, history };
}

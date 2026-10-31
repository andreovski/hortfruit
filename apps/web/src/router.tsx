import {
  createRootRoute,
  createRouter,
  Outlet,
  type RouterHistory,
} from '@tanstack/react-router';

import { adminRoutes } from '@/routes/admin/routes';
import { NotFoundPage } from '@/routes/not-found';
import { shopRoutes } from '@/routes/shop/routes';

// Rotas em código, URLs em português. Dois mundos no mesmo SPA:
// - app do restaurante (público, mobile-first): routes/shop
// - painel ADM (/admin, com senha, desktop-first): routes/admin
export const rootRoute = createRootRoute({ component: Outlet, notFoundComponent: NotFoundPage });

export function createAppRouter(history?: RouterHistory) {
  const routeTree = rootRoute.addChildren([...shopRoutes(rootRoute), ...adminRoutes(rootRoute)]);
  return createRouter({ routeTree, history, defaultPreload: 'intent', scrollRestoration: true });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}

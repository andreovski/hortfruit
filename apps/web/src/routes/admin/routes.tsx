import { type AnyRoute, createRoute } from '@tanstack/react-router';

import { AdminLayout } from '@/components/admin/AdminLayout';

import { CustomersPage } from './customers';
import { LoginPage } from './login';
import { OrdersPage } from './orders';
import { ProductsPage } from './products';
import { PurchaseListPage } from './purchase-list';
import { SettingsPage } from './settings';

export interface LoginSearch {
  redirect?: string;
}

// Painel ADM (/admin, desktop-first, com senha). O login fica fora do layout; o layout confere a
// sessão (GET me) e manda para /admin/entrar?redirect=... quando não há.
export function adminRoutes(root: AnyRoute) {
  const login = createRoute({
    getParentRoute: () => root,
    path: '/admin/entrar',
    validateSearch: (search: Record<string, unknown>): LoginSearch => ({
      redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    }),
    component: LoginPage,
  });

  const layout = createRoute({
    getParentRoute: () => root,
    path: '/admin',
    component: AdminLayout,
  });

  const child = (path: string, component: () => React.ReactNode) =>
    createRoute({ getParentRoute: () => layout, path, component });

  return [
    login,
    layout.addChildren([
      child('/', OrdersPage),
      child('/lista-de-compra', PurchaseListPage),
      child('/clientes', CustomersPage),
      child('/produtos', ProductsPage),
      child('/ajustes', SettingsPage),
    ]),
  ];
}

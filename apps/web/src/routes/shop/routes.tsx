import { type AnyRoute, createRoute } from '@tanstack/react-router';

import { CatalogPage } from './catalog-page';
import { CheckoutPage } from './checkout-page';
import { MyOrdersPage } from './my-orders-page';
import { OrderPage } from './order-page';
import { ProductPage } from './product-page';

// App do restaurante: público, mobile-first, sem login (escopo 6).
export function shopRoutes(root: AnyRoute) {
  const orderRoute = createRoute({
    getParentRoute: () => root,
    path: '/pedido/$token',
    // ?novo=1 = acabou de enviar: a tela vira a confirmação.
    validateSearch: (search: Record<string, unknown>): { novo?: 1 } =>
      search.novo === 1 || search.novo === '1' ? { novo: 1 } : {},
    component: function OrderRouteComponent() {
      const { token } = orderRoute.useParams();
      const { novo } = orderRoute.useSearch();
      return <OrderPage key={token} token={token} isNew={novo === 1} />;
    },
  });

  return [
    createRoute({ getParentRoute: () => root, path: '/', component: CatalogPage }),
    createRoute({
      getParentRoute: () => root,
      path: '/produto/$productId',
      component: ProductPage,
    }),
    createRoute({ getParentRoute: () => root, path: '/finalizar', component: CheckoutPage }),
    createRoute({ getParentRoute: () => root, path: '/meus-pedidos', component: MyOrdersPage }),
    orderRoute,
  ];
}

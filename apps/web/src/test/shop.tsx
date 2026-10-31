import type { CatalogProduct, CatalogResponse, PublicOrder, Week } from '@hortifruit/schemas';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { render } from '@testing-library/react';
import { Toaster } from 'sonner';
import { vi } from 'vitest';

import { cartStore, editCartStore } from '@/features/shop/cart-store';
import { createQueryClient } from '@/lib/query-client';
import { shopRoutes } from '@/routes/shop/routes';

/* ------------------------------- API falsa -------------------------------- */

type Handler = (request: Request) => Response | Promise<Response>;

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * Troca o fetch por rotas "MÉTODO /api/caminho". O `api` (ky) monta URLs relativas (/api/...), que
 * o Request do Node não aceita: aqui elas passam a valer contra http://localhost.
 */
export function mockApi(routes: Record<string, Handler>) {
  const NativeRequest = globalThis.Request;
  class RelativeRequest extends NativeRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      super(
        typeof input === 'string' && input.startsWith('/')
          ? new URL(input, 'http://localhost').href
          : input,
        init
      );
    }
  }
  vi.stubGlobal('Request', RelativeRequest);
  const calls: { method: string; path: string; body: unknown }[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const request = input instanceof Request ? input : new RelativeRequest(input);
    const url = new URL(request.url);
    const key = `${request.method} ${url.pathname}`;
    const text = await request.clone().text();
    calls.push({
      method: request.method,
      path: url.pathname,
      body: text ? JSON.parse(text) : null,
    });
    const handler = routes[key];
    if (!handler) return json({ message: `Sem mock para ${key}` }, 500);
    return handler(request);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock };
}

/* --------------------------------- Dados ---------------------------------- */

const inThreeDays = () => new Date(Date.now() + 3 * 86_400_000).toISOString();

export function makeWeek(overrides: Partial<Week> = {}): Week {
  return {
    id: '00000000-0000-4000-8000-0000000000aa',
    deliveryDate: '2030-11-08',
    closesAt: inThreeDays(),
    closedAt: null,
    openedAt: '2026-10-31T12:00:00.000Z',
    isOpen: true,
    ...overrides,
  };
}

export const TOMATE: CatalogProduct = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Tomate',
  category: 'LEGUMES',
  saleDescription: 'Quilo',
  unit: 'kg',
  minQuantity: 10,
  priceCents: 690,
  available: true,
  badge: null,
  imageUrl: '/products/tomate.svg',
  color: '#FBE4DE',
  description: null,
};

export const ALHO: CatalogProduct = {
  ...TOMATE,
  id: '00000000-0000-4000-8000-000000000002',
  name: 'Alho',
  minQuantity: 2,
  priceCents: 2800,
  badge: 'DESTAQUE',
  imageUrl: '/products/alho.svg',
};

export const MORANGO: CatalogProduct = {
  ...TOMATE,
  id: '00000000-0000-4000-8000-000000000003',
  name: 'Morango',
  category: 'FRUTAS',
  unit: 'caixa',
  saleDescription: 'Caixa com 4 bandejas',
  minQuantity: 1,
  priceCents: 3200,
  available: false,
  imageUrl: '/products/morango.svg',
};

export function makeCatalog(overrides: Partial<CatalogResponse> = {}): CatalogResponse {
  return {
    week: makeWeek(),
    publishedAt: '2026-11-02T11:00:00.000Z',
    minOrderCents: 20000,
    whatsapp: '41999998888',
    products: [TOMATE, ALHO, MORANGO],
    ...overrides,
  };
}

export function makeOrder(overrides: Partial<PublicOrder> = {}): PublicOrder {
  return {
    token: 'tok_abcdefghijklmnopqrstuvwxyz123456',
    number: 1048,
    status: 'NOVO',
    createdAt: '2026-11-02T11:15:00.000Z',
    updatedAt: '2026-11-02T11:15:00.000Z',
    confirmedAt: null,
    deliveredAt: null,
    canceledAt: null,
    canceledBy: null,
    note: 'Portão lateral',
    totalCents: 12500,
    items: [
      {
        productId: TOMATE.id,
        name: 'Tomate',
        unit: 'kg',
        quantity: 10,
        unitPriceCents: 690,
        subtotalCents: 6900,
        imageUrl: TOMATE.imageUrl,
        color: TOMATE.color,
      },
      {
        productId: ALHO.id,
        name: 'Alho',
        unit: 'kg',
        quantity: 2,
        unitPriceCents: 2800,
        subtotalCents: 5600,
        imageUrl: ALHO.imageUrl,
        color: ALHO.color,
      },
    ],
    customer: {
      name: 'Cantina Bella Vista',
      maskedAddress: 'Rua Itu…, 12…',
      neighborhood: 'Centro',
    },
    week: makeWeek(),
    canChange: true,
    ...overrides,
  };
}

/* -------------------------------- Render ---------------------------------- */

export function resetShopStorage() {
  window.localStorage.clear();
  cartStore.reload();
  editCartStore.reload();
}

/** Monta só o app do restaurante numa URL, com Query e toasts. */
export function renderShop(path: string) {
  // O router restaura a rolagem; o jsdom não implementa scrollTo.
  vi.stubGlobal('scrollTo', vi.fn());
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false, staleTime: Infinity } });
  const root = createRootRoute({ component: Outlet });
  const router = createRouter({
    routeTree: root.addChildren(shopRoutes(root)),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
  return { ...view, router, queryClient };
}

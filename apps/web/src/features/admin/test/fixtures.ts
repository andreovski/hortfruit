import type {
  AdminOrderDetail,
  AdminOrdersResponse,
  AdminProduct,
  AdminProductsResponse,
  CurrentWeekResponse,
  MeResponse,
  Week,
} from '@hortifruit/schemas';

import { mockRoute } from './mock-api';

export const me: MeResponse = {
  admin: {
    id: 'adm-1',
    name: 'Ana',
    email: 'ana@morroverde.com.br',
    phone: null,
    active: true,
    createdAt: '2026-10-01T12:00:00.000Z',
  },
};

export const openWeek: Week = {
  id: 'week-1',
  deliveryDate: '2026-11-06',
  closesAt: '2026-11-05T15:00:00.000Z',
  closedAt: null,
  openedAt: '2026-11-02T11:15:00.000Z',
  isOpen: true,
};

export const ordersResponse: AdminOrdersResponse = {
  week: openWeek,
  indicators: {
    awaitingConfirmation: 2,
    weekOrders: 5,
    weekTotalCents: 123_450,
    activeCustomersWithoutOrder: 3,
  },
  orders: [
    {
      id: 'o-1048',
      number: 1048,
      status: 'NOVO',
      createdAt: '2026-11-04T12:12:00.000Z',
      updatedAt: '2026-11-04T12:12:00.000Z',
      editedAt: null,
      customer: { id: 'c-1', name: 'Cantina Bella Vista', neighborhood: 'Alto da XV' },
      itemCount: 5,
      totalCents: 41_250,
    },
    {
      id: 'o-1047',
      number: 1047,
      status: 'CONFIRMADO',
      createdAt: '2026-11-03T22:30:00.000Z',
      updatedAt: '2026-11-03T22:30:00.000Z',
      editedAt: '2026-11-03T23:00:00.000Z',
      customer: { id: 'c-2', name: 'Cozinha da Vó Lurdes', neighborhood: 'Rebouças' },
      itemCount: 3,
      totalCents: 20_000,
    },
  ],
};

export const orderDetail: AdminOrderDetail = {
  ...ordersResponse.orders[0],
  note: 'Receber pela porta dos fundos.',
  confirmedAt: null,
  deliveredAt: null,
  canceledAt: null,
  canceledBy: null,
  customer: {
    id: 'c-1',
    name: 'Cantina Bella Vista',
    neighborhood: 'Alto da XV',
    contactName: 'Marcos Antunes',
    phone: '41998765432',
    address: 'Rua Itupava, 1240',
    city: 'Curitiba',
    notes: null,
  },
  items: [
    {
      productId: 'p-tomate',
      name: 'Tomate',
      unit: 'kg',
      quantity: 10,
      unitPriceCents: 690,
      subtotalCents: 6900,
      imageUrl: '/products/tomate.svg',
      color: '#FBE4DE',
    },
  ],
  week: openWeek,
};

export function product(overrides: Partial<AdminProduct> = {}): AdminProduct {
  return {
    id: 'p-tomate',
    name: 'Tomate',
    category: 'LEGUMES',
    unit: 'kg',
    saleDescription: 'Quilo',
    minQuantity: 5,
    imageUrl: '/products/tomate.svg',
    color: '#FBE4DE',
    description: null,
    sortOrder: 1,
    archived: false,
    draft: { priceCents: 690, available: true, badge: null },
    published: { priceCents: 690, available: true, badge: null },
    previousPriceCents: 650,
    changed: false,
    ...overrides,
  };
}

export const productsResponse: AdminProductsResponse = {
  products: [
    product(),
    product({
      id: 'p-manga',
      name: 'Manga',
      category: 'FRUTAS',
      draft: { priceCents: 700, available: true, badge: 'DESTAQUE' },
      published: { priceCents: 650, available: true, badge: null },
      changed: true,
    }),
  ],
  publishedAt: '2026-11-02T11:15:00.000Z',
  changedCount: 1,
};

export const weekSuggestion = { deliveryDate: '2026-11-13', closesAt: '2026-11-12T15:00:00.000Z' };

/** Rotas que todo layout do painel chama. */
export function mockShell(week: CurrentWeekResponse['week'] = openWeek) {
  mockRoute('GET', 'me', me);
  mockRoute('GET', 'admin/orders/new-count', { count: 2 });
  mockRoute('GET', 'admin/weeks/current', { week, suggestion: weekSuggestion });
  mockRoute('GET', 'admin/settings', { minOrderCents: 20_000, uploadsEnabled: false, whatsapp: '41999990000' });
}

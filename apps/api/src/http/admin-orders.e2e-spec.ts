import type {
  AdminOrderDetail,
  AdminOrdersResponse,
  OrderCreatedResponse,
  PurchaseListResponse,
} from '@hortifruit/schemas';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import {
  client,
  createCustomer,
  createWeek,
  loginAsOwner,
  orderScenario,
  pastDate,
  resetDatabase,
} from '@/test/helpers';

beforeAll(() => app.ready());
afterAll(() => app.close());
beforeEach(resetDatabase);

/** Semana aberta com 3 pedidos (2 clientes) e um cliente ativo sem pedido. */
async function scenario() {
  const base = await orderScenario();
  const sabor = await createCustomer({ name: 'Sabor da Terra', neighborhood: 'Batel' });
  await createCustomer({ name: 'Sem pedido' });
  await createCustomer({ name: 'Inativo', active: false });
  const place = async (phone: string, items: { productId: string; quantity: number }[]) => {
    const res = await client(app).post('/orders', { phone, items });
    if (res.statusCode !== 201) throw new Error(res.body);
    const { token } = res.json<OrderCreatedResponse>();
    return prisma.order.findUniqueOrThrow({ where: { token } });
  };
  const o1 = await place(base.customer.phone, [
    { productId: base.tomate.id, quantity: 20 },
    { productId: base.laranja.id, quantity: 2 },
  ]); // 13800 + 10400 = 24200
  const o2 = await place(sabor.phone, [{ productId: base.tomate.id, quantity: 30 }]); // 20700
  const o3 = await place(base.customer.phone, [{ productId: base.laranja.id, quantity: 5 }]); // 26000
  await prisma.order.update({ where: { id: o1.id }, data: { createdAt: pastDate(3) } });
  await prisma.order.update({ where: { id: o2.id }, data: { createdAt: pastDate(2) } });
  return { ...base, sabor, o1, o2, o3 };
}

describe('pedidos no painel', () => {
  it('lista da semana atual com indicadores, filtros e busca', async () => {
    const { o1, o2, o3, week } = await scenario();
    const { cookie } = await loginAsOwner(app);
    const api = client(app, cookie);
    await prisma.order.update({ where: { id: o3.id }, data: { status: 'CANCELADO' } });
    await prisma.order.update({ where: { id: o2.id }, data: { status: 'CONFIRMADO' } });

    const res = await api.get('/admin/orders');
    expect(res.statusCode).toBe(200);
    const body = res.json<AdminOrdersResponse>();
    expect(body.week?.id).toBe(week.id);
    expect(body.orders.map((o) => o.number)).toEqual([o3.number, o2.number, o1.number]);
    expect(body.indicators).toEqual({
      awaitingConfirmation: 1,
      weekOrders: 2,
      weekTotalCents: 24200 + 20700,
      activeCustomersWithoutOrder: 1,
    });
    expect(body.orders[2]).toMatchObject({
      itemCount: 2,
      totalCents: 24200,
      customer: { name: 'Cantina Bella Vista', neighborhood: 'Alto da XV' },
      editedAt: null,
    });
    expect(res.body).not.toContain(o1.token);

    const novo = (await api.get('/admin/orders?status=NOVO')).json<AdminOrdersResponse>();
    expect(novo.orders.map((o) => o.id)).toEqual([o1.id]);
    expect(novo.indicators.weekOrders).toBe(2);

    const byName = (await api.get('/admin/orders?search=sabor')).json<AdminOrdersResponse>();
    expect(byName.orders.map((o) => o.id)).toEqual([o2.id]);
    const byNumber = (
      await api.get(`/admin/orders?search=%23${o3.number}`)
    ).json<AdminOrdersResponse>();
    expect(byNumber.orders.map((o) => o.id)).toEqual([o3.id]);

    // Semana nova (mais recente) sem pedidos; a antiga pelo id; todas com `all`.
    await prisma.week.update({ where: { id: week.id }, data: { closedAt: new Date() } });
    const next = await createWeek({ openedAt: new Date() });
    const current = (await api.get('/admin/orders')).json<AdminOrdersResponse>();
    expect(current.week?.id).toBe(next.id);
    expect(current.orders).toEqual([]);
    expect(current.indicators.activeCustomersWithoutOrder).toBe(3);
    const old = (await api.get(`/admin/orders?weekId=${week.id}`)).json<AdminOrdersResponse>();
    expect(old.orders).toHaveLength(3);
    expect(old.week?.isOpen).toBe(false);
    const all = (await api.get('/admin/orders?weekId=all')).json<AdminOrdersResponse>();
    expect(all.week).toBeNull();
    expect(all.orders).toHaveLength(3);
    expect(
      (await api.get('/admin/orders?weekId=00000000-0000-4000-8000-000000000000')).statusCode
    ).toBe(404);
  });

  it('contador de novos da semana atual', async () => {
    const { o1 } = await scenario();
    const { cookie } = await loginAsOwner(app);
    const api = client(app, cookie);
    expect((await api.get('/admin/orders/new-count')).json()).toEqual({ count: 3 });
    await prisma.order.update({ where: { id: o1.id }, data: { status: 'CONFIRMADO' } });
    expect((await api.get('/admin/orders/new-count')).json()).toEqual({ count: 2 });
  });

  it('detalhe com o cliente inteiro e sem o token', async () => {
    const { o1, customer } = await scenario();
    const { cookie } = await loginAsOwner(app);
    const res = await client(app, cookie).get(`/admin/orders/${o1.id}`);
    expect(res.statusCode).toBe(200);
    const detail = res.json<AdminOrderDetail>();
    expect(detail.customer).toMatchObject({
      id: customer.id,
      phone: customer.phone,
      address: 'Rua Itupava, 1234',
      contactName: 'Marcos',
      city: 'Curitiba',
    });
    expect(detail.items).toHaveLength(2);
    expect(detail.week.deliveryDate).toBe('2026-11-06');
    expect(res.body).not.toContain(o1.token);
    expect(
      (await client(app, cookie).get('/admin/orders/00000000-0000-4000-8000-000000000000'))
        .statusCode
    ).toBe(404);
  });

  it('muda o status pelas transições permitidas', async () => {
    const { o1, o2 } = await scenario();
    const { cookie } = await loginAsOwner(app);
    const api = client(app, cookie);
    const set = (id: string, status: string) => api.post(`/admin/orders/${id}/status`, { status });

    const confirmed = await set(o1.id, 'CONFIRMADO');
    expect(confirmed.statusCode).toBe(200);
    expect(confirmed.json<AdminOrderDetail>().confirmedAt).not.toBeNull();

    const delivered = (await set(o1.id, 'ENTREGUE')).json<AdminOrderDetail>();
    expect(delivered.status).toBe('ENTREGUE');
    expect(delivered.deliveredAt).not.toBeNull();

    const notAllowed = await set(o1.id, 'NOVO');
    expect(notAllowed.statusCode).toBe(409);
    expect(notAllowed.json().message).toBe('Mudança de status não permitida.');

    const back = (await set(o1.id, 'CONFIRMADO')).json<AdminOrderDetail>();
    expect(back).toMatchObject({ status: 'CONFIRMADO', deliveredAt: null });
    expect(back.confirmedAt).not.toBeNull();

    const canceled = (await set(o2.id, 'CANCELADO')).json<AdminOrderDetail>();
    expect(canceled).toMatchObject({ status: 'CANCELADO', canceledBy: 'ADMIN' });
    expect((await set(o2.id, 'NOVO')).statusCode).toBe(409);
    expect((await set(o2.id, 'NADA')).statusCode).toBe(400);
  });
});

describe('lista de compra', () => {
  it('soma a semana por produto, sem os cancelados', async () => {
    const { o3, tomate, laranja, week } = await scenario();
    await prisma.order.update({ where: { id: o3.id }, data: { status: 'CANCELADO' } });
    const { cookie } = await loginAsOwner(app);
    const res = await client(app, cookie).get('/admin/purchase-list');
    expect(res.statusCode).toBe(200);
    const list = res.json<PurchaseListResponse>();
    expect(list.week?.id).toBe(week.id);
    expect(list.rows).toEqual([
      {
        productId: laranja.id,
        name: 'Laranja',
        unit: 'saco',
        saleDescription: 'Saco 20 kg',
        quantity: 2,
        orderCount: 1,
        totalCents: 10400,
      },
      {
        productId: tomate.id,
        name: 'Tomate',
        unit: 'kg',
        saleDescription: 'Quilo',
        quantity: 50,
        orderCount: 2,
        totalCents: 34500,
      },
    ]);
    expect(list.totalCents).toBe(44900);
  });

  it('exporta CSV com BOM, ; e o nome do arquivo pela entrega', async () => {
    await scenario();
    const { cookie } = await loginAsOwner(app);
    const res = await client(app, cookie).get('/admin/purchase-list.csv');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(res.headers['content-disposition']).toBe(
      'attachment; filename="lista-de-compra-2026-11-06.csv"'
    );
    expect(res.rawPayload.subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]));
    const lines = res.body
      .replace(/^\uFEFF/, '')
      .trim()
      .split('\r\n');
    expect(lines).toEqual([
      'Produto;Forma de venda;Quantidade;Unidade;Pedidos;Total estimado (R$)',
      'Laranja;Saco 20 kg;7;saco;2;364,00',
      'Tomate;Quilo;50;kg;2;345,00',
    ]);
  });

  it('sem semana: lista vazia', async () => {
    const { cookie } = await loginAsOwner(app);
    const list = (await client(app, cookie).get('/admin/purchase-list')).json();
    expect(list).toEqual({ week: null, rows: [], totalCents: 0 });
  });
});

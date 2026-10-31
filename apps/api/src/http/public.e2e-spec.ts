import type {
  CatalogResponse,
  IdentifyResponse,
  LookupOrdersResponse,
  OrderCreatedResponse,
  PublicOrder,
} from '@hortifruit/schemas';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '@/app';
import { clock } from '@/lib/clock';
import { prisma } from '@/lib/prisma';
import {
  client,
  createCustomer,
  createProduct,
  createWeek,
  orderScenario,
  pastDate,
  resetDatabase,
} from '@/test/helpers';

const api = client(app);

describe('rotas públicas', () => {
  beforeAll(() => app.ready());
  afterAll(() => app.close());
  beforeEach(async () => {
    vi.restoreAllMocks();
    await resetDatabase();
  });

  it('GET /health responde com o banco', async () => {
    const res = await api.get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', database: 'ok' });
  });

  describe('catálogo', () => {
    it('mostra só os publicados, com os valores publicados, em ordem', async () => {
      vi.stubEnv('WHATSAPP_NUMBER', '(41) 99999-0000');
      const week = await createWeek();
      await prisma.setting.create({
        data: { id: 1, minOrderCents: 15000, publishedAt: new Date('2026-11-02T11:00:00Z') },
      });
      await createProduct({
        name: 'Tomate',
        sortOrder: 2,
        draftPriceCents: 999,
        draftBadge: 'NOVO',
        publishedPriceCents: 690,
        publishedBadge: 'DESTAQUE',
      });
      await createProduct({ name: 'Abacaxi', sortOrder: 1, publishedAvailable: false });
      await createProduct({ name: 'Nunca publicado', publishedPriceCents: null });
      await createProduct({ name: 'Arquivado', archived: true });

      const res = await api.get('/catalog');
      vi.unstubAllEnvs();
      expect(res.statusCode).toBe(200);
      const body = res.json<CatalogResponse>();
      expect(body.products.map((p) => p.name)).toEqual(['Abacaxi', 'Tomate']);
      expect(body.products[1]).toMatchObject({
        priceCents: 690,
        badge: 'DESTAQUE',
        available: true,
      });
      expect(body.products[0].available).toBe(false);
      expect(body.week).toMatchObject({ id: week.id, deliveryDate: '2026-11-06', isOpen: true });
      expect(body.minOrderCents).toBe(15000);
      expect(body.publishedAt).toBe('2026-11-02T11:00:00.000Z');
      expect(body.whatsapp).toBe('41999990000');
    });

    it('sem semana e sem ajustes ainda responde', async () => {
      vi.stubEnv('WHATSAPP_NUMBER', '');
      const body = (await api.get('/catalog')).json<CatalogResponse>();
      vi.unstubAllEnvs();
      expect(body).toEqual({
        week: null,
        publishedAt: null,
        minOrderCents: 20000,
        whatsapp: null,
        products: [],
      });
    });

    it('semana fechada à mão aparece fechada', async () => {
      await createWeek({ closedAt: pastDate() });
      const body = (await api.get('/catalog')).json<CatalogResponse>();
      expect(body.week?.isOpen).toBe(false);
    });
  });

  describe('identificação pelo telefone', () => {
    it('acha o cliente e mostra só nome e endereço parcial', async () => {
      await createCustomer({ phone: '41998765432' });
      const res = await api.post('/checkout/identify', { phone: '+55 (41) 99876-5432' });
      expect(res.statusCode).toBe(200);
      expect(res.json<IdentifyResponse>()).toEqual({
        found: true,
        customer: {
          name: 'Cantina Bella Vista',
          maskedAddress: 'Rua Itu…, 12…',
          neighborhood: 'Alto da XV',
        },
      });
      expect(res.body).not.toContain('1234');
      expect(res.body).not.toContain('12.345');
      expect(res.body).not.toContain('@');
    });

    it('não encontrado e inativo respondem igual', async () => {
      await createCustomer({ phone: '41998765432', active: false });
      const inactive = await api.post('/checkout/identify', { phone: '41998765432' });
      const missing = await api.post('/checkout/identify', { phone: '41911112222' });
      expect(inactive.json()).toEqual({ found: false });
      expect(missing.json()).toEqual({ found: false });
    });

    it('telefone inválido → 400', async () => {
      const res = await api.post('/checkout/identify', { phone: '1234-5678' });
      expect(res.statusCode).toBe(400);
      expect(res.json().message).toBe('Telefone inválido.');
    });
  });

  describe('pedido', () => {
    it('cria o pedido com o nome e o preço do momento', async () => {
      const { customer, tomate, laranja, week } = await orderScenario();
      const res = await api.post('/orders', {
        phone: customer.phone,
        items: [
          { productId: tomate.id, quantity: 20 },
          { productId: laranja.id, quantity: 2 },
        ],
        note: 'Portão azul',
      });
      expect(res.statusCode).toBe(201);
      const created = res.json<OrderCreatedResponse>();
      expect(created.number).toBe(1001);
      expect(created.token.length).toBeGreaterThanOrEqual(32);

      const order = await prisma.order.findUniqueOrThrow({
        where: { token: created.token },
        include: { items: true },
      });
      expect(order).toMatchObject({
        status: 'NOVO',
        totalCents: 20 * 690 + 2 * 5200,
        weekId: week.id,
        customerId: customer.id,
        note: 'Portão azul',
      });
      expect(order.items).toHaveLength(2);
      expect(order.items.find((i) => i.productId === laranja.id)).toMatchObject({
        name: 'Laranja',
        unit: 'saco',
        unitPriceCents: 5200,
        subtotalCents: 10400,
      });

      // Mudar o produto depois não mexe no pedido.
      await prisma.product.update({
        where: { id: tomate.id },
        data: { name: 'Tomate italiano', publishedPriceCents: 1 },
      });
      const view = (await api.get(`/orders/${created.token}`)).json<PublicOrder>();
      expect(view.items.find((i) => i.productId === tomate.id)).toMatchObject({
        name: 'Tomate',
        unitPriceCents: 690,
        imageUrl: '/products/tomate.svg',
      });
      expect(view).toMatchObject({
        number: 1001,
        status: 'NOVO',
        canChange: true,
        canceledBy: null,
        customer: { name: 'Cantina Bella Vista', maskedAddress: 'Rua Itu…, 12…' },
        week: { id: week.id, isOpen: true },
      });
      expect(JSON.stringify(view)).not.toContain('contato@bellavista.com');
    });

    it('semana fechada → 409', async () => {
      const { customer, tomate, week } = await orderScenario();
      await prisma.week.update({ where: { id: week.id }, data: { closesAt: pastDate() } });
      const res = await api.post('/orders', {
        phone: customer.phone,
        items: [{ productId: tomate.id, quantity: 40 }],
      });
      expect(res.statusCode).toBe(409);
      expect(res.json().message).toBe('Os pedidos desta semana já fecharam.');
    });

    it('semana que fecha pelo relógio (clock) → 409', async () => {
      const { customer, tomate, week } = await orderScenario();
      vi.spyOn(clock, 'now').mockReturnValue(new Date(week.closesAt.getTime() + 1));
      const res = await api.post('/orders', {
        phone: customer.phone,
        items: [{ productId: tomate.id, quantity: 40 }],
      });
      expect(res.statusCode).toBe(409);
    });

    it('abaixo do mínimo do produto ou do pedido → 422 com o código', async () => {
      const { customer, tomate, laranja } = await orderScenario();
      const belowProduct = await api.post('/orders', {
        phone: customer.phone,
        items: [
          { productId: tomate.id, quantity: 5 },
          { productId: laranja.id, quantity: 4 },
        ],
      });
      expect(belowProduct.statusCode).toBe(422);
      expect(belowProduct.json()).toEqual({
        message: 'Tomate: o mínimo é 10.',
        code: 'BELOW_PRODUCT_MIN',
      });

      const belowOrder = await api.post('/orders', {
        phone: customer.phone,
        items: [{ productId: tomate.id, quantity: 10 }],
      });
      expect(belowOrder.statusCode).toBe(422);
      expect(belowOrder.json().code).toBe('BELOW_ORDER_MIN');
      expect(await prisma.order.count()).toBe(0);
    });

    it('produto em falta, não publicado ou arquivado → 422', async () => {
      const { customer, tomate, laranja } = await orderScenario();
      await prisma.product.update({
        where: { id: laranja.id },
        data: { publishedAvailable: false },
      });
      const unavailable = await api.post('/orders', {
        phone: customer.phone,
        items: [
          { productId: tomate.id, quantity: 40 },
          { productId: laranja.id, quantity: 1 },
        ],
      });
      expect(unavailable.statusCode).toBe(422);
      expect(unavailable.json().code).toBe('UNAVAILABLE');

      const draft = await createProduct({ name: 'Rascunho', publishedPriceCents: null });
      const unknown = await api.post('/orders', {
        phone: customer.phone,
        items: [
          { productId: tomate.id, quantity: 40 },
          { productId: draft.id, quantity: 10 },
        ],
      });
      expect(unknown.json().code).toBe('UNKNOWN_PRODUCT');
    });

    it('cliente inativo ou desconhecido → 404', async () => {
      const { customer, tomate } = await orderScenario();
      await prisma.customer.update({ where: { id: customer.id }, data: { active: false } });
      const inactive = await api.post('/orders', {
        phone: customer.phone,
        items: [{ productId: tomate.id, quantity: 40 }],
      });
      expect(inactive.statusCode).toBe(404);
      expect(inactive.json().message).toBe('Não encontramos seu cadastro. Fale com a Morro Verde.');
      const unknown = await api.post('/orders', {
        phone: '41911112222',
        items: [{ productId: tomate.id, quantity: 40 }],
      });
      expect(unknown.statusCode).toBe(404);
    });

    it('corpo inválido → 400 com mensagem', async () => {
      const res = await api.post('/orders', { phone: '41998765432', items: [] });
      expect(res.statusCode).toBe(400);
      expect(res.json().message).toBe('O pedido está vazio.');
    });
  });

  describe('pedido pelo link', () => {
    async function placeOrder() {
      const scenario = await orderScenario();
      const res = await api.post('/orders', {
        phone: scenario.customer.phone,
        items: [{ productId: scenario.tomate.id, quantity: 30 }],
      });
      return { ...scenario, ...res.json<OrderCreatedResponse>() };
    }

    it('token desconhecido → 404', async () => {
      const res = await api.get('/orders/nao-existe-este-token-aqui');
      expect(res.statusCode).toBe(404);
      expect(res.json().message).toBe('Pedido não encontrado.');
    });

    it('edita com o catálogo de agora e volta CONFIRMADO para NOVO', async () => {
      const { token, number, tomate, laranja } = await placeOrder();
      await prisma.order.update({
        where: { token },
        data: { status: 'CONFIRMADO', confirmedAt: new Date() },
      });
      await prisma.product.update({ where: { id: tomate.id }, data: { publishedPriceCents: 700 } });

      const res = await api.put(`/orders/${token}`, {
        items: [
          { productId: tomate.id, quantity: 10 },
          { productId: laranja.id, quantity: 3 },
        ],
        note: 'Trocar o tomate',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ token, number });

      const order = await prisma.order.findUniqueOrThrow({
        where: { token },
        include: { items: true },
      });
      expect(order).toMatchObject({
        status: 'NOVO',
        confirmedAt: null,
        totalCents: 7000 + 3 * 5200,
        note: 'Trocar o tomate',
      });
      expect(order.editedAt).not.toBeNull();
      expect(order.items).toHaveLength(2);
    });

    it('edição que não passa na validação → 422 e não mexe no pedido', async () => {
      const { token, tomate } = await placeOrder();
      const res = await api.put(`/orders/${token}`, {
        items: [{ productId: tomate.id, quantity: 10 }],
      });
      expect(res.statusCode).toBe(422);
      const order = await prisma.order.findUniqueOrThrow({
        where: { token },
        include: { items: true },
      });
      expect(order.items[0].quantity).toBe(30);
      expect(order.editedAt).toBeNull();
    });

    it('cancela; depois não edita nem cancela de novo', async () => {
      const { token, tomate } = await placeOrder();
      const res = await api.post(`/orders/${token}/cancel`);
      expect(res.statusCode).toBe(200);
      expect(res.json<PublicOrder>()).toMatchObject({
        status: 'CANCELADO',
        canceledBy: 'CUSTOMER',
        canChange: false,
      });
      expect(res.json<PublicOrder>().canceledAt).not.toBeNull();

      const again = await api.post(`/orders/${token}/cancel`);
      expect(again.statusCode).toBe(409);
      const edit = await api.put(`/orders/${token}`, {
        items: [{ productId: tomate.id, quantity: 40 }],
      });
      expect(edit.statusCode).toBe(409);
      expect(edit.json().message).toBe('Este pedido não pode mais ser alterado.');
    });

    it('depois do fechamento da semana não muda mais', async () => {
      const { token, tomate, week } = await placeOrder();
      await prisma.week.update({ where: { id: week.id }, data: { closedAt: new Date() } });
      const view = (await api.get(`/orders/${token}`)).json<PublicOrder>();
      expect(view.canChange).toBe(false);
      expect(view.week.isOpen).toBe(false);
      expect(
        (await api.put(`/orders/${token}`, { items: [{ productId: tomate.id, quantity: 40 }] }))
          .statusCode
      ).toBe(409);
      expect((await api.post(`/orders/${token}/cancel`)).statusCode).toBe(409);
    });

    it('meus pedidos: resumo dos tokens conhecidos, mais recentes primeiro', async () => {
      const first = await placeOrder();
      const second = await api.post('/orders', {
        phone: first.customer.phone,
        items: [
          { productId: first.tomate.id, quantity: 10 },
          { productId: first.laranja.id, quantity: 3 },
        ],
      });
      const secondToken = second.json<OrderCreatedResponse>().token;
      await prisma.order.update({
        where: { token: secondToken },
        data: { createdAt: new Date(Date.now() + 1000) },
      });

      const res = await api.post('/orders/lookup', {
        tokens: [first.token, secondToken, 'token-que-nao-existe'],
      });
      expect(res.statusCode).toBe(200);
      const { orders } = res.json<LookupOrdersResponse>();
      expect(orders.map((o) => o.token)).toEqual([secondToken, first.token]);
      expect(orders[0]).toMatchObject({
        number: 1002,
        itemCount: 2,
        deliveryDate: '2026-11-06',
        customerName: 'Cantina Bella Vista',
        canChange: true,
        totalCents: 6900 + 15600,
      });
      expect(orders[0].items[0]).toHaveProperty('imageUrl');

      expect((await api.post('/orders/lookup', { tokens: [] })).json()).toEqual({ orders: [] });
    });
  });
});

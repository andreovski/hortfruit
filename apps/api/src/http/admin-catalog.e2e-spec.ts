import { suggestNextWeek } from '@hortifruit/core';
import type {
  AdminProduct,
  AdminProductsResponse,
  CatalogResponse,
  CurrentWeekResponse,
  Customer,
  CustomersResponse,
  Settings,
} from '@hortifruit/schemas';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '@/app';
import { clock } from '@/lib/clock';
import { prisma } from '@/lib/prisma';
import { ensureInitialProducts } from '@/services/initial-products';
import {
  client,
  createCustomer,
  createProduct,
  createWeek,
  loginAsOwner,
  orderScenario,
  resetDatabase,
} from '@/test/helpers';

beforeAll(() => app.ready());
afterAll(() => app.close());
beforeEach(async () => {
  vi.restoreAllMocks();
  await resetDatabase();
});

const DAY = 86_400_000;
const futureWeek = () => ({
  deliveryDate: '2026-12-04',
  closesAt: new Date(Date.now() + 3 * DAY).toISOString(),
});

const NEW_PRODUCT = {
  name: 'Abobrinha',
  category: 'LEGUMES',
  unit: 'kg',
  saleDescription: 'Quilo',
  minQuantity: 3,
  imageUrl: '/products/abobrinha.svg',
  color: '#E3F1E2',
  description: '',
  priceCents: 590,
};

describe('produtos e publicação', () => {
  it('cria no fim da lista, como rascunho', async () => {
    await ensureInitialProducts(prisma);
    const { cookie } = await loginAsOwner(app);
    const api = client(app, cookie);
    const res = await api.post('/admin/products', NEW_PRODUCT);
    expect(res.statusCode).toBe(201);
    expect(res.json<AdminProduct>()).toMatchObject({
      name: 'Abobrinha',
      sortOrder: 14,
      description: null,
      archived: false,
      draft: { priceCents: 590, available: true, badge: null },
      published: null,
      previousPriceCents: null,
      changed: true,
    });

    const list = (await api.get('/admin/products')).json<AdminProductsResponse>();
    expect(list.products).toHaveLength(14);
    expect(list.products[0].name).toBe('Tomate');
    expect(list.products.find((p) => p.name === 'Manga')?.draft.badge).toBe('DESTAQUE');
    expect(list.products.find((p) => p.name === 'Morango')?.draft.available).toBe(false);
    expect(list.changedCount).toBe(14);
    expect(list.publishedAt).toBeNull();

    const invalid = await api.post('/admin/products', { ...NEW_PRODUCT, priceCents: 0 });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json().message).toBe('O valor precisa ser maior que zero.');
  });

  it('edita cadastro e rascunho sem mexer no publicado', async () => {
    const product = await createProduct({ publishedPriceCents: 690 });
    const { cookie } = await loginAsOwner(app);
    const api = client(app, cookie);
    const res = await api.patch(`/admin/products/${product.id}`, {
      priceCents: 750,
      available: false,
      badge: 'NOVO',
      minQuantity: 5,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<AdminProduct>()).toMatchObject({
      minQuantity: 5,
      draft: { priceCents: 750, available: false, badge: 'NOVO' },
      published: { priceCents: 690, available: true, badge: null },
      changed: true,
    });
    const archived = (
      await api.patch(`/admin/products/${product.id}`, { archived: true })
    ).json<AdminProduct>();
    expect(archived).toMatchObject({ archived: true, changed: false });
    expect(
      (await api.patch('/admin/products/00000000-0000-4000-8000-000000000000', { priceCents: 1 }))
        .statusCode
    ).toBe(404);
  });

  it('sem semana aberta e sem openWeek → 409', async () => {
    await ensureInitialProducts(prisma);
    const { cookie } = await loginAsOwner(app);
    const res = await client(app, cookie).post('/admin/products/publish', {});
    expect(res.statusCode).toBe(409);
    expect(res.json().message).toBe('Abra a semana de entrega para publicar.');
    expect(await prisma.week.count()).toBe(0);
    expect(await prisma.product.count({ where: { publishedPriceCents: { not: null } } })).toBe(0);
  });

  it('publica abrindo a semana; o app passa a mostrar; preço anterior na republicação', async () => {
    await ensureInitialProducts(prisma);
    const { cookie } = await loginAsOwner(app);
    const api = client(app, cookie);
    const now = new Date();
    vi.spyOn(clock, 'now').mockReturnValue(now);

    const published = await api.post('/admin/products/publish', { openWeek: futureWeek() });
    expect(published.statusCode).toBe(200);
    const body = published.json<AdminProductsResponse>();
    expect(body.changedCount).toBe(0);
    expect(body.publishedAt).toBe(now.toISOString());
    const tomate = body.products.find((p) => p.name === 'Tomate')!;
    expect(tomate).toMatchObject({
      published: { priceCents: 690, available: true, badge: null },
      previousPriceCents: null,
      changed: false,
    });

    const catalog = (await client(app).get('/catalog')).json<CatalogResponse>();
    expect(catalog.products).toHaveLength(13);
    expect(catalog.week).toMatchObject({ deliveryDate: '2026-12-04', isOpen: true });
    expect(catalog.products.find((p) => p.name === 'Morango')?.available).toBe(false);

    // Muda preço do tomate e arquiva a cebola; republica sem abrir semana nova.
    vi.restoreAllMocks();
    await api.patch(`/admin/products/${tomate.id}`, { priceCents: 790 });
    const cebola = body.products.find((p) => p.name === 'Cebola')!;
    await api.patch(`/admin/products/${cebola.id}`, { archived: true });
    const manga = body.products.find((p) => p.name === 'Manga')!;
    await api.patch(`/admin/products/${manga.id}`, { badge: null });
    const again = (await api.post('/admin/products/publish')).json<AdminProductsResponse>();
    expect(again.products.find((p) => p.id === tomate.id)).toMatchObject({
      published: { priceCents: 790 },
      previousPriceCents: 690,
    });
    expect(again.products.find((p) => p.id === manga.id)).toMatchObject({
      published: { badge: null },
      previousPriceCents: null,
    });
    expect(again.products.find((p) => p.id === cebola.id)?.published?.available).toBe(false);
    expect(await prisma.week.count()).toBe(1);

    // Republicar sem mudar o preço mantém o anterior.
    const third = (await api.post('/admin/products/publish', {})).json<AdminProductsResponse>();
    expect(third.products.find((p) => p.id === tomate.id)?.previousPriceCents).toBe(690);

    const after = (await client(app).get('/catalog')).json<CatalogResponse>();
    expect(after.products.map((p) => p.name)).not.toContain('Cebola');
    expect(after.products.find((p) => p.name === 'Tomate')?.priceCents).toBe(790);
  });

  it('openWeek com semana aberta fecha a anterior e abre a nova', async () => {
    const old = await createWeek();
    await createProduct();
    const { cookie } = await loginAsOwner(app);
    const api = client(app, cookie);
    const res = await api.post('/admin/products/publish', { openWeek: futureWeek() });
    expect(res.statusCode).toBe(200);
    expect(
      (await prisma.week.findUniqueOrThrow({ where: { id: old.id } })).closedAt
    ).not.toBeNull();
    const current = (await api.get('/admin/weeks/current')).json<CurrentWeekResponse>();
    expect(current.week).toMatchObject({ deliveryDate: '2026-12-04', isOpen: true });

    const past = await api.post('/admin/products/publish', {
      openWeek: { deliveryDate: '2020-01-03', closesAt: '2020-01-02T15:00:00.000Z' },
    });
    expect(past.statusCode).toBe(400);
  });
});

describe('semana', () => {
  it('mostra a atual e a sugestão; fecha à mão; ajusta datas', async () => {
    const { cookie } = await loginAsOwner(app);
    const api = client(app, cookie);
    const fixed = new Date('2026-11-02T12:00:00.000Z'); // segunda
    vi.spyOn(clock, 'now').mockReturnValue(fixed);
    const empty = (await api.get('/admin/weeks/current')).json<CurrentWeekResponse>();
    expect(empty).toEqual({ week: null, suggestion: suggestNextWeek(fixed) });
    expect(empty.suggestion.deliveryDate).toBe('2026-11-06');
    expect((await api.post('/admin/weeks/current/close')).statusCode).toBe(409);
    vi.restoreAllMocks();

    await createWeek();
    const adjusted = await api.patch('/admin/weeks/current', futureWeek());
    expect(adjusted.statusCode).toBe(200);
    expect(adjusted.json<CurrentWeekResponse>().week).toMatchObject({
      deliveryDate: '2026-12-04',
      isOpen: true,
    });

    const closed = await api.post('/admin/weeks/current/close');
    expect(closed.statusCode).toBe(200);
    const week = closed.json<CurrentWeekResponse>().week!;
    expect(week.isOpen).toBe(false);
    expect(week.closedAt).not.toBeNull();
    expect((await client(app).get('/catalog')).json<CatalogResponse>().week?.isOpen).toBe(false);
    expect((await api.patch('/admin/weeks/current', futureWeek())).statusCode).toBe(409);
  });
});

describe('ajustes', () => {
  it('lê e muda o pedido mínimo, que passa a valer no pedido', async () => {
    const { customer, tomate } = await orderScenario();
    const { cookie } = await loginAsOwner(app);
    const api = client(app, cookie);
    vi.stubEnv('WHATSAPP_NUMBER', '41999990000');
    vi.stubEnv('UPLOADTHING_TOKEN', '');
    expect((await api.get('/admin/settings')).json<Settings>()).toEqual({
      minOrderCents: 20000,
      uploadsEnabled: false,
      whatsapp: '41999990000',
    });
    vi.unstubAllEnvs();

    const patched = await api.patch('/admin/settings', { minOrderCents: 5000 });
    expect(patched.json<Settings>().minOrderCents).toBe(5000);
    expect((await api.patch('/admin/settings', { minOrderCents: -1 })).statusCode).toBe(400);

    const order = await client(app).post('/orders', {
      phone: customer.phone,
      items: [{ productId: tomate.id, quantity: 10 }],
    });
    expect(order.statusCode).toBe(201);
  });

  it('sem UPLOADTHING_TOKEN a rota de upload não existe', async () => {
    expect((await app.inject({ method: 'GET', url: '/uploadthing' })).statusCode).toBe(404);
  });
});

describe('clientes', () => {
  const BODY = {
    name: 'Bistrô Araucária',
    contactName: 'Paulo',
    phone: '(41) 98765-4321',
    cnpj: '',
    email: '',
    address: 'Rua Mateus Leme, 890',
    neighborhood: 'São Francisco',
    city: 'Curitiba',
    notes: 'Entregar até 10h',
  };

  it('cadastra, busca, edita e recusa telefone repetido ou inválido', async () => {
    const { cookie } = await loginAsOwner(app);
    const api = client(app, cookie);
    const created = await api.post('/admin/customers', BODY);
    expect(created.statusCode).toBe(201);
    const customer = created.json<Customer>();
    expect(customer).toMatchObject({
      phone: '41987654321',
      cnpj: null,
      email: null,
      active: true,
      orderCount: 0,
      lastOrderAt: null,
    });

    const dup = await api.post('/admin/customers', { ...BODY, phone: '41 98765 4321' });
    expect(dup.statusCode).toBe(409);
    expect(dup.json().message).toBe('Já existe um cliente com este telefone.');
    const bad = await api.post('/admin/customers', { ...BODY, phone: '0000-0000' });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().message).toBe('Telefone inválido.');

    await createCustomer({ name: 'Cantina Bella Vista', phone: '41998765432' });
    await createCustomer({ name: 'Antigo', active: false, neighborhood: 'Batel' });
    const search = (q: string) =>
      api.get(`/admin/customers?${q}`).then((r) => r.json<CustomersResponse>().customers);
    expect((await search('')).map((c) => c.name)).toEqual([
      'Antigo',
      'Bistrô Araucária',
      'Cantina Bella Vista',
    ]);
    expect((await search('search=bistr')).map((c) => c.name)).toEqual(['Bistrô Araucária']);
    expect((await search('search=paulo')).map((c) => c.name)).toEqual(['Bistrô Araucária']);
    expect((await search('search=99876')).map((c) => c.name)).toEqual(['Cantina Bella Vista']);
    expect((await search('search=batel')).map((c) => c.name)).toEqual(['Antigo']);
    expect((await search('status=inactive')).map((c) => c.name)).toEqual(['Antigo']);
    expect((await search('status=active')).map((c) => c.name)).toHaveLength(2);

    const edited = await api.patch(`/admin/customers/${customer.id}`, {
      active: false,
      phone: '(41) 3333-4444',
      email: 'bistro@example.com',
    });
    expect(edited.statusCode).toBe(200);
    expect(edited.json<Customer>()).toMatchObject({
      active: false,
      phone: '4133334444',
      email: 'bistro@example.com',
      name: 'Bistrô Araucária',
    });
    expect(
      (await api.patch(`/admin/customers/${customer.id}`, { phone: '41998765432' })).statusCode
    ).toBe(409);

    const one = await api.get(`/admin/customers/${customer.id}`);
    expect(one.json<Customer>().phone).toBe('4133334444');
    expect(
      (await api.get('/admin/customers/00000000-0000-4000-8000-000000000000')).statusCode
    ).toBe(404);
  });

  it('conta pedidos não cancelados e o último', async () => {
    const { customer, tomate } = await orderScenario();
    const place = () =>
      client(app).post('/orders', {
        phone: customer.phone,
        items: [{ productId: tomate.id, quantity: 30 }],
      });
    await place();
    const second = await place();
    await prisma.order.update({
      where: { token: second.json().token },
      data: { status: 'CANCELADO' },
    });
    const { cookie } = await loginAsOwner(app);
    const one = (await client(app, cookie).get(`/admin/customers/${customer.id}`)).json<Customer>();
    expect(one.orderCount).toBe(1);
    expect(one.lastOrderAt).not.toBeNull();
  });
});

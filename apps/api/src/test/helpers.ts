import type { Prisma } from '@prisma/client';
import type { FastifyInstance } from 'fastify';

import { publicLimiter } from '@/http/rate-limit';
import { SESSION_COOKIE } from '@/http/session';
import { prisma } from '@/lib/prisma';
import { ensureOwner } from '@/services/admins';

export const OWNER = {
  name: 'André',
  email: 'andre@example.com',
  phone: '(41) 99999-0000',
  password: 'senha-forte-123',
};

const DAY = 86_400_000;

/** Esvazia todas as tabelas entre os testes (mais rápido que recriar o banco). */
export async function resetDatabase() {
  publicLimiter.reset();
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await prisma.$executeRawUnsafe(
    `TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`
  );
}

/** Cria o primeiro ADM e devolve o cookie de sessão. */
export async function loginAsOwner(app: FastifyInstance) {
  const { admin } = await ensureOwner(prisma, OWNER);
  return { admin, cookie: await login(app, OWNER.email, OWNER.password) };
}

export async function login(app: FastifyInstance, loginValue: string, password: string) {
  const response = await app.inject({
    method: 'POST',
    url: '/sessions',
    payload: { login: loginValue, password },
  });
  const cookie = response.cookies.find((c) => c.name === SESSION_COOKIE);
  if (!cookie) throw new Error(`login failed: ${response.statusCode} ${response.body}`);
  return `${SESSION_COOKIE}=${cookie.value}`;
}

/** app.inject já com o cookie (ou sem, para as rotas públicas). */
export function client(app: FastifyInstance, cookie?: string) {
  const call =
    (method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE') => (url: string, payload?: unknown) =>
      app.inject({
        method,
        url,
        ...(cookie ? { headers: { cookie } } : {}),
        ...(payload !== undefined ? { payload: payload as object } : {}),
      });
  return {
    get: call('GET'),
    post: call('POST'),
    patch: call('PATCH'),
    put: call('PUT'),
    delete: call('DELETE'),
  };
}

let phoneSeq = 0;

export function createCustomer(data: Partial<Prisma.CustomerCreateInput> = {}) {
  phoneSeq += 1;
  return prisma.customer.create({
    data: {
      name: 'Cantina Bella Vista',
      contactName: 'Marcos',
      phone: `4198765${String(4000 + phoneSeq).padStart(4, '0')}`,
      address: 'Rua Itupava, 1234',
      neighborhood: 'Alto da XV',
      city: 'Curitiba',
      cnpj: '12.345.678/0001-90',
      email: 'contato@bellavista.com',
      ...data,
    },
  });
}

/** Produto já publicado (o rascunho igual ao publicado), salvo o que vier em `data`. */
export function createProduct(data: Partial<Prisma.ProductCreateInput> = {}) {
  const price = (data.publishedPriceCents as number | undefined) ?? 1000;
  return prisma.product.create({
    data: {
      name: 'Tomate',
      category: 'LEGUMES',
      unit: 'kg',
      saleDescription: 'Quilo',
      minQuantity: 10,
      imageUrl: '/products/tomate.svg',
      color: '#FBE4DE',
      draftPriceCents: price,
      draftAvailable: true,
      publishedPriceCents: price,
      publishedAvailable: true,
      ...data,
    },
  });
}

/** Semana aberta (fecha em 2 dias), ou com os campos dados. */
export function createWeek(data: Partial<Prisma.WeekCreateInput> = {}) {
  const now = Date.now();
  return prisma.week.create({
    data: {
      deliveryDate: new Date('2026-11-06T00:00:00.000Z'),
      closesAt: new Date(now + 2 * DAY),
      openedAt: new Date(now - DAY),
      ...data,
    },
  });
}

/** Cenário de pedido: semana aberta, ajustes (mínimo R$ 200), cliente e dois produtos. */
export async function orderScenario() {
  await prisma.setting.create({ data: { id: 1, minOrderCents: 20000 } });
  const week = await createWeek();
  const customer = await createCustomer();
  const tomate = await createProduct({ name: 'Tomate', publishedPriceCents: 690, minQuantity: 10 });
  const laranja = await createProduct({
    name: 'Laranja',
    category: 'FRUTAS',
    unit: 'saco',
    saleDescription: 'Saco 20 kg',
    minQuantity: 1,
    publishedPriceCents: 5200,
    imageUrl: '/products/laranja.svg',
    color: '#FDE6CF',
  });
  return { week, customer, tomate, laranja };
}

export const pastDate = (days = 1) => new Date(Date.now() - days * DAY);

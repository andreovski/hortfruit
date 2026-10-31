import {
  canCustomerChange,
  checkOrder,
  isValidPhone,
  maskAddress,
  normalizePhone,
  type OrderItemInput,
} from '@hortifruit/core';
import type {
  AdminOrderDetail,
  AdminOrderRow,
  OrderItem as OrderItemDto,
  OrderSummary,
  PublicOrder,
  UnitCode,
} from '@hortifruit/schemas';
import type { Customer, Order, OrderItem, Prisma, Product, Week } from '@prisma/client';
import { randomBytes } from 'node:crypto';

import { clock } from '@/lib/clock';
import { fromDbDate, iso, isoOrNull } from '@/lib/dates';
import { AppError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

import { catalogForOrder } from './products';
import { getSetting } from './settings';
import { openWeek, toWeekDto } from './weeks';

export const INVALID_PHONE = 'Telefone inválido.';
export const CUSTOMER_NOT_FOUND = 'Não encontramos seu cadastro. Fale com a Morro Verde.';
export const ORDER_NOT_FOUND = 'Pedido não encontrado.';
export const WEEK_CLOSED = 'Os pedidos desta semana já fecharam.';
export const CANNOT_CHANGE = 'Este pedido não pode mais ser alterado.';

/** Telefone digitado → só dígitos, ou 400. */
export function parsePhone(input: string): string {
  if (!isValidPhone(input)) throw new AppError(400, INVALID_PHONE);
  return normalizePhone(input);
}

export function newOrderToken(): string {
  return randomBytes(24).toString('base64url');
}

type ItemWithProduct = OrderItem & { product: Pick<Product, 'imageUrl' | 'color'> };

export const ORDER_INCLUDE = {
  customer: true,
  week: true,
  items: {
    include: { product: { select: { imageUrl: true, color: true } } },
    orderBy: { name: 'asc' },
  },
} satisfies Prisma.OrderInclude;

export type FullOrder = Order & { customer: Customer; week: Week; items: ItemWithProduct[] };

function toItemDto(item: ItemWithProduct): OrderItemDto {
  return {
    productId: item.productId,
    name: item.name,
    unit: item.unit as UnitCode,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    subtotalCents: item.subtotalCents,
    imageUrl: item.product.imageUrl,
    color: item.product.color,
  };
}

function maskedCustomer(customer: Customer) {
  return {
    name: customer.name,
    maskedAddress: maskAddress(customer.address),
    neighborhood: customer.neighborhood,
  };
}

export function toPublicOrder(order: FullOrder, now: Date = clock.now()): PublicOrder {
  return {
    token: order.token,
    number: order.number,
    status: order.status,
    createdAt: iso(order.createdAt),
    updatedAt: iso(order.updatedAt),
    confirmedAt: isoOrNull(order.confirmedAt),
    deliveredAt: isoOrNull(order.deliveredAt),
    canceledAt: isoOrNull(order.canceledAt),
    canceledBy: order.canceledBy,
    note: order.note,
    totalCents: order.totalCents,
    items: order.items.map(toItemDto),
    customer: maskedCustomer(order.customer),
    week: toWeekDto(order.week, now),
    canChange: canCustomerChange(order.status, order.week, now),
  };
}

export function toOrderSummary(order: FullOrder, now: Date = clock.now()): OrderSummary {
  return {
    token: order.token,
    number: order.number,
    status: order.status,
    createdAt: iso(order.createdAt),
    deliveryDate: fromDbDate(order.week.deliveryDate),
    totalCents: order.totalCents,
    itemCount: order.items.length,
    customerName: order.customer.name,
    canChange: canCustomerChange(order.status, order.week, now),
    items: order.items.slice(0, 4).map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit as UnitCode,
      imageUrl: item.product.imageUrl,
      color: item.product.color,
    })),
  };
}

type RowOrder = Order & {
  customer: Pick<Customer, 'id' | 'name' | 'neighborhood'>;
  _count: { items: number };
};

export function toAdminOrderRow(order: RowOrder): AdminOrderRow {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    createdAt: iso(order.createdAt),
    updatedAt: iso(order.updatedAt),
    editedAt: isoOrNull(order.editedAt),
    customer: {
      id: order.customer.id,
      name: order.customer.name,
      neighborhood: order.customer.neighborhood,
    },
    itemCount: order._count.items,
    totalCents: order.totalCents,
  };
}

export function toAdminOrderDetail(order: FullOrder, now: Date = clock.now()): AdminOrderDetail {
  return {
    ...toAdminOrderRow({ ...order, _count: { items: order.items.length } }),
    note: order.note,
    confirmedAt: isoOrNull(order.confirmedAt),
    deliveredAt: isoOrNull(order.deliveredAt),
    canceledAt: isoOrNull(order.canceledAt),
    canceledBy: order.canceledBy,
    customer: {
      id: order.customer.id,
      name: order.customer.name,
      neighborhood: order.customer.neighborhood,
      contactName: order.customer.contactName,
      phone: order.customer.phone,
      address: order.customer.address,
      city: order.customer.city,
      notes: order.customer.notes,
    },
    items: order.items.map(toItemDto),
    week: toWeekDto(order.week, now),
  };
}

/** Confere os itens contra o catálogo publicado de agora; problema → 422 com o código. */
async function priceItems(items: OrderItemInput[], tx: Prisma.TransactionClient) {
  const [catalog, setting] = await Promise.all([catalogForOrder(tx), getSetting(tx)]);
  const check = checkOrder(items, catalog, setting.minOrderCents);
  if (!check.ok) {
    const [first] = check.problems;
    throw new AppError(422, first.message, first.code);
  }
  const units = new Map(
    (
      await tx.product.findMany({
        where: { id: { in: check.lines.map((l) => l.productId) } },
        select: { id: true, unit: true },
      })
    ).map((p) => [p.id, p.unit])
  );
  return {
    totalCents: check.totalCents,
    items: check.lines.map((line) => ({
      productId: line.productId,
      name: line.name,
      unit: units.get(line.productId) ?? 'un',
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      subtotalCents: line.subtotalCents,
    })),
  };
}

export async function createOrder(input: {
  phone: string;
  items: OrderItemInput[];
  note?: string | null;
}) {
  const phone = parsePhone(input.phone);
  const now = clock.now();
  return prisma.$transaction(async (tx) => {
    const week = await openWeek(tx, now);
    if (!week) throw new AppError(409, WEEK_CLOSED);
    const customer = await tx.customer.findUnique({ where: { phone } });
    if (!customer || !customer.active) throw new AppError(404, CUSTOMER_NOT_FOUND);
    const priced = await priceItems(input.items, tx);
    return tx.order.create({
      data: {
        token: newOrderToken(),
        customerId: customer.id,
        weekId: week.id,
        status: 'NOVO',
        note: input.note || null,
        totalCents: priced.totalCents,
        items: { create: priced.items },
      },
      select: { token: true, number: true },
    });
  });
}

export function findOrderByToken(token: string) {
  return prisma.order.findUnique({ where: { token }, include: ORDER_INCLUDE });
}

async function changeableOrder(token: string, tx: Prisma.TransactionClient, now: Date) {
  const order = await tx.order.findUnique({ where: { token }, include: { week: true } });
  if (!order) throw new AppError(404, ORDER_NOT_FOUND);
  if (!canCustomerChange(order.status, order.week, now)) throw new AppError(409, CANNOT_CHANGE);
  return order;
}

export async function updateOrder(
  token: string,
  input: { items: OrderItemInput[]; note?: string | null }
) {
  const now = clock.now();
  return prisma.$transaction(async (tx) => {
    const order = await changeableOrder(token, tx, now);
    const priced = await priceItems(input.items, tx);
    await tx.orderItem.deleteMany({ where: { orderId: order.id } });
    return tx.order.update({
      where: { id: order.id },
      data: {
        totalCents: priced.totalCents,
        ...(input.note !== undefined ? { note: input.note || null } : {}),
        editedAt: now,
        // Editar um pedido confirmado volta ele para NOVO: o ADM confere de novo.
        ...(order.status === 'CONFIRMADO' ? { status: 'NOVO', confirmedAt: null } : {}),
        items: { create: priced.items },
      },
      select: { token: true, number: true },
    });
  });
}

export async function cancelOrderByCustomer(token: string) {
  const now = clock.now();
  await prisma.$transaction(async (tx) => {
    const order = await changeableOrder(token, tx, now);
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'CANCELADO', canceledAt: now, canceledBy: 'CUSTOMER' },
    });
  });
  const order = await findOrderByToken(token);
  return toPublicOrder(order!, now);
}

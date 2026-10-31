import { canAdminTransition } from '@hortifruit/core';
import {
  type AdminOrderDetail,
  adminOrdersQuerySchema,
  type AdminOrdersResponse,
  type NewOrdersCountResponse,
  setOrderStatusBodySchema,
} from '@hortifruit/schemas';
import type { Prisma } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { clock } from '@/lib/clock';
import { AppError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { ORDER_INCLUDE, toAdminOrderDetail, toAdminOrderRow } from '@/services/orders';
import { latestWeek, toWeekDto } from '@/services/weeks';

const idParams = z.object({ id: z.string().uuid() });

/** Semana pedida: sem weekId é a mais recente; `all` é todas (null). */
export async function resolveWeek(weekId: string | undefined) {
  if (weekId === 'all') return { all: true as const, week: null };
  if (!weekId) return { all: false as const, week: await latestWeek() };
  const week = await prisma.week.findUnique({ where: { id: weekId } });
  if (!week) throw new AppError(404, 'Semana não encontrada.');
  return { all: false as const, week };
}

function searchWhere(search: string | undefined): Prisma.OrderWhereInput | undefined {
  if (!search) return undefined;
  const or: Prisma.OrderWhereInput[] = [
    { customer: { name: { contains: search, mode: 'insensitive' } } },
  ];
  const number = search.replace(/^#/, '').trim();
  if (/^\d{1,9}$/.test(number)) or.push({ number: Number(number) });
  return { OR: or };
}

export async function adminOrdersRoutes(app: FastifyInstance) {
  app.get('/orders', async (request): Promise<AdminOrdersResponse> => {
    const query = adminOrdersQuerySchema.parse(request.query);
    const now = clock.now();
    const scope = await resolveWeek(query.weekId);
    if (!scope.all && !scope.week) {
      return {
        week: null,
        indicators: {
          awaitingConfirmation: 0,
          weekOrders: 0,
          weekTotalCents: 0,
          activeCustomersWithoutOrder: await prisma.customer.count({ where: { active: true } }),
        },
        orders: [],
      };
    }
    const weekWhere: Prisma.OrderWhereInput = scope.week ? { weekId: scope.week.id } : {};
    const notCanceled: Prisma.OrderWhereInput = { ...weekWhere, status: { not: 'CANCELADO' } };

    const [orders, awaiting, totals, withoutOrder] = await Promise.all([
      prisma.order.findMany({
        where: {
          ...weekWhere,
          ...(query.status ? { status: query.status } : {}),
          ...searchWhere(query.search),
        },
        include: {
          customer: { select: { id: true, name: true, neighborhood: true } },
          _count: { select: { items: true } },
        },
        orderBy: [{ createdAt: 'desc' }, { number: 'desc' }],
      }),
      prisma.order.count({ where: { ...weekWhere, status: 'NOVO' } }),
      prisma.order.aggregate({ where: notCanceled, _count: true, _sum: { totalCents: true } }),
      prisma.customer.count({ where: { active: true, orders: { none: notCanceled } } }),
    ]);

    return {
      week: scope.week ? toWeekDto(scope.week, now) : null,
      indicators: {
        awaitingConfirmation: awaiting,
        weekOrders: totals._count,
        weekTotalCents: totals._sum.totalCents ?? 0,
        activeCustomersWithoutOrder: withoutOrder,
      },
      orders: orders.map(toAdminOrderRow),
    };
  });

  app.get('/orders/new-count', async (): Promise<NewOrdersCountResponse> => {
    const week = await latestWeek();
    if (!week) return { count: 0 };
    return { count: await prisma.order.count({ where: { weekId: week.id, status: 'NOVO' } }) };
  });

  app.get('/orders/:id', async (request): Promise<AdminOrderDetail> => {
    const { id } = idParams.parse(request.params);
    const order = await prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!order) throw new AppError(404, 'Pedido não encontrado.');
    return toAdminOrderDetail(order);
  });

  app.post('/orders/:id/status', async (request): Promise<AdminOrderDetail> => {
    const { id } = idParams.parse(request.params);
    const { status } = setOrderStatusBodySchema.parse(request.body);
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new AppError(404, 'Pedido não encontrado.');
    if (!canAdminTransition(order.status, status)) {
      throw new AppError(409, 'Mudança de status não permitida.');
    }
    const now = clock.now();
    const data: Prisma.OrderUpdateInput = { status };
    if (status === 'NOVO') data.confirmedAt = null;
    if (status === 'CONFIRMADO') {
      // Voltar de ENTREGUE desfaz a entrega e mantém a confirmação original.
      if (order.status === 'ENTREGUE') data.deliveredAt = null;
      else data.confirmedAt = now;
    }
    if (status === 'ENTREGUE') data.deliveredAt = now;
    if (status === 'CANCELADO') {
      data.canceledAt = now;
      data.canceledBy = 'ADMIN';
    }
    const updated = await prisma.order.update({ where: { id }, data, include: ORDER_INCLUDE });
    return toAdminOrderDetail(updated, now);
  });
}

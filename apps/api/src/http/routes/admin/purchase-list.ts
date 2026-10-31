import { todayInBrasilia, unitShort } from '@hortifruit/core';
import type { PurchaseListResponse, UnitCode } from '@hortifruit/schemas';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { clock } from '@/lib/clock';
import { prisma } from '@/lib/prisma';
import { toWeekDto } from '@/services/weeks';

import { resolveWeek } from './orders';

const querySchema = z.object({ weekId: z.string().uuid().optional() });

/** Soma da semana por produto (pedidos não cancelados), em ordem de nome. */
async function purchaseList(weekId: string | undefined): Promise<PurchaseListResponse> {
  const now = clock.now();
  const { week } = await resolveWeek(weekId);
  if (!week) return { week: null, rows: [], totalCents: 0 };

  const items = await prisma.orderItem.findMany({
    where: { order: { weekId: week.id, status: { not: 'CANCELADO' } } },
    select: {
      orderId: true,
      quantity: true,
      subtotalCents: true,
      product: { select: { id: true, name: true, unit: true, saleDescription: true } },
    },
  });

  const rows = new Map<string, PurchaseListResponse['rows'][number] & { orders: Set<string> }>();
  for (const item of items) {
    let row = rows.get(item.product.id);
    if (!row) {
      row = {
        productId: item.product.id,
        name: item.product.name,
        unit: item.product.unit as UnitCode,
        saleDescription: item.product.saleDescription,
        quantity: 0,
        orderCount: 0,
        totalCents: 0,
        orders: new Set(),
      };
      rows.set(item.product.id, row);
    }
    row.quantity += item.quantity;
    row.totalCents += item.subtotalCents;
    row.orders.add(item.orderId);
  }

  const list = [...rows.values()]
    .map(({ orders, ...row }) => ({ ...row, orderCount: orders.size }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return {
    week: toWeekDto(week, now),
    rows: list,
    totalCents: list.reduce((sum, row) => sum + row.totalCents, 0),
  };
}

const csvField = (value: string | number) => {
  const text = String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Centavos → "1234,50" (sem separador de milhar, para a planilha ler como número). */
const csvMoney = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');

export async function adminPurchaseListRoutes(app: FastifyInstance) {
  app.get('/purchase-list', async (request) => {
    const { weekId } = querySchema.parse(request.query);
    return purchaseList(weekId);
  });

  app.get('/purchase-list.csv', async (request, reply) => {
    const { weekId } = querySchema.parse(request.query);
    const list = await purchaseList(weekId);
    const lines = [
      ['Produto', 'Forma de venda', 'Quantidade', 'Unidade', 'Pedidos', 'Total estimado (R$)'],
      ...list.rows.map((row) => [
        row.name,
        row.saleDescription,
        row.quantity,
        unitShort(row.unit),
        row.orderCount,
        csvMoney(row.totalCents),
      ]),
    ];
    const csv = `\uFEFF${lines.map((line) => line.map(csvField).join(';')).join('\r\n')}\r\n`;
    const date = list.week ? list.week.deliveryDate : todayInBrasilia(clock.now());
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="lista-de-compra-${date}.csv"`)
      .send(csv);
  });
}

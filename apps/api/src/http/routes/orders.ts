import { maskAddress } from '@hortifruit/core';
import {
  createOrderBodySchema,
  identifyBodySchema,
  type IdentifyResponse,
  lookupOrdersBodySchema,
  type LookupOrdersResponse,
  type OrderCreatedResponse,
  type PublicOrder,
  updateOrderBodySchema,
} from '@hortifruit/schemas';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { clock } from '@/lib/clock';
import { AppError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import {
  cancelOrderByCustomer,
  createOrder,
  findOrderByToken,
  ORDER_INCLUDE,
  ORDER_NOT_FOUND,
  parsePhone,
  toOrderSummary,
  toPublicOrder,
  updateOrder,
} from '@/services/orders';

import { limitPublic } from '../rate-limit';

const tokenParams = z.object({ token: z.string().max(200) });

// Rotas do restaurante (sem login): identificação pelo telefone e o pedido pelo link secreto.
// Nada de endereço inteiro, CNPJ ou e-mail aqui.
export async function orderRoutes(app: FastifyInstance) {
  app.post('/checkout/identify', { preHandler: limitPublic }, async (request) => {
    const { phone } = identifyBodySchema.parse(request.body);
    const digits = parsePhone(phone);
    const customer = await prisma.customer.findUnique({ where: { phone: digits } });
    const body: IdentifyResponse =
      customer && customer.active
        ? {
            found: true,
            customer: {
              name: customer.name,
              maskedAddress: maskAddress(customer.address),
              neighborhood: customer.neighborhood,
            },
          }
        : { found: false };
    return body;
  });

  app.post('/orders', { preHandler: limitPublic }, async (request, reply) => {
    const body = createOrderBodySchema.parse(request.body);
    const created: OrderCreatedResponse = await createOrder(body);
    return reply.status(201).send(created);
  });

  // Antes de /orders/:token para "lookup" não ser lido como token.
  app.post('/orders/lookup', async (request): Promise<LookupOrdersResponse> => {
    const { tokens } = lookupOrdersBodySchema.parse(request.body);
    if (tokens.length === 0) return { orders: [] };
    const orders = await prisma.order.findMany({
      where: { token: { in: tokens } },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    const now = clock.now();
    return { orders: orders.map((order) => toOrderSummary(order, now)) };
  });

  app.get('/orders/:token', async (request): Promise<PublicOrder> => {
    const { token } = tokenParams.parse(request.params);
    const order = await findOrderByToken(token);
    if (!order) throw new AppError(404, ORDER_NOT_FOUND);
    return toPublicOrder(order);
  });

  app.put('/orders/:token', async (request): Promise<OrderCreatedResponse> => {
    const { token } = tokenParams.parse(request.params);
    const body = updateOrderBodySchema.parse(request.body);
    return updateOrder(token, body);
  });

  app.post('/orders/:token/cancel', async (request): Promise<PublicOrder> => {
    const { token } = tokenParams.parse(request.params);
    return cancelOrderByCustomer(token);
  });
}

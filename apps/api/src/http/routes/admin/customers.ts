import { normalizePhone } from '@hortifruit/core';
import {
  type Customer as CustomerDto,
  customerBodySchema,
  customersQuerySchema,
  type CustomersResponse,
} from '@hortifruit/schemas';
import { type Customer, Prisma } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { iso, isoOrNull } from '@/lib/dates';
import { AppError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { parsePhone } from '@/services/orders';

const idParams = z.object({ id: z.string().uuid() });
const NOT_FOUND = 'Cliente não encontrado.';

/** Pedidos não cancelados e o último, por cliente. */
async function orderStats(customerIds: string[]) {
  if (customerIds.length === 0) return new Map<string, { count: number; last: Date | null }>();
  const groups = await prisma.order.groupBy({
    by: ['customerId'],
    where: { customerId: { in: customerIds }, status: { not: 'CANCELADO' } },
    _count: { _all: true },
    _max: { createdAt: true },
  });
  return new Map(
    groups.map((g) => [g.customerId, { count: g._count._all, last: g._max.createdAt }])
  );
}

function toCustomerDto(c: Customer, stats?: { count: number; last: Date | null }): CustomerDto {
  return {
    id: c.id,
    name: c.name,
    contactName: c.contactName,
    phone: c.phone,
    cnpj: c.cnpj,
    email: c.email,
    address: c.address,
    neighborhood: c.neighborhood,
    city: c.city,
    notes: c.notes,
    active: c.active,
    createdAt: iso(c.createdAt),
    orderCount: stats?.count ?? 0,
    lastOrderAt: isoOrNull(stats?.last ?? null),
  };
}

async function customerDto(c: Customer) {
  return toCustomerDto(c, (await orderStats([c.id])).get(c.id));
}

function duplicatePhone(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new AppError(409, 'Já existe um cliente com este telefone.');
  }
  throw error;
}

export async function adminCustomersRoutes(app: FastifyInstance) {
  app.get('/customers', async (request): Promise<CustomersResponse> => {
    const { search, status } = customersQuerySchema.parse(request.query);
    const where: Prisma.CustomerWhereInput = {};
    if (status === 'active') where.active = true;
    if (status === 'inactive') where.active = false;
    if (search) {
      const text = { contains: search, mode: 'insensitive' as const };
      const or: Prisma.CustomerWhereInput[] = [
        { name: text },
        { contactName: text },
        { neighborhood: text },
      ];
      const digits = normalizePhone(search);
      if (digits.length >= 2) or.push({ phone: { contains: digits } });
      where.OR = or;
    }
    const customers = await prisma.customer.findMany({ where, orderBy: { name: 'asc' } });
    const stats = await orderStats(customers.map((c) => c.id));
    return { customers: customers.map((c) => toCustomerDto(c, stats.get(c.id))) };
  });

  app.post('/customers', async (request, reply) => {
    const body = customerBodySchema.parse(request.body);
    const created = await prisma.customer
      .create({ data: { ...body, phone: parsePhone(body.phone) } })
      .catch(duplicatePhone);
    return reply.status(201).send(toCustomerDto(created));
  });

  app.get('/customers/:id', async (request): Promise<CustomerDto> => {
    const { id } = idParams.parse(request.params);
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new AppError(404, NOT_FOUND);
    return customerDto(customer);
  });

  app.patch('/customers/:id', async (request): Promise<CustomerDto> => {
    const { id } = idParams.parse(request.params);
    const body = customerBodySchema.partial().parse(request.body);
    const exists = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new AppError(404, NOT_FOUND);
    const data: Prisma.CustomerUpdateInput = { ...body, phone: undefined };
    if (body.phone !== undefined) data.phone = parsePhone(body.phone);
    const updated = await prisma.customer.update({ where: { id }, data }).catch(duplicatePhone);
    return customerDto(updated);
  });
}

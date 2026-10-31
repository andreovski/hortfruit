import type { FastifyReply, FastifyRequest } from 'fastify';

import { prisma } from '@/lib/prisma';

// Healthcheck do Railway: 200 só com o banco respondendo, para um deploy sem banco não entrar no ar.
export async function health(_request: FastifyRequest, reply: FastifyReply) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return reply.status(200).send({ status: 'ok', database: 'ok' });
  } catch (_error) {
    return reply.status(503).send({ status: 'degraded', database: 'unavailable' });
  }
}

import type { FastifyReply, FastifyRequest } from 'fastify';

import { rateLimitEnabled } from '@/lib/env';
import { RateLimiter, TOO_MANY_ATTEMPTS } from '@/lib/rate-limit';

/** 30 chamadas por IP a cada 10 min, somando identificação e envio de pedido. */
export const publicLimiter = new RateLimiter(30, 10 * 60_000);

/** preHandler das rotas públicas que buscam pelo telefone ou gravam pedido. */
export async function limitPublic(request: FastifyRequest, reply: FastifyReply) {
  if (!rateLimitEnabled()) return;
  if (!publicLimiter.hit(request.ip)) {
    return reply.status(429).send({ message: TOO_MANY_ATTEMPTS });
  }
}

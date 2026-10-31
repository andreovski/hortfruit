import { normalizePhone } from '@hortifruit/core';
import { loginBodySchema, type MeResponse } from '@hortifruit/schemas';
import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';

import { AppError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { toAdminUser } from '@/services/admins';

import { activeSessionAdminId, endSession, startSession } from '../session';

// Hash fixo para comparar quando o login não existe: a resposta leva o mesmo tempo.
const DUMMY_HASH = '$2a$10$e2YTR9U7hSn8mkAQVgaAFu.xc80Zh97vvvHojGI6M1p0zc0qEco62';
const WRONG_LOGIN = 'E-mail, telefone ou senha incorretos.';

export async function authRoutes(app: FastifyInstance) {
  app.post('/sessions', async (request, reply) => {
    const { login, password } = loginBodySchema.parse(request.body);
    // Com "@" é e-mail; sem, é telefone (só dígitos).
    const where = login.includes('@')
      ? { email: login.toLowerCase() }
      : { phone: normalizePhone(login) };
    const admin =
      'phone' in where && !where.phone ? null : await prisma.admin.findUnique({ where });
    const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
    if (!admin || !ok || !admin.active) throw new AppError(401, WRONG_LOGIN);
    await startSession(reply, admin.id);
    const body: MeResponse = { admin: toAdminUser(admin) };
    return body;
  });

  app.delete('/sessions', async (_request, reply) => {
    endSession(reply);
    return reply.status(204).send();
  });

  app.get('/me', async (request, reply) => {
    const adminId = await activeSessionAdminId(request);
    const admin = adminId ? await prisma.admin.findUnique({ where: { id: adminId } }) : null;
    if (!admin) return reply.status(401).send({ message: 'Entre no painel para continuar.' });
    const body: MeResponse = { admin: toAdminUser(admin) };
    return body;
  });
}

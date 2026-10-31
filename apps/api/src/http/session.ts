import type { FastifyReply, FastifyRequest } from 'fastify';

import { isSecureCookie } from '@/lib/env';
import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE = 'hortifruit_session';
const SESSION_DAYS = 30;

export async function startSession(reply: FastifyReply, adminId: string) {
  const token = await reply.jwtSign({ sub: adminId }, { expiresIn: `${SESSION_DAYS}d` });
  reply.setCookie(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookie(),
    maxAge: SESSION_DAYS * 86_400,
  });
}

export function endSession(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE, { path: '/' });
}

/** Id do ADM da sessão (só o JWT, sem olhar o banco), ou null. */
export async function sessionAdminId(request: FastifyRequest): Promise<string | null> {
  const token = request.cookies[SESSION_COOKIE];
  if (!token) return null;
  try {
    const payload = request.server.jwt.verify<{ sub?: unknown }>(token);
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Id do ADM da sessão, só se ele existir e estiver ativo. */
export async function activeSessionAdminId(request: FastifyRequest): Promise<string | null> {
  const adminId = await sessionAdminId(request);
  if (!adminId) return null;
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { active: true },
  });
  return admin?.active ? adminId : null;
}

/** preHandler das rotas do painel: ADM ativo ou 401. */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const adminId = await activeSessionAdminId(request);
  if (!adminId) {
    return reply.status(401).send({ message: 'Entre no painel para continuar.' });
  }
  request.adminId = adminId;
}

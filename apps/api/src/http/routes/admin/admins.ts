import {
  adminBodySchema,
  type AdminsResponse,
  type AdminUser,
  updateAdminBodySchema,
} from '@hortifruit/schemas';
import type { Prisma } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { AppError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { adminPhone, adminUniqueError, hashPassword, toAdminUser } from '@/services/admins';

const idParams = z.object({ id: z.string().uuid() });

export async function adminAdminsRoutes(app: FastifyInstance) {
  app.get('/admins', async (): Promise<AdminsResponse> => {
    const admins = await prisma.admin.findMany({
      orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
    });
    return { admins: admins.map(toAdminUser) };
  });

  app.post('/admins', async (request, reply) => {
    const body = adminBodySchema.parse(request.body);
    const created = await prisma.admin
      .create({
        data: {
          name: body.name,
          email: body.email ?? null,
          phone: adminPhone(body.phone) ?? null,
          passwordHash: await hashPassword(body.password),
        },
      })
      .catch(adminUniqueError);
    const dto: AdminUser = toAdminUser(created);
    return reply.status(201).send(dto);
  });

  app.patch('/admins/:id', async (request): Promise<AdminUser> => {
    const { id } = idParams.parse(request.params);
    const body = updateAdminBodySchema.parse(request.body);
    const admin = await prisma.admin.findUnique({ where: { id } });
    if (!admin) throw new AppError(404, 'ADM não encontrado.');

    const data: Prisma.AdminUpdateInput = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.email !== undefined) data.email = body.email ? body.email.toLowerCase() : null;
    if (body.phone !== undefined) data.phone = adminPhone(body.phone);
    if (body.password !== undefined) data.passwordHash = await hashPassword(body.password);

    const email = data.email !== undefined ? data.email : admin.email;
    const phone = data.phone !== undefined ? data.phone : admin.phone;
    if (!email && !phone) throw new AppError(400, 'Informe e-mail ou telefone.');

    if (body.active === false && admin.active) {
      if (id === request.adminId) throw new AppError(409, 'Você não pode desativar a si mesmo.');
      const others = await prisma.admin.count({ where: { active: true, id: { not: id } } });
      if (others === 0) throw new AppError(409, 'É preciso ter pelo menos um ADM ativo.');
    }
    if (body.active !== undefined) data.active = body.active;

    const updated = await prisma.admin.update({ where: { id }, data }).catch(adminUniqueError);
    return toAdminUser(updated);
  });
}

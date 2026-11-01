import { type Settings, updateSettingsBodySchema } from '@hortifruit/schemas';
import type { FastifyInstance } from 'fastify';

import { prisma } from '@/lib/prisma';
import { getSettingsDto } from '@/services/settings';

export async function adminSettingsRoutes(app: FastifyInstance) {
  app.get('/settings', (): Promise<Settings> => getSettingsDto());

  app.patch('/settings', async (request): Promise<Settings> => {
    const body = updateSettingsBodySchema.parse(request.body);
    await prisma.setting.upsert({
      where: { id: 1 },
      create: { id: 1, ...body },
      update: body,
    });
    return getSettingsDto();
  });
}

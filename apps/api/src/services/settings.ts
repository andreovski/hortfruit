import type { Settings } from '@hortifruit/schemas';
import type { Prisma, PrismaClient } from '@prisma/client';

import { getUploadthingToken, getWhatsappNumber } from '@/lib/env';
import { prisma } from '@/lib/prisma';

type Db = PrismaClient | Prisma.TransactionClient;

/** A linha única de ajustes (id 1), criada com os padrões se ainda não existir. */
export function getSetting(db: Db = prisma) {
  return db.setting.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
}

export async function getSettingsDto(db: Db = prisma): Promise<Settings> {
  const setting = await getSetting(db);
  return {
    minOrderCents: setting.minOrderCents,
    uploadsEnabled: !!getUploadthingToken(),
    whatsapp: getWhatsappNumber(),
  };
}

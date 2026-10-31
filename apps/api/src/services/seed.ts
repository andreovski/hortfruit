import type { PrismaClient } from '@prisma/client';

import { getOwner } from '@/lib/env';

import { ensureOwner } from './admins';
import { ensureInitialProducts } from './initial-products';
import { getSetting } from './settings';

/** Seed de produção: primeiro ADM, ajustes e os produtos iniciais. Idempotente. */
export async function seedBase(prisma: PrismaClient) {
  const owner = getOwner();
  if (!owner) {
    const hasAdmin = (await prisma.admin.count()) > 0;
    if (!hasAdmin) {
      console.warn(
        '[seed] OWNER_EMAIL/OWNER_PHONE e OWNER_PASSWORD não definidos: nenhum ADM criado.'
      );
    }
  } else {
    const { admin, created } = await ensureOwner(prisma, owner);
    console.log(
      `[seed] ${created ? 'ADM criado' : 'ADM já existia'}: ${admin.email ?? admin.phone}`
    );
  }
  await getSetting(prisma);
  const products = await ensureInitialProducts(prisma);
  if (products) console.log(`[seed] ${products} produtos iniciais criados (rascunho).`);
}

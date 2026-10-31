import type { CatalogResponse } from '@hortifruit/schemas';
import type { FastifyInstance } from 'fastify';

import { clock } from '@/lib/clock';
import { isoOrNull } from '@/lib/dates';
import { getWhatsappNumber } from '@/lib/env';
import { publishedProducts, toCatalogProduct } from '@/services/products';
import { getSetting } from '@/services/settings';
import { latestWeek, toWeekDto } from '@/services/weeks';

export async function catalogRoutes(app: FastifyInstance) {
  app.get('/catalog', async (): Promise<CatalogResponse> => {
    const now = clock.now();
    const [week, setting, products] = await Promise.all([
      latestWeek(),
      getSetting(),
      publishedProducts(),
    ]);
    return {
      week: week ? toWeekDto(week, now) : null,
      publishedAt: isoOrNull(setting.publishedAt),
      minOrderCents: setting.minOrderCents,
      whatsapp: getWhatsappNumber(),
      products: products.map(toCatalogProduct),
    };
  });
}

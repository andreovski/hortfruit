import type { FastifyInstance } from 'fastify';

import { requireAdmin } from '../../session';
import { adminAdminsRoutes } from './admins';
import { adminCustomersRoutes } from './customers';
import { adminOrdersRoutes } from './orders';
import { adminProductsRoutes } from './products';
import { adminPurchaseListRoutes } from './purchase-list';
import { adminSettingsRoutes } from './settings';
import { adminWeeksRoutes } from './weeks';

/** Painel ADM (`/admin/*`): tudo exige um ADM ativo. */
export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAdmin);

  app.register(adminOrdersRoutes);
  app.register(adminPurchaseListRoutes);
  app.register(adminCustomersRoutes);
  app.register(adminProductsRoutes);
  app.register(adminWeeksRoutes);
  app.register(adminSettingsRoutes);
  app.register(adminAdminsRoutes);
}

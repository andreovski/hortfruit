import type { FastifyInstance } from 'fastify';

import { health } from './controllers/health';
import { adminRoutes } from './routes/admin';
import { authRoutes } from './routes/auth';
import { catalogRoutes } from './routes/catalog';
import { orderRoutes } from './routes/orders';
import { uploadRoutes } from './routes/uploads';

// As rotas não têm prefixo /api: o web repassa /api/* para cá tirando o prefixo
// (apps/web/server.mjs em produção, proxy do Vite em dev).
export async function appRoutes(app: FastifyInstance) {
  app.get('/health', health);

  app.register(catalogRoutes);
  app.register(orderRoutes);
  app.register(authRoutes);
  app.register(adminRoutes, { prefix: '/admin' });
  app.register(uploadRoutes);
}

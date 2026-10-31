import type { FastifyInstance } from 'fastify';
import { createRouteHandler, createUploadthing, type FileRouter } from 'uploadthing/fastify';
import { UploadThingError } from 'uploadthing/server';

import { getAppUrl, getUploadthingToken } from '@/lib/env';

import { activeSessionAdminId } from '../session';

/** Onde o web chega (ele repassa /api/uploadthing tirando o /api). */
export const UPLOADTHING_PATH = '/uploadthing';
/** Rota fixa que o adaptador do UploadThing para Fastify registra; o `rewriteUrl` do app leva
 * UPLOADTHING_PATH para cá. */
export const UPLOADTHING_ADAPTER_PATH = '/api/uploadthing';

const f = createUploadthing();

/** Foto do produto, só para ADM logado. Devolve a URL pública do arquivo. */
export const uploadRouter = {
  productImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const adminId = await activeSessionAdminId(req);
      if (!adminId) throw new UploadThingError({ code: 'FORBIDDEN', message: 'Unauthorized' });
      return { adminId };
    })
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

/** Sem UPLOADTHING_TOKEN a rota não existe e o painel esconde o envio de foto. */
export async function uploadRoutes(app: FastifyInstance) {
  const token = getUploadthingToken();
  if (!token) return;
  app.register(createRouteHandler, {
    router: uploadRouter,
    config: { token, callbackUrl: `${getAppUrl()}/api/uploadthing` },
  });
}

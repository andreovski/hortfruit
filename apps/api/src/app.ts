import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import fastify from 'fastify';
import { ZodError } from 'zod';

import { appRoutes } from './http/routes';
import { UPLOADTHING_ADAPTER_PATH, UPLOADTHING_PATH } from './http/routes/uploads';
import { getAllowedOrigins, getJwtSecret } from './lib/env';
import { AppError } from './lib/errors';

/**
 * O adaptador do UploadThing para Fastify registra a rota fixa em /api/uploadthing, mas o web
 * repassa /api/* para cá sem o prefixo: /uploadthing é levado para a rota do adaptador.
 */
function rewriteUrl(url: string): string {
  return url === UPLOADTHING_PATH || url.startsWith(`${UPLOADTHING_PATH}?`)
    ? `${UPLOADTHING_ADAPTER_PATH}${url.slice(UPLOADTHING_PATH.length)}`
    : url;
}

/** Monta a API. `app` (abaixo) é a instância do servidor e dos testes. */
export function buildApp() {
  const app = fastify({
    // Atrás do proxy do Railway, request.ip e o protocolo são os do proxy sem isto.
    trustProxy: process.env.TRUST_PROXY === 'true',
    rewriteUrl: (req) => rewriteUrl(req.url ?? '/'),
  });

  app.register(cookie);

  app.register(cors, {
    origin: getAllowedOrigins(),
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });

  app.register(jwt, { secret: getJwtSecret() });

  app.decorateRequest('adminId', '');

  app.register(appRoutes);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      const first = error.issues[0];
      return reply
        .status(400)
        .send({ message: first?.message ?? 'Dados inválidos.', issues: error.format() });
    }

    if (error instanceof AppError) {
      return reply
        .status(error.statusCode)
        .send(
          error.code ? { message: error.message, code: error.code } : { message: error.message }
        );
    }

    // Erros do próprio Fastify causados pela requisição (JSON malformado, corpo grande demais).
    if (error.statusCode !== undefined && error.statusCode < 500) {
      return reply.status(error.statusCode).send({ message: 'Requisição inválida.' });
    }

    console.error(
      `[api] ${request.method} ${request.routeOptions.url ?? 'unmatched route'}`,
      error
    );
    return reply.status(500).send({ message: 'Erro interno. Tente de novo.' });
  });

  return app;
}

export const app = buildApp();

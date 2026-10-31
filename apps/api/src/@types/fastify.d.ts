import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    /** Preenchido pelo preHandler `requireAdmin`. */
    adminId: string;
  }
}

import {
  type AdminProduct,
  type AdminProductsResponse,
  discardUploadBodySchema,
  productBodySchema,
  productDraftBodySchema,
  publishBodySchema,
} from '@hortifruit/schemas';
import type { Prisma } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { AppError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { adminProductsResponse, publishProducts, toAdminProduct } from '@/services/products';
import { deleteUnusedUpload } from '@/services/uploads';

const idParams = z.object({ id: z.string().uuid() });

/** Cadastro (parcial) + edição rápida do rascunho na tabela. */
const patchProductSchema = productBodySchema.partial().merge(productDraftBodySchema);

export async function adminProductsRoutes(app: FastifyInstance) {
  app.get('/products', (): Promise<AdminProductsResponse> => adminProductsResponse());

  app.post('/products', async (request, reply) => {
    const { priceCents, ...body } = productBodySchema.parse(request.body);
    const last = await prisma.product.aggregate({ _max: { sortOrder: true } });
    const created = await prisma.product.create({
      data: {
        ...body,
        description: body.description ?? null,
        archived: body.archived ?? false,
        sortOrder: (last._max.sortOrder ?? 0) + 1,
        draftPriceCents: priceCents,
        draftAvailable: true,
      },
    });
    const dto: AdminProduct = toAdminProduct(created);
    return reply.status(201).send(dto);
  });

  app.patch('/products/:id', async (request): Promise<AdminProduct> => {
    const { id } = idParams.parse(request.params);
    const { priceCents, available, badge, ...body } = patchProductSchema.parse(request.body);
    const data: Prisma.ProductUpdateInput = { ...body };
    if (priceCents !== undefined) data.draftPriceCents = priceCents;
    if (available !== undefined) data.draftAvailable = available;
    if (badge !== undefined) data.draftBadge = badge;
    const before = await prisma.product.findUnique({ where: { id }, select: { imageUrl: true } });
    if (!before) throw new AppError(404, 'Produto não encontrado.');
    const updated = await prisma.product.update({ where: { id }, data });
    // Foto trocada: a anterior não fica órfã no UploadThing.
    if (updated.imageUrl !== before.imageUrl) await deleteUnusedUpload(before.imageUrl, request.log);
    return toAdminProduct(updated);
  });

  app.post('/products/publish', async (request): Promise<AdminProductsResponse> => {
    const body = publishBodySchema.parse(request.body ?? {});
    return publishProducts(body);
  });

  /** Foto enviada no formulário e trocada ou abandonada antes de salvar. */
  app.post('/uploads/discard', async (request, reply) => {
    const { url } = discardUploadBodySchema.parse(request.body);
    await deleteUnusedUpload(url, request.log);
    return reply.status(204).send();
  });
}

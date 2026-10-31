import type { CatalogProductForOrder } from '@hortifruit/core';
import type {
  AdminProduct,
  AdminProductsResponse,
  CatalogProduct,
  PublishBody,
  UnitCode,
} from '@hortifruit/schemas';
import type { Prisma, PrismaClient, Product } from '@prisma/client';

import { clock } from '@/lib/clock';
import { isoOrNull, toDbDate } from '@/lib/dates';
import { AppError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

import { getSetting } from './settings';
import { openWeek } from './weeks';

type Db = PrismaClient | Prisma.TransactionClient;

export const PRODUCT_ORDER: Prisma.ProductOrderByWithRelationInput[] = [
  { sortOrder: 'asc' },
  { name: 'asc' },
];

/** Produtos que o app mostra: publicados e não arquivados. */
const PUBLISHED_WHERE: Prisma.ProductWhereInput = {
  archived: false,
  publishedPriceCents: { not: null },
};

export function isChanged(p: Product): boolean {
  if (p.archived) return false;
  if (p.publishedPriceCents === null) return true;
  return (
    p.draftPriceCents !== p.publishedPriceCents ||
    p.draftAvailable !== p.publishedAvailable ||
    p.draftBadge !== p.publishedBadge
  );
}

export function toAdminProduct(p: Product): AdminProduct {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    unit: p.unit as UnitCode,
    saleDescription: p.saleDescription,
    minQuantity: p.minQuantity,
    imageUrl: p.imageUrl,
    color: p.color,
    description: p.description,
    sortOrder: p.sortOrder,
    archived: p.archived,
    draft: { priceCents: p.draftPriceCents, available: p.draftAvailable, badge: p.draftBadge },
    published:
      p.publishedPriceCents === null
        ? null
        : {
            priceCents: p.publishedPriceCents,
            available: p.publishedAvailable,
            badge: p.publishedBadge,
          },
    previousPriceCents: p.previousPriceCents,
    changed: isChanged(p),
  };
}

export async function adminProductsResponse(db: Db = prisma): Promise<AdminProductsResponse> {
  const [products, setting] = await Promise.all([
    db.product.findMany({ orderBy: PRODUCT_ORDER }),
    getSetting(db),
  ]);
  const dtos = products.map(toAdminProduct);
  return {
    products: dtos,
    publishedAt: isoOrNull(setting.publishedAt),
    changedCount: dtos.filter((p) => p.changed).length,
  };
}

export function toCatalogProduct(p: Product): CatalogProduct {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    saleDescription: p.saleDescription,
    unit: p.unit as UnitCode,
    minQuantity: p.minQuantity,
    priceCents: p.publishedPriceCents ?? 0,
    available: p.publishedAvailable,
    badge: p.publishedBadge,
    imageUrl: p.imageUrl,
    color: p.color,
    description: p.description,
  };
}

export function publishedProducts(db: Db = prisma) {
  return db.product.findMany({ where: PUBLISHED_WHERE, orderBy: PRODUCT_ORDER });
}

/** Catálogo publicado no formato que o `checkOrder` confere. */
export async function catalogForOrder(db: Db = prisma): Promise<CatalogProductForOrder[]> {
  const products = await publishedProducts(db);
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    priceCents: p.publishedPriceCents ?? 0,
    minQuantity: p.minQuantity,
    available: p.publishedAvailable,
  }));
}

/**
 * Publica a lista da semana: o rascunho vira o que o app mostra. Com `openWeek`, fecha a semana
 * aberta (se houver) e abre a nova; sem ela, precisa já haver uma semana aberta.
 */
export async function publishProducts(body: PublishBody, now: Date = clock.now()) {
  if (body.openWeek && new Date(body.openWeek.closesAt).getTime() <= now.getTime()) {
    throw new AppError(400, 'O fechamento dos pedidos precisa ser no futuro.');
  }

  await prisma.$transaction(async (tx) => {
    const current = await openWeek(tx, now);
    if (!current && !body.openWeek) {
      throw new AppError(409, 'Abra a semana de entrega para publicar.');
    }

    const products = await tx.product.findMany({ orderBy: PRODUCT_ORDER });
    const invalid = products.find((p) => !p.archived && !(p.draftPriceCents > 0));
    if (invalid) throw new AppError(422, `Preço inválido em ${invalid.name}.`, 'INVALID_PRICE');

    if (body.openWeek) {
      if (current) await tx.week.update({ where: { id: current.id }, data: { closedAt: now } });
      await tx.week.create({
        data: {
          deliveryDate: toDbDate(body.openWeek.deliveryDate),
          closesAt: new Date(body.openWeek.closesAt),
          openedAt: now,
        },
      });
    }

    for (const p of products) {
      if (p.archived) {
        if (p.publishedAvailable) {
          await tx.product.update({ where: { id: p.id }, data: { publishedAvailable: false } });
        }
        continue;
      }
      const priceChanged =
        p.publishedPriceCents !== null && p.publishedPriceCents !== p.draftPriceCents;
      await tx.product.update({
        where: { id: p.id },
        data: {
          publishedPriceCents: p.draftPriceCents,
          publishedAvailable: p.draftAvailable,
          publishedBadge: p.draftBadge,
          ...(priceChanged ? { previousPriceCents: p.publishedPriceCents } : {}),
        },
      });
    }

    await tx.setting.upsert({
      where: { id: 1 },
      create: { id: 1, publishedAt: now },
      update: { publishedAt: now },
    });
  });

  return adminProductsResponse();
}

import { z } from 'zod';

import { badgeSchema, categorySchema, positiveCentsSchema, unitSchema } from './common';
import type { Badge, Category, UnitCode } from './common';

/** Cadastro do produto (nome, forma de venda, mínimo, imagem). Não mexe em preço publicado. */
export const productBodySchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(80),
  category: categorySchema,
  unit: unitSchema,
  saleDescription: z.string().trim().min(1, 'Informe a forma de venda.').max(80),
  minQuantity: z.number().int().positive('O mínimo precisa ser maior que zero.'),
  imageUrl: z.string().trim().min(1).max(500),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida.'),
  description: z
    .string()
    .trim()
    .max(500)
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  /** Preço do rascunho (centavos); só vale para o app depois de publicar. */
  priceCents: positiveCentsSchema,
  archived: z.boolean().optional(),
});
export type ProductBody = z.input<typeof productBodySchema>;

/** Edição rápida na tabela: só o rascunho da semana. */
export const productDraftBodySchema = z.object({
  priceCents: positiveCentsSchema.optional(),
  available: z.boolean().optional(),
  badge: badgeSchema.optional(),
});
export type ProductDraftBody = z.infer<typeof productDraftBodySchema>;

export interface AdminProduct {
  id: string;
  name: string;
  category: Category;
  unit: UnitCode;
  saleDescription: string;
  minQuantity: number;
  imageUrl: string;
  color: string;
  description: string | null;
  sortOrder: number;
  archived: boolean;
  /** Rascunho (o que o ADM está editando). */
  draft: { priceCents: number; available: boolean; badge: Badge };
  /** O que o app mostra hoje; null se nunca foi publicado. */
  published: { priceCents: number; available: boolean; badge: Badge } | null;
  /** Preço publicado antes da última publicação (para a variação). */
  previousPriceCents: number | null;
  /** Rascunho difere do publicado. */
  changed: boolean;
}

export interface AdminProductsResponse {
  products: AdminProduct[];
  publishedAt: string | null;
  changedCount: number;
}

/**
 * Publicar a lista da semana. Com `openWeek`, abre a semana nova junto (obrigatório quando não há
 * semana aberta: é assim que o ADM reabre os pedidos).
 */
export const publishBodySchema = z.object({
  openWeek: z
    .object({
      deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      closesAt: z.string().datetime({ offset: true }),
    })
    .optional(),
});
export type PublishBody = z.infer<typeof publishBodySchema>;

/** Ilustração padrão disponível em /products/<arquivo>.svg no web. */
export interface ProductIllustration {
  key: string;
  label: string;
  url: string;
  color: string;
}

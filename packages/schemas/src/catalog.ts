import type { Badge, Category, UnitCode } from './common';
import type { Week } from './week';

/** Produto como o restaurante vê: valores PUBLICADOS. */
export interface CatalogProduct {
  id: string;
  name: string;
  category: Category;
  /** Forma de venda por extenso: "Quilo", "Saco 20 kg", "Caixa com 4 bandejas". */
  saleDescription: string;
  unit: UnitCode;
  minQuantity: number;
  priceCents: number;
  available: boolean;
  badge: Badge;
  imageUrl: string;
  /** Cor de fundo do card (#RRGGBB). */
  color: string;
  description: string | null;
}

export interface CatalogResponse {
  week: Week | null;
  /** Data/hora da última publicação da lista. */
  publishedAt: string | null;
  minOrderCents: number;
  /** Número do WhatsApp da Morro Verde (só dígitos, com DDD) ou null se não configurado. */
  whatsapp: string | null;
  products: CatalogProduct[];
}

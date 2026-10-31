import type { Badge, Category, PrismaClient } from '@prisma/client';

interface InitialProduct {
  name: string;
  category: Category;
  unit: string;
  saleDescription: string;
  minQuantity: number;
  priceCents: number;
  image: string;
  color: string;
  badge?: Badge;
  available?: boolean;
}

/** Os 13 produtos do escopo (preços fictícios do protótipo). Ilustrações em apps/web/public. */
export const INITIAL_PRODUCTS: InitialProduct[] = [
  {
    name: 'Tomate',
    category: 'LEGUMES',
    unit: 'kg',
    saleDescription: 'Quilo',
    minQuantity: 10,
    priceCents: 690,
    image: 'tomate',
    color: '#FBE4DE',
  },
  {
    name: 'Cebola',
    category: 'LEGUMES',
    unit: 'kg',
    saleDescription: 'Quilo',
    minQuantity: 5,
    priceCents: 450,
    image: 'cebola',
    color: '#F6E9D6',
  },
  {
    name: 'Pimentão',
    category: 'LEGUMES',
    unit: 'kg',
    saleDescription: 'Quilo',
    minQuantity: 2,
    priceCents: 890,
    image: 'pimentao',
    color: '#E3F1E2',
  },
  {
    name: 'Alho',
    category: 'LEGUMES',
    unit: 'kg',
    saleDescription: 'Quilo',
    minQuantity: 2,
    priceCents: 2800,
    image: 'alho',
    color: '#EFEBDF',
  },
  {
    name: 'Batata Reino',
    category: 'LEGUMES',
    unit: 'kg',
    saleDescription: 'Quilo',
    minQuantity: 5,
    priceCents: 420,
    image: 'batata',
    color: '#F3E8D3',
  },
  {
    name: 'Cenoura',
    category: 'LEGUMES',
    unit: 'kg',
    saleDescription: 'Quilo',
    minQuantity: 2,
    priceCents: 480,
    image: 'cenoura',
    color: '#FDE7D3',
  },
  {
    name: 'Abacaxi',
    category: 'FRUTAS',
    unit: 'kg',
    saleDescription: 'Quilo',
    minQuantity: 5,
    priceCents: 550,
    image: 'abacaxi',
    color: '#F8F0D2',
  },
  {
    name: 'Manga',
    category: 'FRUTAS',
    unit: 'kg',
    saleDescription: 'Quilo',
    minQuantity: 10,
    priceCents: 650,
    image: 'manga',
    color: '#FDEBD2',
    badge: 'DESTAQUE',
  },
  {
    name: 'Laranja',
    category: 'FRUTAS',
    unit: 'saco',
    saleDescription: 'Saco 20 kg',
    minQuantity: 1,
    priceCents: 5200,
    image: 'laranja',
    color: '#FDE6CF',
  },
  {
    name: 'Banana da terra',
    category: 'FRUTAS',
    unit: 'un',
    saleDescription: 'Unidade',
    minQuantity: 10,
    priceCents: 180,
    image: 'banana',
    color: '#F7EFCB',
  },
  {
    name: 'Maracujá',
    category: 'FRUTAS',
    unit: 'saco',
    saleDescription: 'Saco 12 kg',
    minQuantity: 1,
    priceCents: 7800,
    image: 'maracuja',
    color: '#F7EFCB',
  },
  {
    name: 'Morango',
    category: 'FRUTAS',
    unit: 'caixa',
    saleDescription: 'Caixa com 4 bandejas',
    minQuantity: 1,
    priceCents: 3200,
    image: 'morango',
    color: '#FBE1E4',
    available: false,
  },
  {
    name: 'Limão',
    category: 'FRUTAS',
    unit: 'saco',
    saleDescription: 'Saco 20 kg',
    minQuantity: 1,
    priceCents: 6400,
    image: 'limao',
    color: '#E6F1DA',
  },
];

/**
 * Cria os produtos iniciais só se ainda não houver nenhum. Entram como rascunho (nunca
 * publicados): o ADM confere e publica a lista da semana.
 */
export async function ensureInitialProducts(prisma: PrismaClient) {
  if ((await prisma.product.count()) > 0) return 0;
  await prisma.product.createMany({
    data: INITIAL_PRODUCTS.map((p, index) => ({
      name: p.name,
      category: p.category,
      unit: p.unit,
      saleDescription: p.saleDescription,
      minQuantity: p.minQuantity,
      imageUrl: `/products/${p.image}.svg`,
      color: p.color,
      sortOrder: index + 1,
      draftPriceCents: p.priceCents,
      draftAvailable: p.available ?? true,
      draftBadge: p.badge ?? null,
    })),
  });
  return INITIAL_PRODUCTS.length;
}

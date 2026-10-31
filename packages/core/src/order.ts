import type { OrderStatus } from './status';
import { isWeekOpen, type WeekLike } from './cycle';

export interface CatalogProductForOrder {
  id: string;
  name: string;
  priceCents: number;
  minQuantity: number;
  available: boolean;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export type OrderProblemCode =
  | 'EMPTY'
  | 'UNKNOWN_PRODUCT'
  | 'UNAVAILABLE'
  | 'INVALID_QUANTITY'
  | 'BELOW_PRODUCT_MIN'
  | 'BELOW_ORDER_MIN'
  | 'DUPLICATE_PRODUCT';

export interface OrderProblem {
  code: OrderProblemCode;
  productId?: string;
  message: string;
}

export interface PricedLine {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
}

export interface OrderCheck {
  lines: PricedLine[];
  totalCents: number;
  problems: OrderProblem[];
  ok: boolean;
}

/**
 * Confere um pedido contra o catálogo publicado (escopo 10: mínimo por produto E pelo total).
 * Quantidades são inteiras, na unidade de venda do produto.
 */
export function checkOrder(
  items: OrderItemInput[],
  products: CatalogProductForOrder[],
  minOrderCents: number
): OrderCheck {
  const problems: OrderProblem[] = [];
  const lines: PricedLine[] = [];
  const byId = new Map(products.map((p) => [p.id, p]));
  const seen = new Set<string>();

  if (items.length === 0) {
    problems.push({ code: 'EMPTY', message: 'O pedido está vazio.' });
  }

  for (const item of items) {
    if (seen.has(item.productId)) {
      problems.push({
        code: 'DUPLICATE_PRODUCT',
        productId: item.productId,
        message: 'Produto repetido no pedido.',
      });
      continue;
    }
    seen.add(item.productId);
    const product = byId.get(item.productId);
    if (!product) {
      problems.push({
        code: 'UNKNOWN_PRODUCT',
        productId: item.productId,
        message: 'Um dos produtos não está mais no catálogo.',
      });
      continue;
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      problems.push({
        code: 'INVALID_QUANTITY',
        productId: product.id,
        message: `Quantidade inválida de ${product.name}.`,
      });
      continue;
    }
    if (!product.available) {
      problems.push({
        code: 'UNAVAILABLE',
        productId: product.id,
        message: `${product.name} está em falta nesta semana.`,
      });
      continue;
    }
    if (item.quantity < product.minQuantity) {
      problems.push({
        code: 'BELOW_PRODUCT_MIN',
        productId: product.id,
        message: `${product.name}: o mínimo é ${product.minQuantity}.`,
      });
    }
    lines.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPriceCents: product.priceCents,
      subtotalCents: product.priceCents * item.quantity,
    });
  }

  const totalCents = lines.reduce((sum, l) => sum + l.subtotalCents, 0);
  if (items.length > 0 && totalCents < minOrderCents) {
    problems.push({
      code: 'BELOW_ORDER_MIN',
      message: 'O pedido não atingiu o valor mínimo para entrega.',
    });
  }

  return { lines, totalCents, problems, ok: problems.length === 0 };
}

/** O cliente ainda pode editar ou cancelar o pedido (até o fechamento da semana)? */
export function canCustomerChange(
  status: OrderStatus,
  week: WeekLike | null | undefined,
  now: Date | string = new Date()
): boolean {
  return (status === 'NOVO' || status === 'CONFIRMADO') && isWeekOpen(week, now);
}

/** Quanto falta para o mínimo do pedido (0 quando já atingiu). */
export function missingForMinimum(totalCents: number, minOrderCents: number): number {
  return Math.max(0, minOrderCents - totalCents);
}

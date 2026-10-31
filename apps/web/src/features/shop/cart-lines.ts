import { checkOrder, missingForMinimum, type OrderProblem } from '@hortifruit/core';
import type { CatalogProduct } from '@hortifruit/schemas';

export interface CartLine {
  product: CatalogProduct;
  quantity: number;
  subtotalCents: number;
  belowMin: boolean;
}

export interface CartSummary {
  lines: CartLine[];
  totalCents: number;
  itemCount: number;
  missingCents: number;
  /** 0 a 1, para a barra de progresso até o pedido mínimo. */
  progress: number;
  problems: OrderProblem[];
  canSend: boolean;
}

/** Junta o carrinho com o catálogo da hora (preço sempre do catálogo) e confere as regras. */
export function summarizeCart(
  items: Record<string, number>,
  products: CatalogProduct[],
  minOrderCents: number
): CartSummary {
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines: CartLine[] = [];
  for (const [id, quantity] of Object.entries(items)) {
    const product = byId.get(id);
    if (!product || !product.available) continue;
    lines.push({
      product,
      quantity,
      subtotalCents: product.priceCents * quantity,
      belowMin: quantity < product.minQuantity,
    });
  }
  const totalCents = lines.reduce((sum, l) => sum + l.subtotalCents, 0);
  const check = checkOrder(
    Object.entries(items).map(([productId, quantity]) => ({ productId, quantity })),
    products,
    minOrderCents
  );
  return {
    lines,
    totalCents,
    itemCount: lines.length,
    missingCents: missingForMinimum(totalCents, minOrderCents),
    progress: minOrderCents > 0 ? Math.min(1, totalCents / minOrderCents) : 1,
    problems: check.problems,
    canSend: check.ok,
  };
}

export interface Reconciled {
  items: Record<string, number>;
  /** Nomes do que saiu (em falta ou fora do catálogo). */
  removed: string[];
  changed: boolean;
}

/**
 * Quando o catálogo muda (produto some, fica em falta ou o mínimo sobe), o carrinho se ajusta:
 * sai o que não dá mais para pedir e a quantidade sobe até o mínimo novo.
 */
export function reconcileItems(
  items: Record<string, number>,
  products: CatalogProduct[]
): Reconciled {
  const byId = new Map(products.map((p) => [p.id, p]));
  const next: Record<string, number> = {};
  const removed: string[] = [];
  let changed = false;
  for (const [id, quantity] of Object.entries(items)) {
    const product = byId.get(id);
    if (!product || !product.available) {
      removed.push(product?.name ?? 'um produto que saiu da lista');
      changed = true;
      continue;
    }
    const fixed = Math.max(quantity, product.minQuantity);
    if (fixed !== quantity) changed = true;
    next[id] = fixed;
  }
  return { items: next, removed, changed };
}

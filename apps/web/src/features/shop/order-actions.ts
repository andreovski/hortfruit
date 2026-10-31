import type { CatalogProduct, PublicOrder } from '@hortifruit/schemas';

import { cartStore, editCartStore } from './cart-store';

/**
 * "Repetir pedido": copia os itens que ainda estão disponíveis no catálogo, com a quantidade
 * levada ao mínimo atual. Preço é sempre o da semana.
 */
export function repeatItems(
  items: Pick<PublicOrder['items'][number], 'productId' | 'name' | 'quantity'>[],
  products: CatalogProduct[]
) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const next: Record<string, number> = {};
  const skipped: string[] = [];
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product || !product.available) {
      skipped.push(item.name);
      continue;
    }
    next[product.id] = Math.max(item.quantity, product.minQuantity);
  }
  return { items: next, skipped };
}

/** Copia para o carrinho do pedido novo (sem apagar o que já estava lá) e sai da edição. */
export function repeatIntoCart(order: PublicOrder, products: CatalogProduct[]) {
  const result = repeatItems(order.items, products);
  const current = cartStore.get();
  cartStore.replace({ ...current, items: { ...current.items, ...result.items }, editing: null });
  editCartStore.clear();
  return result;
}

/** Carrega o pedido no carrinho de edição (o carrinho do pedido novo fica intacto). */
export function startEditing(order: PublicOrder) {
  const items: Record<string, number> = {};
  for (const item of order.items) items[item.productId] = item.quantity;
  editCartStore.replace({
    items,
    note: order.note ?? '',
    editing: { token: order.token, number: order.number },
  });
}

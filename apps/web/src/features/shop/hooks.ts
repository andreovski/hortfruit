import { isWeekOpen } from '@hortifruit/core';
import type { CatalogProduct, Week } from '@hortifruit/schemas';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { reconcileItems } from './cart-lines';
import { type CartStore, useCartState } from './cart-store';

/** Relógio que anda sozinho (contagem até o fechamento). */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return new Date(now);
}

/** A semana aceita pedidos agora? Fecha na tela mesmo sem recarregar quando passa da hora. */
export function useWeekOpen(week: Week | null | undefined) {
  const now = useNow();
  return Boolean(week?.isOpen) && isWeekOpen(week, now);
}

/** Ajusta o carrinho ao catálogo da hora e avisa o que saiu. */
export function useReconcileCart(store: CartStore, products: CatalogProduct[] | undefined) {
  const { items } = useCartState(store);
  useEffect(() => {
    if (!products) return;
    const result = reconcileItems(items, products);
    if (!result.changed) return;
    store.setItems(result.items);
    if (result.removed.length) {
      toast.warning(`Saiu do pedido (em falta nesta semana): ${result.removed.join(', ')}.`);
    }
  }, [items, products, store]);
}

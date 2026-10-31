import { useSyncExternalStore } from 'react';

import { readJSON, writeJSON } from './storage';

/**
 * Carrinho guardado no aparelho: só produto → quantidade (e a observação). Preço e nome vêm sempre
 * do catálogo da hora, nunca do que ficou salvo.
 */
export interface CartState {
  items: Record<string, number>;
  note: string;
  /** Preenchido só no carrinho de edição: o pedido que está sendo alterado. */
  editing: { token: string; number: number } | null;
}

export interface MinProduct {
  id: string;
  minQuantity: number;
}

const EMPTY: CartState = { items: {}, note: '', editing: null };

function parse(raw: unknown): CartState {
  if (!raw || typeof raw !== 'object') return EMPTY;
  const value = raw as Partial<CartState>;
  const items: Record<string, number> = {};
  for (const [id, qty] of Object.entries(value.items ?? {})) {
    if (Number.isInteger(qty) && qty > 0) items[id] = qty;
  }
  const editing = value.editing && typeof value.editing.token === 'string' ? value.editing : null;
  return { items, note: typeof value.note === 'string' ? value.note : '', editing };
}

export function createCartStore(key: string) {
  let state: CartState = EMPTY;
  let loaded = false;
  const listeners = new Set<() => void>();

  const load = () => {
    state = parse(readJSON(key));
    loaded = true;
  };
  const get = () => {
    if (!loaded) load();
    return state;
  };
  const emit = () => listeners.forEach((l) => l());
  const set = (next: CartState) => {
    state = next;
    loaded = true;
    writeJSON(key, Object.keys(next.items).length || next.note || next.editing ? next : null);
    emit();
  };
  const setItems = (items: Record<string, number>) => set({ ...get(), items });
  const setQuantity = (product: MinProduct, quantity: number) => {
    const items = { ...get().items };
    if (quantity < product.minQuantity || quantity <= 0) delete items[product.id];
    else items[product.id] = Math.floor(quantity);
    setItems(items);
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== key) return;
    load();
    emit();
  };

  return {
    key,
    get,
    subscribe(listener: () => void) {
      if (listeners.size === 0) window.addEventListener('storage', onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener('storage', onStorage);
      };
    },
    /** Relê do localStorage (testes e outra aba). */
    reload() {
      load();
      emit();
    },
    replace(next: Partial<CartState>) {
      set({ ...EMPTY, ...next });
    },
    clear() {
      set(EMPTY);
    },
    quantity(productId: string) {
      return get().items[productId] ?? 0;
    },
    /** "Adicionar" já coloca a quantidade mínima. */
    add(product: MinProduct) {
      const current = get().items[product.id] ?? 0;
      setItems({ ...get().items, [product.id]: Math.max(current, product.minQuantity) });
    },
    increment(product: MinProduct) {
      const current = get().items[product.id] ?? 0;
      setItems({ ...get().items, [product.id]: Math.max(current + 1, product.minQuantity) });
    },
    /** Abaixo do mínimo o item sai do pedido. */
    decrement(product: MinProduct) {
      const current = get().items[product.id] ?? 0;
      setQuantity(product, current - 1);
    },
    setQuantity,
    remove(productId: string) {
      const items = { ...get().items };
      delete items[productId];
      setItems(items);
    },
    setItems,
    setNote(note: string) {
      set({ ...get(), note });
    },
  };
}

export type CartStore = ReturnType<typeof createCartStore>;

export const CART_KEY = 'hortifruit:cart:v1';
export const EDIT_CART_KEY = 'hortifruit:edit:v1';

/** Carrinho do pedido novo. */
export const cartStore = createCartStore(CART_KEY);
/** Carrinho de edição de um pedido já enviado: separado para não apagar o pedido novo. */
export const editCartStore = createCartStore(EDIT_CART_KEY);

export function useCartState(store: CartStore): CartState {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

/** O carrinho em uso: o de edição quando há um pedido sendo editado, senão o do pedido novo. */
export function useActiveCart() {
  const edit = useCartState(editCartStore);
  const cart = useCartState(cartStore);
  if (edit.editing) return { store: editCartStore, state: edit, editing: edit.editing };
  return { store: cartStore, state: cart, editing: null };
}

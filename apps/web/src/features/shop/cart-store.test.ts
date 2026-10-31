import { ALHO, MORANGO, TOMATE } from '@/test/shop';

import { reconcileItems, summarizeCart } from './cart-lines';
import { CART_KEY, createCartStore } from './cart-store';

describe('carrinho', () => {
  beforeEach(() => window.localStorage.clear());

  it('"Adicionar" coloca a quantidade mínima', () => {
    const store = createCartStore(CART_KEY);
    store.add(TOMATE);
    expect(store.quantity(TOMATE.id)).toBe(10);
  });

  it('+ soma um e − abaixo do mínimo tira o item', () => {
    const store = createCartStore(CART_KEY);
    store.add(TOMATE);
    store.increment(TOMATE);
    expect(store.quantity(TOMATE.id)).toBe(11);
    store.decrement(TOMATE);
    expect(store.quantity(TOMATE.id)).toBe(10);
    store.decrement(TOMATE);
    expect(store.quantity(TOMATE.id)).toBe(0);
    expect(store.get().items).toEqual({});
  });

  it('+ num item fora do carrinho já entra com o mínimo', () => {
    const store = createCartStore(CART_KEY);
    store.increment(ALHO);
    expect(store.quantity(ALHO.id)).toBe(2);
  });

  it('guarda no localStorage e lê de volta', () => {
    const store = createCartStore(CART_KEY);
    store.add(TOMATE);
    store.setNote('Portão lateral');
    expect(JSON.parse(window.localStorage.getItem(CART_KEY)!)).toMatchObject({
      items: { [TOMATE.id]: 10 },
      note: 'Portão lateral',
    });
    const again = createCartStore(CART_KEY);
    expect(again.get().items).toEqual({ [TOMATE.id]: 10 });
    expect(again.get().note).toBe('Portão lateral');
  });

  it('carrinho vazio some do localStorage e lixo salvo é ignorado', () => {
    const store = createCartStore(CART_KEY);
    store.add(TOMATE);
    store.clear();
    expect(window.localStorage.getItem(CART_KEY)).toBeNull();
    window.localStorage.setItem(CART_KEY, '{"items":{"x":-1,"y":"2","z":3}}');
    expect(createCartStore(CART_KEY).get().items).toEqual({ z: 3 });
  });

  it('avisa quem assina a cada mudança', () => {
    const store = createCartStore(CART_KEY);
    const listener = vi.fn();
    const off = store.subscribe(listener);
    store.add(TOMATE);
    off();
    store.add(ALHO);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('carrinho × catálogo', () => {
  it('tira o que ficou em falta ou sumiu e sobe ao mínimo novo', () => {
    const result = reconcileItems({ [TOMATE.id]: 5, [MORANGO.id]: 1, sumiu: 3 }, [TOMATE, MORANGO]);
    expect(result.items).toEqual({ [TOMATE.id]: 10 });
    expect(result.removed).toContain('Morango');
    expect(result.changed).toBe(true);
  });

  it('soma pelo preço do catálogo e bloqueia abaixo do mínimo do pedido', () => {
    const below = summarizeCart({ [TOMATE.id]: 10 }, [TOMATE, ALHO], 20000);
    expect(below.totalCents).toBe(6900);
    expect(below.missingCents).toBe(13100);
    expect(below.canSend).toBe(false);
    const ok = summarizeCart({ [TOMATE.id]: 10, [ALHO.id]: 5 }, [TOMATE, ALHO], 20000);
    expect(ok.totalCents).toBe(20900);
    expect(ok.canSend).toBe(true);
  });
});

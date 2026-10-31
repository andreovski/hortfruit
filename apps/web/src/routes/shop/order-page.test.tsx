import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { cartStore, editCartStore } from '@/features/shop/cart-store';
import {
  json,
  makeCatalog,
  makeOrder,
  makeWeek,
  mockApi,
  renderShop,
  resetShopStorage,
  TOMATE,
} from '@/test/shop';

const order = makeOrder();
const ORDER_PATH = `/api/orders/${order.token}`;

beforeEach(resetShopStorage);

describe('página do pedido', () => {
  it('pode mudar: mostra editar e cancelar com confirmação', async () => {
    let current = order;
    const api = mockApi({
      'GET /api/catalog': () => json(makeCatalog()),
      [`GET ${ORDER_PATH}`]: () => json(current),
      [`POST ${ORDER_PATH}/cancel`]: () => {
        current = makeOrder({ status: 'CANCELADO', canChange: false, canceledBy: 'CUSTOMER' });
        return json(current);
      },
    });
    renderShop(`/pedido/${order.token}`);

    expect(await screen.findByRole('heading', { name: 'Pedido #1048' })).toBeInTheDocument();
    expect(screen.getByText(/Você pode editar ou cancelar até/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar pedido' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }));
    expect(screen.getByText('Cancelar este pedido?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.queryByText('Cancelar este pedido?')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sim, cancelar' }));

    expect(await screen.findByText('Pedido cancelado')).toBeInTheDocument();
    expect(api.calls.some((c) => c.method === 'POST' && c.path === `${ORDER_PATH}/cancel`)).toBe(
      true
    );
    expect(screen.queryByRole('button', { name: 'Editar pedido' })).not.toBeInTheDocument();
  });

  it('"Editar pedido" carrega os itens no carrinho de edição sem mexer no carrinho novo', async () => {
    mockApi({
      'GET /api/catalog': () => json(makeCatalog()),
      [`GET ${ORDER_PATH}`]: () => json(order),
    });
    cartStore.setQuantity(TOMATE, 20);
    const { router } = renderShop(`/pedido/${order.token}`);

    await userEvent.click(await screen.findByRole('button', { name: 'Editar pedido' }));

    expect(await screen.findByRole('heading', { name: 'Editar pedido #1048' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/finalizar');
    expect(editCartStore.get().editing?.token).toBe(order.token);
    expect(editCartStore.get().note).toBe('Portão lateral');
    expect(cartStore.quantity(TOMATE.id)).toBe(20);
    // Edição não pede telefone.
    expect(screen.queryByLabelText('Telefone com DDD')).not.toBeInTheDocument();
  });

  it('semana fechada: explica por que não dá para mudar', async () => {
    mockApi({
      'GET /api/catalog': () => json(makeCatalog({ week: makeWeek({ isOpen: false }) })),
      [`GET ${ORDER_PATH}`]: () => json(makeOrder({ status: 'CONFIRMADO', canChange: false })),
    });
    renderShop(`/pedido/${order.token}`);
    expect(await screen.findByText(/já fecharam/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument();
  });

  it('entregue com a semana aberta: "Repetir pedido" leva os itens ao carrinho', async () => {
    mockApi({
      'GET /api/catalog': () => json(makeCatalog()),
      [`GET ${ORDER_PATH}`]: () => json(makeOrder({ status: 'ENTREGUE', canChange: false })),
    });
    const { router } = renderShop(`/pedido/${order.token}`);
    await userEvent.click(await screen.findByRole('button', { name: 'Repetir pedido' }));
    expect(router.state.location.pathname).toBe('/finalizar');
    expect(cartStore.get().items).toEqual({ [TOMATE.id]: 10, [order.items[1].productId]: 2 });
  });

  it('link desconhecido: "Pedido não encontrado"', async () => {
    mockApi({
      'GET /api/catalog': () => json(makeCatalog()),
      'GET /api/orders/nao-existe-1234567890': () => json({ message: 'Não encontrado.' }, 404),
    });
    renderShop('/pedido/nao-existe-1234567890');
    expect(await screen.findByText('Pedido não encontrado')).toBeInTheDocument();
  });
});

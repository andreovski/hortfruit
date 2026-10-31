import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { cartStore } from '@/features/shop/cart-store';
import { getOrderTokens, getRememberedPhone, PHONE_KEY } from '@/features/shop/storage';
import {
  ALHO,
  json,
  makeCatalog,
  makeOrder,
  mockApi,
  renderShop,
  resetShopStorage,
  TOMATE,
} from '@/test/shop';

const TOKEN = 'tok_novo_abcdefghijklmnopqrstuvwxyz12';

beforeEach(resetShopStorage);

function fillCart() {
  cartStore.setQuantity(TOMATE, 10); // R$ 69,00
  cartStore.setQuantity(ALHO, 5); // R$ 140,00
}

describe('finalizar pedido', () => {
  it('abaixo do mínimo o envio fica bloqueado', async () => {
    const api = mockApi({ 'GET /api/catalog': () => json(makeCatalog()) });
    cartStore.setQuantity(TOMATE, 10);
    renderShop('/finalizar');

    const button = await screen.findByRole('button', { name: 'Atinja o mínimo para enviar' });
    expect(button).toBeDisabled();
    expect(screen.getByText(/para o pedido mínimo de/)).toBeInTheDocument();
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(0);
  });

  it('telefone achado → confere os dados → envia, guarda o link e abre a confirmação', async () => {
    const api = mockApi({
      'GET /api/catalog': () => json(makeCatalog()),
      'POST /api/checkout/identify': () =>
        json({
          found: true,
          customer: {
            name: 'Cantina Bella Vista',
            maskedAddress: 'Rua Itupava',
            neighborhood: 'Centro',
          },
        }),
      'POST /api/orders': () => json({ token: TOKEN, number: 1048 }, 201),
      [`GET /api/orders/${TOKEN}`]: () => json(makeOrder({ token: TOKEN })),
    });
    fillCart();
    const { router } = renderShop('/finalizar');

    await userEvent.type(await screen.findByLabelText('Telefone com DDD'), '41998765432');
    expect(screen.getByLabelText('Telefone com DDD')).toHaveValue('(41) 99876-5432');
    await userEvent.type(screen.getByLabelText(/Observação para a entrega/), 'Portão lateral');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByRole('heading', { name: 'Confira seus dados' })).toBeInTheDocument();
    expect(screen.getByText('Cantina Bella Vista')).toBeInTheDocument();
    expect(screen.getByText('Rua Itupava · Centro')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Enviar pedido' }));

    expect(await screen.findByRole('heading', { name: 'Pedido enviado!' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/pedido/${TOKEN}`);
    const sent = api.calls.find((c) => c.method === 'POST' && c.path === '/api/orders');
    expect(sent?.body).toEqual({
      phone: '41998765432',
      items: [
        { productId: TOMATE.id, quantity: 10 },
        { productId: ALHO.id, quantity: 5 },
      ],
      note: 'Portão lateral',
    });
    expect(getOrderTokens()[0]).toBe(TOKEN);
    expect(getRememberedPhone()).toBe('41998765432');
    expect(cartStore.get().items).toEqual({});
    expect(screen.getByRole('button', { name: 'Copiar link' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Avisar também pelo WhatsApp/ })).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent('#1048'))
    );
  });

  it('telefone não achado → fale com a Morro Verde, e nada é enviado', async () => {
    const api = mockApi({
      'GET /api/catalog': () => json(makeCatalog()),
      'POST /api/checkout/identify': () => json({ found: false }),
    });
    fillCart();
    renderShop('/finalizar');

    await userEvent.type(await screen.findByLabelText('Telefone com DDD'), '41911112222');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText('Não encontramos este telefone.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Falar no WhatsApp/ })).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me/5541999998888?text=')
    );
    expect(api.calls.some((c) => c.path === '/api/orders')).toBe(false);
    expect(screen.queryByRole('button', { name: 'Enviar pedido' })).not.toBeInTheDocument();
    expect(cartStore.quantity(TOMATE.id)).toBe(10);
  });

  it('telefone lembrado já vem preenchido, com "Usar outro telefone"', async () => {
    window.localStorage.setItem(PHONE_KEY, JSON.stringify('41998765432'));
    mockApi({ 'GET /api/catalog': () => json(makeCatalog()) });
    fillCart();
    renderShop('/finalizar');

    expect(await screen.findByText('(41) 99876-5432')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Usar outro telefone' }));
    expect(screen.getByLabelText('Telefone com DDD')).toHaveValue('');
  });

  it('erro da API mostra o motivo e mantém o carrinho', async () => {
    mockApi({
      'GET /api/catalog': () => json(makeCatalog()),
      'POST /api/checkout/identify': () =>
        json({
          found: true,
          customer: { name: 'Cantina', maskedAddress: 'Rua X…', neighborhood: null },
        }),
      'POST /api/orders': () => json({ message: 'Os pedidos desta semana já fecharam.' }, 409),
    });
    fillCart();
    renderShop('/finalizar');

    await userEvent.type(await screen.findByLabelText('Telefone com DDD'), '41998765432');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Enviar pedido' }));

    expect(await screen.findByText('Os pedidos desta semana já fecharam.')).toBeInTheDocument();
    expect(cartStore.quantity(ALHO.id)).toBe(5);
    expect(getOrderTokens()).toEqual([]);
  });
});

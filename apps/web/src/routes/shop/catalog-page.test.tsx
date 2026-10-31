import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { cartStore } from '@/features/shop/cart-store';
import {
  json,
  makeCatalog,
  makeWeek,
  mockApi,
  renderShop,
  resetShopStorage,
  TOMATE,
} from '@/test/shop';

beforeEach(resetShopStorage);

describe('catálogo', () => {
  it('aberto: "Adicionar" põe o mínimo e mostra −/+ e a barra do pedido', async () => {
    mockApi({ 'GET /api/catalog': () => json(makeCatalog()) });
    renderShop('/');

    expect(await screen.findByText(/Aceitando pedidos até/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar 10 kg de Tomate' }));

    expect(cartStore.quantity(TOMATE.id)).toBe(10);
    expect(screen.getByRole('button', { name: 'Aumentar Tomate' })).toBeInTheDocument();
    const bar = screen.getByRole('link', { name: /Ver pedido/ });
    expect(within(bar).getByText('R$ 69,00')).toBeInTheDocument();
    expect(screen.getByText(/Faltam R\$ 131,00 para o mínimo/)).toBeInTheDocument();

    // Produto em falta aparece, mas sem botão.
    expect(screen.getByText('Em falta')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /de Morango/ })).not.toBeInTheDocument();
  });

  it('filtro marca o botão pressionado', async () => {
    mockApi({ 'GET /api/catalog': () => json(makeCatalog()) });
    renderShop('/');
    const frutas = await screen.findByRole('button', { name: 'Frutas' });
    await userEvent.click(frutas);
    expect(frutas).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('Tomate')).not.toBeInTheDocument();
  });

  it('fechado: preços de referência, sem botões de adicionar, WhatsApp e sem data prometida', async () => {
    mockApi({
      'GET /api/catalog': () =>
        json(
          makeCatalog({
            week: makeWeek({ isOpen: false, closedAt: '2026-11-05T15:00:00.000Z' }),
          })
        ),
    });
    renderShop('/');

    expect(await screen.findByText(/Pedidos fechados/)).toBeInTheDocument();
    expect(screen.getByText(/a nova lista sai em breve/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Preços de referência' })).toBeInTheDocument();
    expect(screen.getByText('R$ 6,90')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Adicionar/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/reabre/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Fale no WhatsApp/ })).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me/5541999998888')
    );
  });

  it('sem semana nenhuma também mostra fechado', async () => {
    mockApi({ 'GET /api/catalog': () => json(makeCatalog({ week: null, whatsapp: null })) });
    renderShop('/');
    expect(await screen.findByText(/Pedidos fechados/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /WhatsApp/ })).not.toBeInTheDocument();
  });

  it('erro ao carregar mostra "Tentar de novo"', async () => {
    mockApi({ 'GET /api/catalog': () => json({ message: 'falhou' }, 500) });
    renderShop('/');
    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });

  it('"Regras" abre o Como funciona', async () => {
    mockApi({ 'GET /api/catalog': () => json(makeCatalog()) });
    renderShop('/');
    await userEvent.click(await screen.findByRole('button', { name: /Aceitando pedidos/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Como funciona' });
    expect(within(dialog).getByText('R$ 200,00')).toBeInTheDocument();
    expect(within(dialog).getByText(/só com o telefone/)).toBeInTheDocument();
  });
});

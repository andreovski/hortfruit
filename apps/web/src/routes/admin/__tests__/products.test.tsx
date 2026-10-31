import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockShell, openWeek, productsResponse } from '@/features/admin/test/fixtures';
import { callsTo, mockRoute, resetApi } from '@/features/admin/test/mock-api';
import { renderAdmin } from '@/features/admin/test/render';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  const { fakeApi } = await import('@/features/admin/test/mock-api');
  return { ...actual, api: fakeApi };
});

beforeEach(() => {
  resetApi();
  mockRoute('GET', 'admin/products', productsResponse);
  mockRoute('PATCH', 'admin/products/p-tomate', { ok: true });
  mockRoute('POST', 'admin/products/publish', { ok: true });
});

const publishButton = () => screen.getByRole('button', { name: /Publicar lista da semana/ });

describe('Produtos e preços', () => {
  it('mostra a tabela, a variação e as alterações não publicadas', async () => {
    mockShell(openWeek);
    renderAdmin('/admin/produtos');

    const price = await screen.findByLabelText('Preço de Tomate por kg');
    expect(price).toHaveValue('6,90');
    const tomato = within(price.closest('tr')!);
    expect(tomato.getByText('antes R$ 6,50')).toBeInTheDocument();
    expect(tomato.getByText('+6,2%')).toBeInTheDocument();
    // Manga: rascunho R$ 7,00 contra o publicado R$ 6,50.
    const mango = within(screen.getByLabelText('Preço de Manga por kg').closest('tr')!);
    expect(mango.getByText('antes R$ 6,50')).toBeInTheDocument();
    expect(mango.getByText('+7,7%')).toBeInTheDocument();
    expect(screen.getByText('1 alteração não publicada')).toBeInTheDocument();
    expect(screen.getByText('Alterado')).toBeInTheDocument();
    expect(screen.getByText(/Lista publicada seg, 02\/11 às 08:15/)).toBeInTheDocument();
    expect(publishButton()).toBeEnabled();
  });

  it('preço inválido fica vermelho e bloqueia a publicação', async () => {
    mockShell(openWeek);
    renderAdmin('/admin/produtos');
    const user = userEvent.setup();

    const price = await screen.findByLabelText('Preço de Tomate por kg');
    await waitFor(() => expect(publishButton()).toBeEnabled());
    await user.clear(price);

    expect(price).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Corrija os preços em vermelho antes de publicar.');
    expect(publishButton()).toBeDisabled();

    // Corrigido, volta a liberar e salva o rascunho (PATCH depois da pausa na digitação).
    await user.type(price, '7,20');
    expect(price).toHaveAttribute('aria-invalid', 'false');
    await waitFor(() => expect(callsTo('PATCH', 'admin/products/p-tomate')).toHaveLength(1), { timeout: 2000 });
    expect(callsTo('PATCH', 'admin/products/p-tomate')[0].options.json).toEqual({ priceCents: 720 });
  });

  it('salva disponibilidade e selo no rascunho', async () => {
    mockShell(openWeek);
    renderAdmin('/admin/produtos');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('switch', { name: 'Tomate disponível' }));
    await user.selectOptions(screen.getByLabelText('Selo de Tomate'), 'NOVO');

    await waitFor(() => expect(callsTo('PATCH', 'admin/products/p-tomate')).toHaveLength(2));
    expect(callsTo('PATCH', 'admin/products/p-tomate').map((c) => c.options.json)).toEqual([
      { available: false },
      { badge: 'NOVO' },
    ]);
  });

  it('com a semana aberta, confirma e publica sem abrir semana', async () => {
    mockShell(openWeek);
    renderAdmin('/admin/produtos');
    const user = userEvent.setup();
    await screen.findByLabelText('Preço de Tomate por kg');
    await waitFor(() => expect(publishButton()).toBeEnabled());

    await user.click(publishButton());
    const confirm = await screen.findByRole('alertdialog');
    await user.click(within(confirm).getByRole('button', { name: 'Publicar' }));

    await waitFor(() => expect(callsTo('POST', 'admin/products/publish')).toHaveLength(1));
    expect(callsTo('POST', 'admin/products/publish')[0].options.json).toEqual({});
    expect(await screen.findByText('Lista publicada.')).toBeInTheDocument();
  });

  it('sem semana aberta, abre a semana junto com horário de Brasília', async () => {
    mockShell(null);
    renderAdmin('/admin/produtos');
    const user = userEvent.setup();
    await screen.findByLabelText('Preço de Tomate por kg');
    await waitFor(() => expect(publishButton()).toBeEnabled());

    await user.click(publishButton());
    const dialog = await screen.findByRole('dialog', { name: 'Abrir semana de entrega' });
    const delivery = within(dialog).getByLabelText(/Data da entrega/);
    expect(delivery).toHaveValue('2026-11-13');
    expect(within(dialog).getByLabelText('Data do fechamento')).toHaveValue('2026-11-12');
    expect(within(dialog).getByLabelText('Hora do fechamento')).toHaveValue('12:00');

    // Mudar a entrega leva o fechamento para a véspera; a hora o ADM ajusta.
    await user.clear(delivery);
    await user.type(delivery, '2026-11-20');
    expect(within(dialog).getByLabelText('Data do fechamento')).toHaveValue('2026-11-19');
    const time = within(dialog).getByLabelText('Hora do fechamento');
    await user.clear(time);
    await user.type(time, '10:30');

    await user.click(within(dialog).getByRole('button', { name: 'Abrir e publicar' }));

    await waitFor(() => expect(callsTo('POST', 'admin/products/publish')).toHaveLength(1));
    expect(callsTo('POST', 'admin/products/publish')[0].options.json).toEqual({
      openWeek: { deliveryDate: '2026-11-20', closesAt: '2026-11-19T10:30:00-03:00' },
    });
  });
});

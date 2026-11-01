import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { me, mockShell, openWeek, productsResponse } from '@/features/admin/test/fixtures';
import { callsTo, mockRoute, resetApi } from '@/features/admin/test/mock-api';
import { renderAdmin } from '@/features/admin/test/render';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  const { fakeApi } = await import('@/features/admin/test/mock-api');
  return { ...actual, api: fakeApi };
});

beforeEach(() => {
  resetApi();
  mockShell();
  mockRoute('GET', 'admin/admins', { admins: [me.admin] });
});

describe('Ajustes', () => {
  it('fecha os pedidos com confirmação e salva o pedido mínimo e a taxa', async () => {
    mockRoute('POST', 'admin/weeks/current/close', { ok: true });
    mockRoute('PATCH', 'admin/settings', { minOrderCents: 25_000, smallOrderFeeCents: 3000, uploadsEnabled: false, whatsapp: null });
    renderAdmin('/admin/ajustes');
    const user = userEvent.setup();

    expect(await screen.findByText('WhatsApp configurado:')).toBeInTheDocument();
    expect(screen.getByText('(41) 99999-0000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desativar' })).toBeDisabled();

    await user.click(await screen.findByRole('button', { name: /Fechar pedidos agora/ }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Fechar pedidos' }));
    await waitFor(() => expect(callsTo('POST', 'admin/weeks/current/close')).toHaveLength(1));

    const min = screen.getByLabelText('Valor mínimo (R$)');
    expect(min).toHaveValue('200,00');
    await user.clear(min);
    await user.type(min, '250');
    const fee = screen.getByLabelText('Taxa abaixo do mínimo (R$)');
    expect(fee).toHaveValue('50,00');
    await user.clear(fee);
    await user.type(fee, '30');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() =>
      expect(callsTo('PATCH', 'admin/settings')[0]?.options.json).toEqual({
        minOrderCents: 25_000,
        smallOrderFeeCents: 3000,
      })
    );
  });
});

describe('Lista de compra', () => {
  it('mostra os totais por produto e o link do CSV', async () => {
    mockRoute('GET', 'admin/products', productsResponse);
    mockRoute('GET', 'admin/purchase-list', {
      week: openWeek,
      rows: [
        {
          productId: 'p-tomate',
          name: 'Tomate',
          unit: 'kg',
          saleDescription: 'Quilo',
          quantity: 45,
          orderCount: 3,
          totalCents: 31_050,
        },
      ],
      totalCents: 31_050,
    });
    renderAdmin('/admin/lista-de-compra');

    expect(await screen.findByText('45 kg')).toBeInTheDocument();
    expect(screen.getByText('3 pedidos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Exportar CSV/ })).toHaveAttribute(
      'href',
      '/api/admin/purchase-list.csv?weekId=week-1'
    );
  });
});

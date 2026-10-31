import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockShell, orderDetail, ordersResponse } from '@/features/admin/test/fixtures';
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
  mockRoute('GET', 'admin/orders', ordersResponse);
  mockRoute('GET', 'admin/orders/o-1048', orderDetail);
});

describe('Pedidos', () => {
  it('mostra indicadores, contador no menu e as linhas', async () => {
    renderAdmin('/admin');

    expect(await screen.findByText('Cantina Bella Vista')).toBeInTheDocument();
    expect(screen.getByText('Aguardando confirmação').parentElement).toHaveTextContent('2');
    expect(screen.getByText('Total estimado').parentElement).toHaveTextContent('R$ 1.234,50');
    expect(screen.getByText('Clientes sem pedido').parentElement).toHaveTextContent('3');
    expect(screen.getByText('#1048')).toBeInTheDocument();
    expect(screen.getByText('qua, 04/11 às 09:12')).toBeInTheDocument();
    expect(screen.getByText('editado')).toBeInTheDocument();
    expect(screen.getByLabelText('2 pedidos novos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Pedidos/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText(/Entrega sex, 06\/11 · recebendo pedidos até qui, 05\/11 às 12h/)).toBeInTheDocument();
  });

  it('filtra por status pelos chips', async () => {
    renderAdmin('/admin');
    const user = userEvent.setup();
    await screen.findByText('Cantina Bella Vista');

    await user.click(screen.getByRole('button', { name: /Confirmados/ }));

    expect(screen.queryByText('Cantina Bella Vista')).not.toBeInTheDocument();
    expect(screen.getByText('Cozinha da Vó Lurdes')).toBeInTheDocument();
  });

  it('abre o detalhe e confirma o pedido', async () => {
    mockRoute('POST', 'admin/orders/o-1048/status', { ok: true });
    renderAdmin('/admin');
    const user = userEvent.setup();

    await user.click(await screen.findByText('Cantina Bella Vista'));
    const drawer = await screen.findByRole('dialog');
    expect(await within(drawer).findByText('Pedido #1048')).toBeInTheDocument();
    expect(within(drawer).getByText('Marcos Antunes')).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: /\(41\) 99876-5432/ })).toHaveAttribute(
      'href',
      'https://wa.me/5541998765432'
    );
    expect(within(drawer).getByText(/Receber pela porta dos fundos/)).toBeInTheDocument();
    expect(within(drawer).getByText('10 kg × R$ 6,90/kg')).toBeInTheDocument();
    expect(within(drawer).queryByRole('button', { name: /Marcar como entregue/ })).not.toBeInTheDocument();

    await user.click(within(drawer).getByRole('button', { name: /Confirmar pedido/ }));

    await waitFor(() => expect(callsTo('POST', 'admin/orders/o-1048/status')).toHaveLength(1));
    expect(callsTo('POST', 'admin/orders/o-1048/status')[0].options.json).toEqual({ status: 'CONFIRMADO' });
  });

  it('pede confirmação antes de cancelar', async () => {
    mockRoute('POST', 'admin/orders/o-1048/status', { ok: true });
    renderAdmin('/admin');
    const user = userEvent.setup();

    await user.click(await screen.findByText('Cantina Bella Vista'));
    await user.click(await screen.findByRole('button', { name: 'Cancelar pedido' }));

    const confirm = await screen.findByRole('alertdialog');
    expect(confirm).toHaveTextContent('Cancelar o pedido #1048?');
    expect(callsTo('POST', 'admin/orders/o-1048/status')).toHaveLength(0);

    await user.click(within(confirm).getByRole('button', { name: 'Sim, cancelar' }));
    await waitFor(() =>
      expect(callsTo('POST', 'admin/orders/o-1048/status')[0]?.options.json).toEqual({ status: 'CANCELADO' })
    );
  });

  it('busca e semana vão para a API', async () => {
    renderAdmin('/admin');
    const user = userEvent.setup();
    await screen.findByText('Cantina Bella Vista');

    await user.type(screen.getByLabelText('Buscar por cliente ou número do pedido'), 'bella');
    await user.click(screen.getByRole('button', { name: 'Todas as semanas' }));

    await waitFor(() =>
      expect(callsTo('GET', 'admin/orders').at(-1)?.options.searchParams).toEqual({ search: 'bella', weekId: 'all' })
    );
  });
});

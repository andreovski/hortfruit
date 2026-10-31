import type { Customer } from '@hortifruit/schemas';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockShell } from '@/features/admin/test/fixtures';
import { callsTo, httpError, mockRoute, resetApi } from '@/features/admin/test/mock-api';
import { renderAdmin } from '@/features/admin/test/render';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  const { fakeApi } = await import('@/features/admin/test/mock-api');
  return { ...actual, api: fakeApi };
});

const bellaVista: Customer = {
  id: 'c-1',
  name: 'Cantina Bella Vista',
  contactName: 'Marcos Antunes',
  phone: '41998765432',
  cnpj: null,
  email: null,
  address: 'Rua Itupava, 1240',
  neighborhood: 'Alto da XV',
  city: 'Curitiba',
  notes: null,
  active: true,
  createdAt: '2026-10-01T12:00:00.000Z',
  orderCount: 12,
  lastOrderAt: '2026-11-04T12:12:00.000Z',
};

beforeEach(() => {
  resetApi();
  mockShell();
  mockRoute('GET', 'admin/customers', { customers: [bellaVista] });
});

describe('Clientes', () => {
  it('lista os clientes', async () => {
    renderAdmin('/admin/clientes');

    expect(await screen.findByText('Cantina Bella Vista')).toBeInTheDocument();
    expect(screen.getByText('(41) 99876-5432')).toBeInTheDocument();
    expect(screen.getByText('Alto da XV · Curitiba')).toBeInTheDocument();
    expect(screen.getByText('04/11/2026')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('1 cadastrados · 1 ativos')).toBeInTheDocument();
    expect(screen.queryByText(/primeiro acesso/i)).not.toBeInTheDocument();
  });

  it('valida o formulário e cadastra', async () => {
    mockRoute('POST', 'admin/customers', (opts) => ({ ...bellaVista, id: 'c-2', ...(opts.json as object) }));
    renderAdmin('/admin/clientes');
    const user = userEvent.setup();
    await screen.findByText('Cantina Bella Vista');

    await user.click(screen.getByRole('button', { name: 'Novo cliente' }));
    const drawer = await screen.findByRole('dialog', { name: 'Novo cliente' });
    await user.click(within(drawer).getByRole('button', { name: 'Cadastrar cliente' }));

    expect(within(drawer).getByText('Informe o nome.')).toBeInTheDocument();
    expect(within(drawer).getByText('Informe o endereço de entrega.')).toBeInTheDocument();
    expect(within(drawer).getByLabelText(/Telefone/)).toHaveAttribute('aria-invalid', 'true');
    expect(callsTo('POST', 'admin/customers')).toHaveLength(0);

    await user.type(within(drawer).getByLabelText(/^Nome/), 'Bistrô Araucária');
    await user.type(within(drawer).getByLabelText(/Telefone/), '41997123080');
    expect(within(drawer).getByLabelText(/Telefone/)).toHaveValue('(41) 99712-3080');
    await user.type(within(drawer).getByLabelText(/Endereço de entrega/), 'Av. do Batel, 1868');
    await user.type(within(drawer).getByLabelText('Bairro'), 'Batel');
    await user.click(within(drawer).getByRole('button', { name: 'Cadastrar cliente' }));

    await waitFor(() => expect(callsTo('POST', 'admin/customers')).toHaveLength(1));
    expect(callsTo('POST', 'admin/customers')[0].options.json).toMatchObject({
      name: 'Bistrô Araucária',
      phone: '(41) 99712-3080',
      address: 'Av. do Batel, 1868',
      neighborhood: 'Batel',
      active: true,
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('mostra o erro de telefone repetido vindo da API', async () => {
    mockRoute('PATCH', 'admin/customers/c-1', () => {
      throw httpError(409, { message: 'Já existe um cliente com esse telefone.' });
    });
    renderAdmin('/admin/clientes');
    const user = userEvent.setup();

    await user.click(await screen.findByText('Cantina Bella Vista'));
    const drawer = await screen.findByRole('dialog', { name: 'Editar cliente' });
    expect(within(drawer).getByLabelText(/Telefone/)).toHaveValue('(41) 99876-5432');
    await user.click(within(drawer).getByRole('button', { name: 'Salvar alterações' }));

    expect(await within(drawer).findByRole('alert')).toHaveTextContent('Já existe um cliente com esse telefone.');
    expect(within(drawer).getByLabelText(/Telefone/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('filtra por situação', async () => {
    renderAdmin('/admin/clientes');
    const user = userEvent.setup();
    await screen.findByText('Cantina Bella Vista');

    await user.click(screen.getByRole('button', { name: 'Inativos' }));

    await waitFor(() =>
      expect(callsTo('GET', 'admin/customers').at(-1)?.options.searchParams).toMatchObject({ status: 'inactive' })
    );
  });
});

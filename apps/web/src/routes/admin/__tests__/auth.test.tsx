import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { me, mockShell } from '@/features/admin/test/fixtures';
import { callsTo, httpError, mockRoute, resetApi } from '@/features/admin/test/mock-api';
import { renderAdmin } from '@/features/admin/test/render';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  const { fakeApi } = await import('@/features/admin/test/mock-api');
  return { ...actual, api: fakeApi };
});

beforeEach(() => {
  resetApi();
  mockShell();
  mockRoute('GET', 'admin/customers', { customers: [] });
});

describe('acesso ao painel', () => {
  it('sem sessão, manda para /admin/entrar com o redirect', async () => {
    mockRoute('GET', 'me', () => {
      throw httpError(401, { message: 'Entre de novo.' });
    });
    const { router } = renderAdmin('/admin/clientes');

    expect(await screen.findByRole('heading', { name: 'Entrar no painel' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/entrar');
    expect(router.state.location.search).toEqual({ redirect: '/admin/clientes' });
  });

  it('mostra o erro da API quando a senha está errada', async () => {
    mockRoute('GET', 'me', () => {
      throw httpError(401, {});
    });
    mockRoute('POST', 'sessions', () => {
      throw httpError(401, { message: 'E-mail, telefone ou senha incorretos.' });
    });
    renderAdmin('/admin/entrar');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('E-mail ou telefone'), 'ana@morroverde.com.br');
    await user.type(screen.getByLabelText('Senha'), 'errada123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail, telefone ou senha incorretos.');
  });

  it('valida os campos antes de chamar a API', async () => {
    mockRoute('GET', 'me', () => {
      throw httpError(401, {});
    });
    renderAdmin('/admin/entrar');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Entrar' }));

    expect(screen.getByText('Informe e-mail ou telefone.')).toBeInTheDocument();
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument();
    expect(callsTo('POST', 'sessions')).toHaveLength(0);
  });

  it('depois de entrar, volta para a página pedida', async () => {
    let loggedIn = false;
    mockRoute('GET', 'me', () => {
      if (!loggedIn) throw httpError(401, {});
      return me;
    });
    mockRoute('POST', 'sessions', () => {
      loggedIn = true;
      return me;
    });
    const { router } = renderAdmin('/admin/entrar?redirect=%2Fadmin%2Fclientes');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('E-mail ou telefone'), '(41) 99999-0000');
    await user.type(screen.getByLabelText('Senha'), 'segredo123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/clientes'));
    expect(callsTo('POST', 'sessions')[0].options.json).toEqual({
      login: '(41) 99999-0000',
      password: 'segredo123',
    });
    expect(await screen.findByRole('heading', { name: 'Clientes' })).toBeInTheDocument();
  });

  it('não redireciona para fora do painel', async () => {
    let loggedIn = false;
    mockRoute('GET', 'me', () => {
      if (!loggedIn) throw httpError(401, {});
      return me;
    });
    mockRoute('POST', 'sessions', () => {
      loggedIn = true;
      return me;
    });
    mockRoute('GET', 'admin/orders', {
      week: null,
      indicators: { awaitingConfirmation: 0, weekOrders: 0, weekTotalCents: 0, activeCustomersWithoutOrder: 0 },
      orders: [],
    });
    const { router } = renderAdmin('/admin/entrar?redirect=https%3A%2F%2Fevil.example');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('E-mail ou telefone'), 'ana@morroverde.com.br');
    await user.type(screen.getByLabelText('Senha'), 'segredo123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'));
  });
});

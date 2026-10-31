import type { AdminsResponse, AdminUser, MeResponse } from '@hortifruit/schemas';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { ensureOwner } from '@/services/admins';
import { client, login, loginAsOwner, OWNER, resetDatabase } from '@/test/helpers';

import { SESSION_COOKIE } from './session';

beforeAll(() => app.ready());
afterAll(() => app.close());
beforeEach(resetDatabase);

describe('sessão do ADM', () => {
  it('o seed do primeiro ADM só cria quando não há nenhum', async () => {
    const first = await ensureOwner(prisma, OWNER);
    const second = await ensureOwner(prisma, { ...OWNER, email: 'outro@example.com' });
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(await prisma.admin.count()).toBe(1);
    expect(first.admin.phone).toBe('41999990000');
  });

  it('entra com e-mail (qualquer caixa) e lê /me', async () => {
    await ensureOwner(prisma, OWNER);
    const cookie = await login(app, 'ANDRE@Example.com', OWNER.password);
    const me = await client(app, cookie).get('/me');
    expect(me.statusCode).toBe(200);
    expect(me.json<MeResponse>().admin).toMatchObject({
      name: 'André',
      email: OWNER.email,
      phone: '41999990000',
      active: true,
    });
    expect(me.body).not.toContain('passwordHash');
  });

  it('entra com telefone em qualquer formato', async () => {
    await ensureOwner(prisma, OWNER);
    const res = await app.inject({
      method: 'POST',
      url: '/sessions',
      payload: { login: '+55 41 99999-0000', password: OWNER.password },
    });
    expect(res.statusCode).toBe(200);
    const cookie = res.cookies.find((c) => c.name === SESSION_COOKIE);
    expect(cookie?.httpOnly).toBe(true);
    expect(res.json<MeResponse>().admin.email).toBe(OWNER.email);
  });

  it('senha errada, login desconhecido ou ADM inativo → 401 com a mesma mensagem', async () => {
    const { admin } = await ensureOwner(prisma, OWNER);
    const tries = [
      { login: OWNER.email, password: 'errada-123' },
      { login: 'ninguem@example.com', password: OWNER.password },
      { login: 'abc', password: OWNER.password },
    ];
    for (const payload of tries) {
      const res = await app.inject({ method: 'POST', url: '/sessions', payload });
      expect(res.statusCode).toBe(401);
      expect(res.json().message).toBe('E-mail, telefone ou senha incorretos.');
    }
    await prisma.admin.update({ where: { id: admin.id }, data: { active: false } });
    const inactive = await app.inject({
      method: 'POST',
      url: '/sessions',
      payload: { login: OWNER.email, password: OWNER.password },
    });
    expect(inactive.statusCode).toBe(401);
  });

  it('sem cookie ou com ADM desativado → 401; sair limpa o cookie', async () => {
    const { admin, cookie } = await loginAsOwner(app);
    expect((await app.inject({ method: 'GET', url: '/me' })).statusCode).toBe(401);
    for (const url of [
      '/admin/orders',
      '/admin/orders/new-count',
      '/admin/customers',
      '/admin/products',
      '/admin/purchase-list',
      '/admin/weeks/current',
      '/admin/settings',
      '/admin/admins',
    ]) {
      expect((await app.inject({ method: 'GET', url })).statusCode, url).toBe(401);
    }
    expect(
      (
        await app.inject({
          method: 'GET',
          url: '/admin/orders',
          headers: { cookie: 'hortifruit_session=lixo' },
        })
      ).statusCode
    ).toBe(401);

    const logout = await client(app, cookie).delete('/sessions');
    expect(logout.statusCode).toBe(204);
    expect(logout.cookies.find((c) => c.name === SESSION_COOKIE)?.value).toBe('');

    await prisma.admin.update({ where: { id: admin.id }, data: { active: false } });
    expect((await client(app, cookie).get('/me')).statusCode).toBe(401);
    expect((await client(app, cookie).get('/admin/orders')).statusCode).toBe(401);
  });
});

describe('ADMs', () => {
  it('cadastra, lista e recusa e-mail ou telefone repetido', async () => {
    const { cookie } = await loginAsOwner(app);
    const api = client(app, cookie);
    const created = await api.post('/admin/admins', {
      name: 'Bia',
      email: 'Bia@Example.com',
      phone: '(41) 98888-7777',
      password: 'senha-da-bia',
    });
    expect(created.statusCode).toBe(201);
    expect(created.json<AdminUser>()).toMatchObject({
      email: 'bia@example.com',
      phone: '41988887777',
      active: true,
    });

    const sameEmail = await api.post('/admin/admins', {
      name: 'Outra',
      email: 'bia@example.com',
      password: 'senha-qualquer',
    });
    expect(sameEmail.statusCode).toBe(409);
    expect(sameEmail.json().message).toBe('Já existe um ADM com este e-mail.');
    const samePhone = await api.post('/admin/admins', {
      name: 'Outra',
      phone: '41988887777',
      password: 'senha-qualquer',
    });
    expect(samePhone.statusCode).toBe(409);
    expect(samePhone.json().message).toBe('Já existe um ADM com este telefone.');

    const invalid = await api.post('/admin/admins', { name: 'X', password: 'senha-qualquer' });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json().message).toBe('Informe e-mail ou telefone.');
    const badPhone = await api.post('/admin/admins', {
      name: 'X',
      phone: '123',
      password: 'senha-qualquer',
    });
    expect(badPhone.statusCode).toBe(400);

    const list = (await api.get('/admin/admins')).json<AdminsResponse>();
    expect(list.admins.map((a) => a.name)).toEqual(['André', 'Bia']);

    // A nova entra pelo telefone.
    await login(app, '41988887777', 'senha-da-bia');
  });

  it('não desativa a si mesmo nem o último ADM ativo', async () => {
    const { admin, cookie } = await loginAsOwner(app);
    const api = client(app, cookie);
    const self = await api.patch(`/admin/admins/${admin.id}`, { active: false });
    expect(self.statusCode).toBe(409);
    expect(self.json().message).toBe('Você não pode desativar a si mesmo.');

    const bia = (
      await api.post('/admin/admins', {
        name: 'Bia',
        email: 'bia@example.com',
        password: 'senha-da-bia',
      })
    ).json<AdminUser>();
    const off = await api.patch(`/admin/admins/${bia.id}`, { active: false, name: 'Bia S.' });
    expect(off.statusCode).toBe(200);
    expect(off.json<AdminUser>()).toMatchObject({ active: false, name: 'Bia S.' });

    // Inativa, a Bia não entra; reativada, entra.
    const blocked = await app.inject({
      method: 'POST',
      url: '/sessions',
      payload: { login: 'bia@example.com', password: 'senha-da-bia' },
    });
    expect(blocked.statusCode).toBe(401);
    await api.patch(`/admin/admins/${bia.id}`, { active: true });
    await login(app, 'bia@example.com', 'senha-da-bia');
    // (O "último ADM ativo" fica protegido também: quem pede está ativo, então desativar outro
    // nunca zera; desativar a si mesmo já é recusado acima.)
  });

  it('troca a senha e não deixa ficar sem e-mail e telefone', async () => {
    const { admin, cookie } = await loginAsOwner(app);
    const api = client(app, cookie);
    expect(
      (await api.patch(`/admin/admins/${admin.id}`, { email: null, phone: null })).statusCode
    ).toBe(400);
    expect(
      (await api.patch(`/admin/admins/${admin.id}`, { password: 'nova-senha-1' })).statusCode
    ).toBe(200);
    await login(app, OWNER.email, 'nova-senha-1');
  });
});

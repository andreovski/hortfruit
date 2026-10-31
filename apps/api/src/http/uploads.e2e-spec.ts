import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '@/app';
import { prisma } from '@/lib/prisma';
import { ensureOwner } from '@/services/admins';
import { OWNER, resetDatabase } from '@/test/helpers';

import { SESSION_COOKIE } from './session';

// Token no formato do UploadThing v7 (base64 de { apiKey, appId, regions }); nada sai para a rede
// nestes casos.
const FAKE_TOKEN = Buffer.from(
  JSON.stringify({ apiKey: `sk_live_${'x'.repeat(40)}`, appId: 'app123', regions: ['sea1'] })
).toString('base64');

describe('upload de fotos (UploadThing)', () => {
  const app = buildApp();

  // As rotas leem o token quando o app fica pronto.
  beforeAll(async () => {
    vi.stubEnv('UPLOADTHING_TOKEN', FAKE_TOKEN);
    await app.ready();
  });
  afterAll(async () => {
    vi.unstubAllEnvs();
    await app.close();
  });
  beforeEach(resetDatabase);

  it('com o token, /uploadthing serve a configuração da rota', async () => {
    const res = await app.inject({ method: 'GET', url: '/uploadthing' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([
      expect.objectContaining({
        slug: 'productImage',
        config: expect.objectContaining({
          image: expect.objectContaining({ maxFileSize: '4MB', maxFileCount: 1 }),
        }),
      }),
    ]);
  });

  it('enviar exige ADM logado', async () => {
    const upload = (cookie?: string) =>
      app.inject({
        method: 'POST',
        url: '/uploadthing?actionType=upload&slug=productImage',
        headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
        payload: { files: [{ name: 'a.png', size: 100, type: 'image/png', lastModified: 0 }] },
      });
    const anonymous = await upload();
    expect(anonymous.statusCode).toBe(403);
    expect(anonymous.json().message).toBe('Unauthorized');

    // Sessão de um ADM desativado também não passa.
    const { admin } = await ensureOwner(prisma, OWNER);
    await prisma.admin.update({ where: { id: admin.id }, data: { active: false } });
    const token = app.jwt.sign({ sub: admin.id });
    expect((await upload(`${SESSION_COOKIE}=${token}`)).statusCode).toBe(403);

    // Com sessão válida o adaptador gera as URLs e avisa o UploadThing pela rede: fica fora do e2e.
  });
});

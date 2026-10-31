import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '@/app';
import { prisma } from '@/lib/prisma';
import { ensureOwner } from '@/services/admins';
import { uploadStorage } from '@/services/uploads';
import { client, createProduct, loginAsOwner, OWNER, resetDatabase } from '@/test/helpers';

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
  beforeEach(async () => {
    vi.restoreAllMocks();
    await resetDatabase();
  });

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

  describe('foto que sai de uso é apagada do UploadThing', () => {
    const OLD = 'https://app123.ufs.sh/f/antiga_foto.jpg';
    const NEW = 'https://app123.ufs.sh/f/nova_foto.jpg';

    it('ao trocar a foto do produto, apaga a anterior', async () => {
      const remove = vi.spyOn(uploadStorage, 'remove').mockResolvedValue();
      const product = await createProduct({ imageUrl: OLD });
      const api = client(app, (await loginAsOwner(app)).cookie);

      expect((await api.patch(`/admin/products/${product.id}`, { imageUrl: NEW })).statusCode).toBe(200);
      expect(remove).toHaveBeenCalledExactlyOnceWith('antiga_foto.jpg');

      // Mesma foto, ilustração antiga ou nada de foto: não apaga nada.
      remove.mockClear();
      await api.patch(`/admin/products/${product.id}`, { imageUrl: NEW, name: 'Tomate italiano' });
      await api.patch(`/admin/products/${product.id}`, { priceCents: 990 });
      const other = await createProduct({ imageUrl: '/products/tomate.svg' });
      await api.patch(`/admin/products/${other.id}`, { imageUrl: NEW });
      expect(remove).not.toHaveBeenCalled();
    });

    it('não apaga foto que outro produto ainda usa', async () => {
      const remove = vi.spyOn(uploadStorage, 'remove').mockResolvedValue();
      const product = await createProduct({ imageUrl: OLD });
      await createProduct({ name: 'Cebola', imageUrl: OLD });
      const api = client(app, (await loginAsOwner(app)).cookie);
      await api.patch(`/admin/products/${product.id}`, { imageUrl: NEW });
      expect(remove).not.toHaveBeenCalled();
    });

    it('falha no UploadThing não derruba a edição', async () => {
      vi.spyOn(uploadStorage, 'remove').mockRejectedValue(new Error('rede'));
      const product = await createProduct({ imageUrl: OLD });
      const api = client(app, (await loginAsOwner(app)).cookie);
      const res = await api.patch(`/admin/products/${product.id}`, { imageUrl: NEW });
      expect(res.statusCode).toBe(200);
      expect(res.json().imageUrl).toBe(NEW);
    });

    it('descartar a foto enviada e não salva', async () => {
      const remove = vi.spyOn(uploadStorage, 'remove').mockResolvedValue();
      await createProduct({ imageUrl: OLD });
      const anonymous = await client(app).post('/admin/uploads/discard', { url: NEW });
      expect(anonymous.statusCode).toBe(401);

      const api = client(app, (await loginAsOwner(app)).cookie);
      expect((await api.post('/admin/uploads/discard', { url: NEW })).statusCode).toBe(204);
      expect(remove).toHaveBeenCalledExactlyOnceWith('nova_foto.jpg');

      // Em uso por um produto ou fora do UploadThing: fica.
      remove.mockClear();
      expect((await api.post('/admin/uploads/discard', { url: OLD })).statusCode).toBe(204);
      expect((await api.post('/admin/uploads/discard', { url: '/products/tomate.svg' })).statusCode).toBe(204);
      expect(remove).not.toHaveBeenCalled();
    });
  });
});

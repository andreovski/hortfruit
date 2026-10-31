import { UTApi } from 'uploadthing/server';

import { getUploadthingToken } from '@/lib/env';
import { prisma } from '@/lib/prisma';

/**
 * Chave do arquivo no UploadThing a partir da URL pública (`https://<app>.ufs.sh/f/<chave>` ou
 * `https://utfs.io/f/<chave>`). Ilustrações locais e outros endereços → null.
 */
export function uploadthingKeyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  const host = parsed.hostname;
  if (host !== 'utfs.io' && !host.endsWith('.ufs.sh')) return null;
  const match = /^\/f\/([^/]+)$/.exec(parsed.pathname);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Quem apaga de verdade no UploadThing. Os testes trocam `remove` para não ir à rede. */
export const uploadStorage = {
  async remove(key: string): Promise<void> {
    const token = getUploadthingToken();
    if (!token) return;
    await new UTApi({ token }).deleteFiles(key);
  },
};

/**
 * Apaga do UploadThing a foto que nenhum produto usa mais. É faxina: falha só vai para o log e
 * nunca derruba a ação do ADM.
 */
export async function deleteUnusedUpload(
  url: string | null | undefined,
  log?: { warn: (obj: object, msg: string) => void }
): Promise<boolean> {
  const key = uploadthingKeyFromUrl(url);
  if (!key || !getUploadthingToken()) return false;
  const inUse = await prisma.product.count({ where: { imageUrl: url! } });
  if (inUse > 0) return false;
  try {
    await uploadStorage.remove(key);
    return true;
  } catch (error) {
    log?.warn({ err: error, key }, 'Não deu para apagar a foto antiga no UploadThing.');
    return false;
  }
}

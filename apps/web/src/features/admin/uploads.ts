import { useCallback, useEffect, useRef } from 'react';

import { api } from '@/lib/api';

/** Pede à API para apagar do UploadThing uma foto enviada que não foi salva. Faxina: falha é ignorada. */
export function discardUpload(url: string): void {
  api.post('admin/uploads/discard', { json: { url }, keepalive: true }).catch(() => undefined);
}

/**
 * Fotos enviadas no formulário e ainda não salvas. A que é trocada por outra imagem, e as que
 * sobram quando o formulário fecha sem salvar, são apagadas do UploadThing.
 */
export function usePendingUploads(discard: (url: string) => void = discardUpload) {
  const pending = useRef(new Set<string>());
  const discardRef = useRef(discard);
  useEffect(() => {
    discardRef.current = discard;
  }, [discard]);

  /** Imagem do formulário trocou de `previous` para `next` (`uploaded`: `next` acabou de ser enviada). */
  const replaced = useCallback((previous: string, next: string, uploaded = false) => {
    if (previous !== next && pending.current.delete(previous)) discardRef.current(previous);
    if (uploaded) pending.current.add(next);
  }, []);

  /** Produto salvo: a imagem salva fica, e nada mais está pendente. */
  const saved = useCallback(() => {
    pending.current.clear();
  }, []);

  useEffect(() => {
    const set = pending.current;
    return () => {
      for (const url of set) discardRef.current(url);
      set.clear();
    };
  }, []);

  return { replaced, saved };
}

import { centsToInput, parseBRL } from '@hortifruit/core';
import type { AdminProduct } from '@hortifruit/schemas';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { usePatchDraft } from './products';

export const PRICE_SAVE_DELAY_MS = 600;

/**
 * Preços digitados na tabela de produtos. O texto fica aqui (e não na linha) para o preço inválido
 * continuar bloqueando a publicação mesmo quando o filtro esconde a linha. Cada preço válido vai
 * para o rascunho 600 ms depois da última tecla, ou na hora ao sair do campo.
 */
export function usePriceDrafts(products: AdminProduct[]) {
  const patch = usePatchDraft();
  const { mutate } = patch;
  const [texts, setTexts] = useState<Record<string, string>>({});
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pending = useRef(new Map<string, number>());
  const drafts = useMemo(() => new Map(products.map((p) => [p.id, p.draft.priceCents])), [products]);
  const draftsRef = useRef(drafts);
  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  const save = useCallback(
    (id: string) => {
      clearTimeout(timers.current.get(id));
      timers.current.delete(id);
      const cents = pending.current.get(id);
      pending.current.delete(id);
      if (cents !== undefined && cents !== draftsRef.current.get(id)) {
        mutate({ id, patch: { priceCents: cents } });
      }
    },
    [mutate]
  );

  const flushAll = useCallback(() => {
    for (const id of [...pending.current.keys()]) save(id);
  }, [save]);

  // Saiu da página com preço esperando: salva mesmo assim.
  useEffect(() => flushAll, [flushAll]);

  const change = useCallback(
    (id: string, text: string) => {
      setTexts((t) => ({ ...t, [id]: text }));
      clearTimeout(timers.current.get(id));
      const cents = parseBRL(text);
      if (cents === null) {
        pending.current.delete(id);
        return;
      }
      pending.current.set(id, cents);
      timers.current.set(
        id,
        setTimeout(() => save(id), PRICE_SAVE_DELAY_MS)
      );
    },
    [save]
  );

  const textFor = useCallback(
    (product: AdminProduct) => texts[product.id] ?? centsToInput(product.draft.priceCents),
    [texts]
  );

  const invalidIds = useMemo(
    () =>
      new Set(
        Object.entries(texts)
          .filter(([id, text]) => drafts.has(id) && parseBRL(text) === null)
          .map(([id]) => id)
      ),
    [texts, drafts]
  );

  return { textFor, change, commit: save, flushAll, invalidIds };
}

import { useSyncExternalStore } from 'react';

/** Telas abaixo de `md` (768px): as tabelas largas do painel viram cartões. */
export const COMPACT_QUERY = '(max-width: 767.98px)';
/** Abaixo de `lg` (1024px): as tabelas de produtos e de clientes, as mais largas, também viram cartões. */
export const BELOW_LG_QUERY = '(max-width: 1023.98px)';

/** Acompanha uma media query. Sem `matchMedia` (testes, SSR) devolve `false`, o layout de desktop. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener?.('change', onChange);
      return () => mql.removeEventListener?.('change', onChange);
    },
    () =>
      typeof window !== 'undefined' && window.matchMedia
        ? !!window.matchMedia(query)?.matches
        : false,
    () => false
  );
}

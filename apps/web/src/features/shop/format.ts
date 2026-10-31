import { brasiliaParts } from '@hortifruit/core';
import type { Category } from '@hortifruit/schemas';

const pad = (n: number) => String(n).padStart(2, '0');

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** Instante → "02/11" (Brasília). */
export function formatShortDate(instant: string) {
  const p = brasiliaParts(instant);
  return `${pad(p.day)}/${pad(p.month)}`;
}

/** Instante → "02/11, 08:15" (Brasília). */
export function formatShortDateTime(instant: string) {
  const p = brasiliaParts(instant);
  return `${pad(p.day)}/${pad(p.month)}, ${pad(p.hour)}:${pad(p.minute)}`;
}

/** "2026-10-30" → "OUTUBRO 2026". */
export function monthTitle(isoDate: string) {
  const [y, m] = isoDate.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`.toUpperCase();
}

export const CATEGORY_LABEL: Record<Category, string> = {
  LEGUMES: 'Legumes',
  FRUTAS: 'Frutas',
  VERDURAS: 'Verduras',
  OUTROS: 'Outros',
};

export const CATEGORY_ORDER: Category[] = ['LEGUMES', 'FRUTAS', 'VERDURAS', 'OUTROS'];

export const BADGE_LABEL = { DESTAQUE: 'Destaque', NOVO: 'Novo' } as const;

export function orderNumber(n: number) {
  return `#${n}`;
}

export function itemsLabel(n: number) {
  return `${n} ${n === 1 ? 'item' : 'itens'}`;
}

/** Endereço do pedido: "Rua Itu…, 12… · Centro". */
export function addressLine(maskedAddress: string, neighborhood: string | null) {
  return neighborhood ? `${maskedAddress} · ${neighborhood}` : maskedAddress;
}

export function orderLink(token: string) {
  return `${window.location.origin}/pedido/${token}`;
}

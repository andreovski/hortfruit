import { brasiliaParts } from '@hortifruit/core';
import type { Badge, Category } from '@hortifruit/schemas';

export const CATEGORY_LABEL: Record<Category, string> = {
  LEGUMES: 'Legumes',
  FRUTAS: 'Frutas',
  VERDURAS: 'Verduras',
  HORTALICAS: 'Hortaliças',
  OUTROS: 'Outros',
};

export const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

export const BADGE_OPTIONS: { value: '' | NonNullable<Badge>; label: string }[] = [
  { value: '', label: 'Sem selo' },
  { value: 'DESTAQUE', label: 'Destaque' },
  { value: 'NOVO', label: 'Novo' },
];

/** "1 item" / "3 itens". */
export function itemsLabel(n: number) {
  return `${n} ${n === 1 ? 'item' : 'itens'}`;
}

/** "1 pedido" / "3 pedidos". */
export function ordersLabel(n: number) {
  return `${n} ${n === 1 ? 'pedido' : 'pedidos'}`;
}

/** Instante → "02/11/2026" no horário de Brasília. */
export function shortDate(instant: string): string {
  const p = brasiliaParts(instant);
  return `${String(p.day).padStart(2, '0')}/${String(p.month).padStart(2, '0')}/${p.year}`;
}

/** Unidade de venda de um produto (como a quantidade é contada). */
export const UNITS = ['kg', 'saco', 'un', 'caixa', 'maco', 'duzia', 'bandeja'] as const;
export type Unit = (typeof UNITS)[number];

const LABELS: Record<Unit, { one: string; many: string; short: string; name: string }> = {
  kg: { one: 'kg', many: 'kg', short: 'kg', name: 'Quilo' },
  saco: { one: 'saco', many: 'sacos', short: 'saco', name: 'Saco' },
  un: { one: 'un', many: 'un', short: 'un', name: 'Unidade' },
  caixa: { one: 'caixa', many: 'caixas', short: 'caixa', name: 'Caixa' },
  maco: { one: 'maço', many: 'maços', short: 'maço', name: 'Maço' },
  duzia: { one: 'dúzia', many: 'dúzias', short: 'dúzia', name: 'Dúzia' },
  bandeja: { one: 'bandeja', many: 'bandejas', short: 'bandeja', name: 'Bandeja' },
};

/** 10, 'kg' → "10 kg"; 2, 'saco' → "2 sacos". */
export function quantityLabel(quantity: number, unit: Unit): string {
  const l = LABELS[unit];
  return `${quantity} ${quantity === 1 ? l.one : l.many}`;
}

/** Sufixo do preço: "/kg", "/saco". */
export function unitShort(unit: Unit): string {
  return LABELS[unit].short;
}

/** Nome da unidade para listas e selects: "Quilo", "Saco". */
export function unitName(unit: Unit): string {
  return LABELS[unit].name;
}

/** Dinheiro sempre em centavos inteiros. */

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 690 → "R$ 6,90" (com espaço comum, não o NBSP do Intl). */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100).replace(/ /g, ' ');
}

/** "6,90" | "6.90" | "1.234,50" | "R$ 6,9" → centavos; vazio, inválido ou ≤ 0 → null. */
export function parseBRL(input: string): number | null {
  let text = String(input).replace(/R\$|\s/g, '').trim();
  if (!text) return null;
  if (text.includes(',')) {
    text = text.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    text = text.replace(/\./g, '');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const cents = Math.round(Number(text) * 100);
  return cents > 0 ? cents : null;
}

/** 690 → "6,90" (para campos de edição). */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

/** Variação percentual entre dois preços, ou null quando não há anterior. */
export function priceChangePercent(previous: number | null, current: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

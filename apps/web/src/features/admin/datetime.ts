import { brasiliaParts } from '@hortifruit/core';

const pad = (n: number) => String(n).padStart(2, '0');

/** Instante → campos de data e hora no relógio de Brasília ("2026-11-05", "12:00"). */
export function toBrasiliaInputs(instant: string): { date: string; time: string } {
  const p = brasiliaParts(instant);
  return { date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, time: `${pad(p.hour)}:${pad(p.minute)}` };
}

/** Data e hora digitadas (horário de Brasília) → ISO com o fuso: "2026-11-05T12:00:00-03:00". */
export function fromBrasiliaInputs(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  return `${date}T${time}:00-03:00`;
}

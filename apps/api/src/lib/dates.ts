/** "AAAA-MM-DD" → Date à meia-noite UTC (coluna DATE). */
export function toDbDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

/** Coluna DATE → "AAAA-MM-DD". */
export function fromDbDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const iso = (date: Date) => date.toISOString();
export const isoOrNull = (date: Date | null) => (date ? date.toISOString() : null);

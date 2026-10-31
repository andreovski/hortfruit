/**
 * Ciclo semanal (escopo 4): os pedidos fecham na quinta às 12h (horário de Brasília) e a entrega é
 * na sexta. A semana só reabre quando o ADM abre uma nova (publicando a lista).
 *
 * O Brasil não tem horário de verão desde 2019: Brasília é sempre UTC−3, então o fuso é fixo aqui.
 */
export const BRASILIA_OFFSET_MINUTES = -180;
const OFFSET_MS = BRASILIA_OFFSET_MINUTES * 60_000;
const DAY_MS = 86_400_000;

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

type DateLike = Date | string;
const toDate = (d: DateLike) => (typeof d === 'string' ? new Date(d) : d);

/** Partes do relógio de parede de Brasília para um instante. */
export function brasiliaParts(instant: DateLike) {
  const local = new Date(toDate(instant).getTime() + OFFSET_MS);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
    weekday: local.getUTCDay(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "AAAA-MM-DD" de hoje em Brasília. */
export function todayInBrasilia(now: DateLike = new Date()): string {
  const p = brasiliaParts(now);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Instante de um dia ("AAAA-MM-DD") num horário de Brasília. */
export function brasiliaInstant(isoDate: string, hour: number, minute = 0): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hour, minute) - OFFSET_MS);
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + days * DAY_MS);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

function weekdayOf(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Sugestão para abrir uma semana nova: a próxima sexta cujo fechamento (quinta anterior às 12h)
 * ainda não passou.
 */
export function suggestNextWeek(now: DateLike = new Date()): { deliveryDate: string; closesAt: string } {
  const today = todayInBrasilia(now);
  let friday = addDays(today, (5 - weekdayOf(today) + 7) % 7);
  if (friday === today) friday = addDays(friday, 7);
  let closesAt = brasiliaInstant(addDays(friday, -1), 12);
  if (closesAt.getTime() <= toDate(now).getTime()) {
    friday = addDays(friday, 7);
    closesAt = brasiliaInstant(addDays(friday, -1), 12);
  }
  return { deliveryDate: friday, closesAt: closesAt.toISOString() };
}

/** Fechamento padrão de uma entrega: a véspera às 12h. */
export function defaultClosesAt(deliveryDate: string): string {
  return brasiliaInstant(addDays(deliveryDate, -1), 12).toISOString();
}

export interface WeekLike {
  closesAt: DateLike;
  closedAt?: DateLike | null;
}

/** A semana aceita pedidos (e edições/cancelamentos do cliente)? */
export function isWeekOpen(week: WeekLike | null | undefined, now: DateLike = new Date()): boolean {
  if (!week || week.closedAt) return false;
  return toDate(now).getTime() < toDate(week.closesAt).getTime();
}

/** "AAAA-MM-DD" → "sex, 06/11". */
export function formatDeliveryDate(isoDate: string): string {
  const [, m, d] = isoDate.split('-');
  return `${WEEKDAYS[weekdayOf(isoDate)]}, ${d}/${m}`;
}

/** Instante → "qui, 05/11 às 12h" (ou "12h30"). */
export function formatDeadline(instant: DateLike): string {
  const p = brasiliaParts(instant);
  const hour = p.minute ? `${p.hour}h${pad(p.minute)}` : `${p.hour}h`;
  return `${WEEKDAYS[p.weekday]}, ${pad(p.day)}/${pad(p.month)} às ${hour}`;
}

/** Instante → "seg, 02/11 às 08:15". */
export function formatDateTime(instant: DateLike): string {
  const p = brasiliaParts(instant);
  return `${WEEKDAYS[p.weekday]}, ${pad(p.day)}/${pad(p.month)} às ${pad(p.hour)}:${pad(p.minute)}`;
}

/** Tempo que falta: "3 dias e 4 h", "5 h e 20 min", "20 min", ou null se já passou. */
export function timeLeftLabel(until: DateLike, now: DateLike = new Date()): string | null {
  const ms = toDate(until).getTime() - toDate(now).getTime();
  if (ms <= 0) return null;
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  if (days > 0) {
    const d = `${days} ${days === 1 ? 'dia' : 'dias'}`;
    return hours ? `${d} e ${hours} h` : d;
  }
  if (hours > 0) return minutes ? `${hours} h e ${minutes} min` : `${hours} h`;
  return `${Math.max(minutes, 1)} min`;
}

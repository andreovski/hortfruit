import { isWeekOpen } from '@hortifruit/core';
import type { Week as WeekDto } from '@hortifruit/schemas';
import type { Prisma, PrismaClient, Week } from '@prisma/client';

import { clock } from '@/lib/clock';
import { fromDbDate, iso, isoOrNull } from '@/lib/dates';
import { prisma } from '@/lib/prisma';

type Db = PrismaClient | Prisma.TransactionClient;

export function toWeekDto(week: Week, now: Date = clock.now()): WeekDto {
  return {
    id: week.id,
    deliveryDate: fromDbDate(week.deliveryDate),
    closesAt: iso(week.closesAt),
    closedAt: isoOrNull(week.closedAt),
    openedAt: iso(week.openedAt),
    isOpen: isWeekOpen(week, now),
  };
}

/** A semana mais recente (aberta ou não), ou null se nunca houve. */
export function latestWeek(db: Db = prisma) {
  return db.week.findFirst({ orderBy: [{ openedAt: 'desc' }, { closesAt: 'desc' }] });
}

/** A semana aceitando pedidos agora, ou null. Só a mais recente pode estar aberta. */
export async function openWeek(db: Db = prisma, now: Date = clock.now()) {
  const week = await latestWeek(db);
  return week && isWeekOpen(week, now) ? week : null;
}

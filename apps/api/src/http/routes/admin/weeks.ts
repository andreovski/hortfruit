import { suggestNextWeek } from '@hortifruit/core';
import { type CurrentWeekResponse, openWeekBodySchema } from '@hortifruit/schemas';
import type { FastifyInstance } from 'fastify';

import { clock } from '@/lib/clock';
import { toDbDate } from '@/lib/dates';
import { AppError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { latestWeek, openWeek, toWeekDto } from '@/services/weeks';

const NO_OPEN_WEEK = 'Não há semana aberta.';

async function currentWeekResponse(now: Date): Promise<CurrentWeekResponse> {
  const week = await latestWeek();
  return { week: week ? toWeekDto(week, now) : null, suggestion: suggestNextWeek(now) };
}

export async function adminWeeksRoutes(app: FastifyInstance) {
  app.get('/weeks/current', () => currentWeekResponse(clock.now()));

  /** Fecha os pedidos agora, antes da hora marcada. Não reabre: o ADM abre outra ao publicar. */
  app.post('/weeks/current/close', async () => {
    const now = clock.now();
    const week = await openWeek(prisma, now);
    if (!week) throw new AppError(409, NO_OPEN_WEEK);
    await prisma.week.update({ where: { id: week.id }, data: { closedAt: now } });
    return currentWeekResponse(now);
  });

  /** Ajusta a entrega e o fechamento da semana aberta. */
  app.patch('/weeks/current', async (request) => {
    const body = openWeekBodySchema.parse(request.body);
    const now = clock.now();
    const week = await openWeek(prisma, now);
    if (!week) throw new AppError(409, NO_OPEN_WEEK);
    const closesAt = new Date(body.closesAt);
    if (closesAt.getTime() <= now.getTime()) {
      throw new AppError(400, 'O fechamento dos pedidos precisa ser no futuro.');
    }
    await prisma.week.update({
      where: { id: week.id },
      data: { deliveryDate: toDbDate(body.deliveryDate), closesAt },
    });
    return currentWeekResponse(now);
  });
}

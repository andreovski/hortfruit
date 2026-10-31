import { z } from 'zod';

import { isoDateSchema, isoDateTimeSchema } from './common';

/** Uma semana de vendas: entrega na sexta, pedidos até `closesAt`. */
export interface Week {
  id: string;
  deliveryDate: string; // AAAA-MM-DD
  closesAt: string; // ISO
  closedAt: string | null; // fechada à mão pelo ADM antes da hora
  openedAt: string; // ISO
  isOpen: boolean; // calculado na hora da resposta
}

/** Abrir semana nova (o ADM abre; sem isso o app mostra "pedidos fechados"). */
export const openWeekBodySchema = z.object({
  deliveryDate: isoDateSchema,
  closesAt: isoDateTimeSchema,
});
export type OpenWeekBody = z.infer<typeof openWeekBodySchema>;

export interface CurrentWeekResponse {
  /** A semana mais recente (aberta ou não), ou null se nunca houve. */
  week: Week | null;
  /** Sugestão para a próxima semana (próxima sexta, fechando quinta 12h). */
  suggestion: { deliveryDate: string; closesAt: string };
}

import { z } from 'zod';

export interface Settings {
  minOrderCents: number;
  /** Taxa do pedido que não atinge o mínimo. */
  smallOrderFeeCents: number;
  /** O servidor tem UPLOADTHING_TOKEN: o painel mostra o envio de foto. */
  uploadsEnabled: boolean;
  whatsapp: string | null;
}

export const updateSettingsBodySchema = z.object({
  minOrderCents: z.number().int().nonnegative().max(10_000_000).optional(),
  smallOrderFeeCents: z.number().int().nonnegative().max(10_000_000).optional(),
});
export type UpdateSettingsBody = z.infer<typeof updateSettingsBodySchema>;

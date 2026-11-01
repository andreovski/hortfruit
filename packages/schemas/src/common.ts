import { z } from 'zod';

/** Dia sem hora: "2026-11-06". */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (AAAA-MM-DD).');

/** Instante com fuso, como o JSON.stringify de um Date. */
export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const idSchema = z.string().uuid();

/** Telefone como a pessoa digitou; a API normaliza (só dígitos, DDD + número). */
export const phoneInputSchema = z
  .string()
  .trim()
  .min(8, 'Telefone inválido.')
  .max(25, 'Telefone inválido.');

export const centsSchema = z.number().int().nonnegative();
export const positiveCentsSchema = z.number().int().positive('O valor precisa ser maior que zero.');

export const unitSchema = z.enum(['kg', 'saco', 'un', 'caixa', 'maco', 'duzia', 'bandeja']);
export type UnitCode = z.infer<typeof unitSchema>;

export const categorySchema = z.enum(['LEGUMES', 'FRUTAS', 'VERDURAS', 'HORTALICAS', 'OUTROS']);
export type Category = z.infer<typeof categorySchema>;

export const badgeSchema = z.enum(['DESTAQUE', 'NOVO']).nullable();
export type Badge = z.infer<typeof badgeSchema>;

export const orderStatusSchema = z.enum(['NOVO', 'CONFIRMADO', 'ENTREGUE', 'CANCELADO']);
export type OrderStatusCode = z.infer<typeof orderStatusSchema>;

/** Resposta de erro padrão da API: `{ message }` (em português para regras de negócio). */
export interface ApiError {
  message: string;
  code?: string;
}

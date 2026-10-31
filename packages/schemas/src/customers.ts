import { z } from 'zod';

import { phoneInputSchema } from './common';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional();

export const customerBodySchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(120),
  contactName: optionalText(120),
  phone: phoneInputSchema,
  cnpj: optionalText(20),
  email: z
    .string()
    .trim()
    .max(160)
    .transform((v) => (v === '' ? null : v))
    .pipe(z.string().email('E-mail inválido.').nullable())
    .nullable()
    .optional(),
  /** Rua e número (um endereço de entrega por cliente). */
  address: z.string().trim().min(1, 'Informe o endereço de entrega.').max(200),
  neighborhood: optionalText(80),
  city: optionalText(80),
  notes: optionalText(1000),
  active: z.boolean().default(true),
});
export type CustomerBody = z.input<typeof customerBodySchema>;

export const customersQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
});
export type CustomersQuery = z.infer<typeof customersQuerySchema>;

export interface Customer {
  id: string;
  name: string;
  contactName: string | null;
  phone: string; // só dígitos
  cnpj: string | null;
  email: string | null;
  address: string;
  neighborhood: string | null;
  city: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  orderCount: number; // pedidos não cancelados
  lastOrderAt: string | null;
}

export interface CustomersResponse {
  customers: Customer[];
}

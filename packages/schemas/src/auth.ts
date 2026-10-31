import { z } from 'zod';

/** Login do ADM: e-mail OU telefone + senha. */
export const loginBodySchema = z.object({
  login: z.string().trim().min(3, 'Informe e-mail ou telefone.').max(160),
  password: z.string().min(1, 'Informe a senha.').max(200),
});
export type LoginBody = z.infer<typeof loginBodySchema>;

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  createdAt: string;
}

export interface MeResponse {
  admin: AdminUser;
}

export const adminBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome.').max(120),
    email: z
      .string()
      .trim()
      .max(160)
      .transform((v) => (v === '' ? null : v.toLowerCase()))
      .pipe(z.string().email('E-mail inválido.').nullable())
      .nullable()
      .optional(),
    phone: z
      .string()
      .trim()
      .max(25)
      .transform((v) => (v === '' ? null : v))
      .nullable()
      .optional(),
    password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.').max(200),
  })
  .refine((v) => !!v.email || !!v.phone, {
    message: 'Informe e-mail ou telefone.',
    path: ['email'],
  });
export type AdminBody = z.input<typeof adminBodySchema>;

export const updateAdminBodySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email('E-mail inválido.').nullable().optional(),
  phone: z.string().trim().max(25).nullable().optional(),
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.').max(200).optional(),
  active: z.boolean().optional(),
});
export type UpdateAdminBody = z.infer<typeof updateAdminBodySchema>;

export interface AdminsResponse {
  admins: AdminUser[];
}

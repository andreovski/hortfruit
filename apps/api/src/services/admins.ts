import { isValidPhone, normalizePhone } from '@hortifruit/core';
import type { AdminUser } from '@hortifruit/schemas';
import { type Admin, Prisma, type PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { iso } from '@/lib/dates';
import type { OwnerConfig } from '@/lib/env';
import { AppError } from '@/lib/errors';

export const hashPassword = (password: string) => bcrypt.hash(password, 10);

export function toAdminUser(admin: Admin): AdminUser {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
    active: admin.active,
    createdAt: iso(admin.createdAt),
  };
}

/** Telefone do ADM: vazio → null; inválido → 400; senão só dígitos. */
export function adminPhone(input: string | null | undefined): string | null | undefined {
  if (input === undefined) return undefined;
  if (input === null || input.trim() === '') return null;
  if (!isValidPhone(input)) throw new AppError(400, 'Telefone inválido.');
  return normalizePhone(input);
}

/** P2002 (único) de e-mail ou telefone → 409 em português. */
export function adminUniqueError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = String((error.meta?.target as string[] | string | undefined) ?? '');
    if (target.includes('phone')) throw new AppError(409, 'Já existe um ADM com este telefone.');
    throw new AppError(409, 'Já existe um ADM com este e-mail.');
  }
  throw error;
}

/**
 * Primeiro ADM: só cria se ainda não houver nenhum (os outros são cadastrados em Ajustes).
 * Idempotente: roda a cada deploy.
 */
export async function ensureOwner(prisma: PrismaClient, owner: OwnerConfig) {
  const existing = await prisma.admin.findFirst({ orderBy: { createdAt: 'asc' } });
  if (existing) return { admin: existing, created: false };
  const admin = await prisma.admin.create({
    data: {
      name: owner.name,
      email: owner.email?.toLowerCase() || null,
      phone: adminPhone(owner.phone) ?? null,
      passwordHash: await hashPassword(owner.password),
    },
  });
  return { admin, created: true };
}

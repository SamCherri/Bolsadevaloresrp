'use server';

import { prisma } from '@/lib/prisma';
import { createSession, destroySession } from '@/lib/auth';
import { loginSchema, registerSchema } from '@/lib/validation';
import { hash, compare } from 'bcryptjs';
import { redirect } from 'next/navigation';
import { writeAuditLog } from '@/domain/audit';
import { ActionState } from '@/types/action-state';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function normalizeIdentifier(identifier: string) {
  const value = identifier.trim();
  return value.includes('@') ? value.toLowerCase() : value.toLowerCase();
}

export async function registerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const parsed = registerSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: 'Dados inválidos. Verifique os campos.' };

    const email = normalizeEmail(parsed.data.email);
    const username = normalizeUsername(parsed.data.username);

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (exists) return { error: 'Email ou username já cadastrados.' };

    const passwordHash = await hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name.trim(),
        username,
        email,
        passwordHash,
        wallet: { create: {} },
      },
    });

    await writeAuditLog({ actorId: user.id, action: 'REGISTER', entityType: 'User', entityId: user.id });
    await createSession(user.id);
  } catch {
    return { error: 'Erro inesperado ao cadastrar. Tente novamente.' };
  }

  redirect('/dashboard');
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const parsed = loginSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: 'Credenciais inválidas.' };

    const identifier = normalizeIdentifier(parsed.data.identifier);
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) return { error: 'Credenciais inválidas.' };

    const valid = await compare(parsed.data.password, user.passwordHash);
    if (!valid) return { error: 'Credenciais inválidas.' };

    await writeAuditLog({ actorId: user.id, action: 'LOGIN', entityType: 'User', entityId: user.id });
    await createSession(user.id);
  } catch {
    return { error: 'Erro inesperado no login. Tente novamente.' };
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  await destroySession();
  redirect('/login');
}

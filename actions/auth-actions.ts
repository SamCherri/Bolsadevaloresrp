'use server';

import { prisma } from '@/lib/prisma';
import { createSession, destroySession } from '@/lib/auth';
import { loginSchema, registerSchema } from '@/lib/validation';
import { hash, compare } from 'bcryptjs';
import { redirect } from 'next/navigation';
import { writeAuditLog } from '@/domain/audit';
import { ActionState } from '@/types/action-state';
import { headers } from 'next/headers';
import { Prisma } from '@prisma/client';

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;
const MAX_IP_ATTEMPTS = 20;
const IP_WINDOW_MINUTES = 15;
const GENERIC_LOGIN_ERROR = 'Credenciais inválidas.';
const GENERIC_RATE_LIMIT_ERROR = 'Não foi possível autenticar no momento. Tente novamente em alguns minutos.';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

function getValidationErrorMessage(error: { issues: Array<{ message: string }> }) {
  return error.issues[0]?.message || 'Dados inválidos. Verifique os campos.';
}

async function getClientIp() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? 'unknown';
}

async function checkIpThrottle(ip: string) {
  const throttle = await prisma.loginThrottle.findUnique({ where: { ip } });
  if (!throttle) return false;
  return Boolean(throttle.blockedUntil && throttle.blockedUntil > new Date());
}

async function recordIpFailure(ip: string) {
  const now = new Date();
  const throttle = await prisma.loginThrottle.findUnique({ where: { ip } });

  if (!throttle) {
    await prisma.loginThrottle.create({ data: { ip, failedAttempts: 1 } });
    return;
  }

  const inWindow = now.getTime() - throttle.updatedAt.getTime() <= IP_WINDOW_MINUTES * 60 * 1000;
  const nextAttempts = inWindow ? throttle.failedAttempts + 1 : 1;

  await prisma.loginThrottle.update({
    where: { ip },
    data: {
      failedAttempts: nextAttempts,
      blockedUntil: nextAttempts >= MAX_IP_ATTEMPTS ? new Date(now.getTime() + IP_WINDOW_MINUTES * 60 * 1000) : null,
    },
  });
}

async function clearIpFailures(ip: string) {
  await prisma.loginThrottle.upsert({
    where: { ip },
    create: { ip, failedAttempts: 0, blockedUntil: null },
    update: { failedAttempts: 0, blockedUntil: null },
  });
}

export async function registerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const parsed = registerSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: getValidationErrorMessage(parsed.error) };

    const email = normalizeEmail(parsed.data.email);
    const username = normalizeUsername(parsed.data.username);

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true },
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return { error: 'Email ou username já cadastrados.' };
      if (error.code === 'P2022') return { error: 'Banco desatualizado. Execute as migrations antes de cadastrar.' };
    }
    return { error: 'Erro inesperado ao cadastrar. Tente novamente.' };
  }

  redirect('/dashboard');
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const ip = await getClientIp();

  try {
    if (await checkIpThrottle(ip)) {
      return { error: GENERIC_RATE_LIMIT_ERROR };
    }

    const parsed = loginSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      await recordIpFailure(ip);
      return { error: getValidationErrorMessage(parsed.error) };
    }

    const identifier = normalizeIdentifier(parsed.data.identifier);
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      await recordIpFailure(ip);
      return { error: GENERIC_LOGIN_ERROR };
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await recordIpFailure(ip);
      return { error: GENERIC_RATE_LIMIT_ERROR };
    }

    const valid = await compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      const nextAttempts = user.failedLoginAttempts + 1;
      const lockUntil = nextAttempts >= MAX_LOGIN_ATTEMPTS
        ? new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000)
        : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: nextAttempts >= MAX_LOGIN_ATTEMPTS ? 0 : nextAttempts,
          lockedUntil: lockUntil,
        },
      });

      await recordIpFailure(ip);
      await writeAuditLog({
        actorId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        metadata: { ip, remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - nextAttempts) },
      });
      return { error: GENERIC_LOGIN_ERROR };
    }

    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
    await clearIpFailures(ip);
    await writeAuditLog({ actorId: user.id, action: 'LOGIN', entityType: 'User', entityId: user.id, metadata: { ip } });
    await createSession(user.id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2022') {
      return { error: 'Banco desatualizado. Execute as migrations antes de logar.' };
    }
    return { error: 'Erro inesperado no login. Tente novamente.' };
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  await destroySession();
  redirect('/login');
}

import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'crypto';
import { prisma } from './prisma';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';

const SESSION_COOKIE = 'bvrp_session';
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function isValidSessionCookieFormat(token?: string) {
  return Boolean(token && /^[a-f0-9]{64}$/i.test(token));
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  const hashedToken = hashToken(token as string);
  const expiresAt = new Date(Date.now() + THIRTY_DAYS * 1000);

  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } }),
    prisma.session.create({ data: { token: hashedToken, userId, expiresAt } }),
  ]);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: THIRTY_DAYS,
    path: '/',
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token && isValidSessionCookieFormat(token)) {
    await prisma.session.deleteMany({ where: { token: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!isValidSessionCookieFormat(token)) {
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  const hashedToken = hashToken(token as string);
  const session = await prisma.session.findUnique({ where: { token: hashedToken }, include: { user: true } });

  if (!session) {
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect('/dashboard');
  return user;
}

import { prisma } from '@/lib/prisma';

export async function getUserExchangeOperations(userId: string, take = 20) {
  return prisma.exchangeOperation.findMany({
    where: {
      userId,
      OR: [{ status: { not: 'PENDING' } }, { expiresAt: { gte: new Date() } }],
    },
    orderBy: { createdAt: 'desc' },
    take,
  });
}

export async function getCollaboratorExchangeOperations() {
  return prisma.exchangeOperation.findMany({
    where: {
      OR: [{ status: { not: 'PENDING' } }, { expiresAt: { gte: new Date() } }],
    },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
}

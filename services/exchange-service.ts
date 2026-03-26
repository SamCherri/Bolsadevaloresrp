import { prisma } from '@/lib/prisma';
import { expirePendingExchangeOperations } from '@/domain/exchange';

export async function getUserExchangeOperations(userId: string, take = 20) {
  await expirePendingExchangeOperations();
  return prisma.exchangeOperation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take,
  });
}

export async function getCollaboratorExchangeOperations() {
  await expirePendingExchangeOperations();
  return prisma.exchangeOperation.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
}

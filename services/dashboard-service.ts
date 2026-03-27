import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function getDashboardData(userId: string, role: UserRole) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      holdings: { include: { asset: true } },
      orders: { take: 5, orderBy: { createdAt: 'desc' }, include: { asset: true } },
      user: { include: { exchangeOps: { take: 5, orderBy: { createdAt: 'desc' } } } },
    },
  });

  const highlightedAssets = await prisma.asset.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ currentPrice: 'desc' }],
    take: 5,
  });

  const pendingExchange = (role === UserRole.ADMIN || role === UserRole.COLLABORATOR)
    ? await prisma.exchangeOperation.count({ where: { status: 'PENDING', expiresAt: { gte: new Date() } } })
    : await prisma.exchangeOperation.count({ where: { status: 'PENDING', userId, expiresAt: { gte: new Date() } } });

  return { wallet, highlightedAssets, pendingExchange, isGlobalPendingMetric: role === UserRole.ADMIN || role === UserRole.COLLABORATOR };
}

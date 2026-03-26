import { prisma } from '@/lib/prisma';
import { expirePendingExchangeOperations } from '@/domain/exchange';

export async function getDashboardData(userId: string) {
  await expirePendingExchangeOperations();

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

  const pendingExchange = await prisma.exchangeOperation.count({ where: { status: 'PENDING' } });

  return { wallet, highlightedAssets, pendingExchange };
}

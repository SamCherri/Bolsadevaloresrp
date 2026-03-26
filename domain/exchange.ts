import { prisma } from '@/lib/prisma';

export async function expirePendingExchangeOperations() {
  const now = new Date();

  const ops = await prisma.exchangeOperation.findMany({
    where: { status: 'PENDING', expiresAt: { lt: now } },
  });

  for (const op of ops) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.exchangeOperation.findUnique({ where: { id: op.id } });
      if (!current || current.status !== 'PENDING') return;

      if (current.type === 'WITHDRAW' && Number(current.reservedAmount) > 0) {
        await tx.wallet.update({
          where: { id: current.walletId },
          data: {
            reservedBalance: { decrement: current.reservedAmount },
            balance: { increment: current.reservedAmount },
          },
        });
      }

      await tx.exchangeOperation.update({
        where: { id: current.id },
        data: { status: 'EXPIRED', processedAt: now, wasRefunded: current.type === 'WITHDRAW' },
      });

      await tx.auditLog.create({
        data: {
          actorId: current.userId,
          action: current.type === 'DEPOSIT' ? 'EXCHANGE_DEPOSIT_EXPIRED' : 'EXCHANGE_WITHDRAW_EXPIRED',
          entityType: 'ExchangeOperation',
          entityId: current.id,
        },
      });
    });
  }
}

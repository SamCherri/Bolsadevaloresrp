'use server';

import { prisma } from '@/lib/prisma';
import { orderSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { OrderStatus, OrderType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { ActionState } from '@/types/action-state';

export async function createOrderAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = orderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Ordem inválida.' };

  const asset = await prisma.asset.findUnique({ where: { id: parsed.data.assetId } });
  if (!asset || asset.status !== 'ACTIVE') return { error: 'Ativo não está ativo para negociação.' };

  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet) return { error: 'Carteira não encontrada.' };

  const qty = parsed.data.quantity;
  const totalValue = Number(asset.currentPrice) * qty;
  const reserveAmount = totalValue * (Number(asset.reservePercent) / 100);

  try {
    await prisma.$transaction(async (tx) => {
      const freshAsset = await tx.asset.findUnique({ where: { id: asset.id } });
      if (!freshAsset || freshAsset.status !== 'ACTIVE') throw new Error('Ativo indisponível.');

      if (parsed.data.type === OrderType.BUY) {
        const availableSupply = freshAsset.totalSupply - freshAsset.circulatingSupply;
        if (availableSupply < qty) throw new Error('Sem supply disponível para compra.');

        const walletUpdated = await tx.wallet.updateMany({
          where: { id: wallet.id, balance: { gte: totalValue } },
          data: { balance: { decrement: totalValue } },
        });
        if (walletUpdated.count === 0) throw new Error('Saldo insuficiente.');

        const holding = await tx.holding.findUnique({ where: { walletId_assetId: { walletId: wallet.id, assetId: asset.id } } });
        const newQty = (holding?.quantity ?? 0) + qty;
        const avg = holding ? ((Number(holding.averagePrice) * holding.quantity) + totalValue) / newQty : Number(freshAsset.currentPrice);

        await tx.holding.upsert({
          where: { walletId_assetId: { walletId: wallet.id, assetId: asset.id } },
          update: { quantity: newQty, averagePrice: avg },
          create: { walletId: wallet.id, assetId: asset.id, quantity: qty, averagePrice: freshAsset.currentPrice },
        });

        const order = await tx.order.create({
          data: {
            userId: user.id,
            walletId: wallet.id,
            assetId: asset.id,
            type: OrderType.BUY,
            quantity: qty,
            unitPrice: freshAsset.currentPrice,
            totalValue,
            status: OrderStatus.EXECUTED,
          },
        });

        await tx.trade.create({ data: { assetId: asset.id, orderId: order.id, quantity: qty, price: freshAsset.currentPrice, value: totalValue } });

        await tx.asset.update({
          where: { id: asset.id },
          data: {
            circulatingSupply: { increment: qty },
            currentPrice: Number(freshAsset.currentPrice) * 1.002,
            reserveFundValue: { increment: reserveAmount },
          },
        });

        await tx.candle.upsert({
          where: { assetId_timeframe_timestamp: { assetId: asset.id, timeframe: 'M1', timestamp: new Date(Math.floor(Date.now()/60000)*60000) } },
          update: {
            high: { set: Math.max(Number(freshAsset.currentPrice), Number(freshAsset.currentPrice) * 1.002) },
            low: { set: Number(freshAsset.currentPrice) },
            close: Number(freshAsset.currentPrice) * 1.002,
            volume: { increment: totalValue },
          },
          create: {
            assetId: asset.id,
            timeframe: 'M1',
            timestamp: new Date(Math.floor(Date.now()/60000)*60000),
            open: freshAsset.currentPrice,
            high: Number(freshAsset.currentPrice) * 1.002,
            low: freshAsset.currentPrice,
            close: Number(freshAsset.currentPrice) * 1.002,
            volume: totalValue,
          },
        });

        await tx.auditLog.createMany({ data: [
          { actorId: user.id, action: 'ORDER_BUY_CREATED', entityType: 'Order' },
          { actorId: user.id, action: 'ORDER_BUY_EXECUTED', entityType: 'Order' },
          { actorId: user.id, action: 'WALLET_ADJUSTED', entityType: 'Wallet', entityId: wallet.id, metadata: { delta: -totalValue } },
        ]});
      } else {
        const holding = await tx.holding.findUnique({ where: { walletId_assetId: { walletId: wallet.id, assetId: asset.id } } });
        if (!holding || holding.quantity < qty) throw new Error('Holding insuficiente para venda.');

        const remaining = holding.quantity - qty;
        if (remaining === 0) {
          await tx.holding.delete({ where: { walletId_assetId: { walletId: wallet.id, assetId: asset.id } } });
        } else {
          await tx.holding.update({ where: { walletId_assetId: { walletId: wallet.id, assetId: asset.id } }, data: { quantity: remaining } });
        }

        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: totalValue } } });

        const order = await tx.order.create({
          data: {
            userId: user.id,
            walletId: wallet.id,
            assetId: asset.id,
            type: OrderType.SELL,
            quantity: qty,
            unitPrice: freshAsset.currentPrice,
            totalValue,
            status: OrderStatus.EXECUTED,
          },
        });

        await tx.trade.create({ data: { assetId: asset.id, orderId: order.id, quantity: qty, price: freshAsset.currentPrice, value: totalValue } });

        await tx.asset.update({
          where: { id: asset.id },
          data: {
            circulatingSupply: { decrement: qty },
            currentPrice: Number(freshAsset.currentPrice) * 0.998,
          },
        });

        await tx.candle.upsert({
          where: { assetId_timeframe_timestamp: { assetId: asset.id, timeframe: 'M1', timestamp: new Date(Math.floor(Date.now()/60000)*60000) } },
          update: {
            high: { set: Number(freshAsset.currentPrice) },
            low: { set: Math.min(Number(freshAsset.currentPrice), Number(freshAsset.currentPrice) * 0.998) },
            close: Number(freshAsset.currentPrice) * 0.998,
            volume: { increment: totalValue },
          },
          create: {
            assetId: asset.id,
            timeframe: 'M1',
            timestamp: new Date(Math.floor(Date.now()/60000)*60000),
            open: freshAsset.currentPrice,
            high: freshAsset.currentPrice,
            low: Number(freshAsset.currentPrice) * 0.998,
            close: Number(freshAsset.currentPrice) * 0.998,
            volume: totalValue,
          },
        });

        await tx.auditLog.createMany({ data: [
          { actorId: user.id, action: 'ORDER_SELL_CREATED', entityType: 'Order' },
          { actorId: user.id, action: 'ORDER_SELL_EXECUTED', entityType: 'Order' },
          { actorId: user.id, action: 'WALLET_ADJUSTED', entityType: 'Wallet', entityId: wallet.id, metadata: { delta: totalValue } },
        ]});
      }
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Falha ao executar ordem.' };
  }

  revalidatePath('/portfolio');
  revalidatePath('/dashboard');
  revalidatePath(`/assets/${asset.id}`);
  return { success: 'Ordem executada com sucesso.' };
}

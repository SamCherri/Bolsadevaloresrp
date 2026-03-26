'use server';

import { prisma } from '@/lib/prisma';
import { orderSchema } from '@/lib/validation';
import { requireRole } from '@/lib/auth';
import { OrderStatus, OrderType, Prisma, UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { ActionState } from '@/types/action-state';
import {
  calculateOrderTotals,
  getCurrentMinuteBucket,
  validateBuyOrder,
  validateSellOrder,
} from '@/domain/trading-rules';
import { decimal, maxDecimal, minDecimal, money } from '@/lib/money';

const TRADING_ROLES: UserRole[] = [UserRole.INVESTOR, UserRole.ISSUER, UserRole.ADMIN];
const BUY_MULTIPLIER = new Prisma.Decimal('1.002');
const SELL_MULTIPLIER = new Prisma.Decimal('0.998');

export async function createOrderAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(TRADING_ROLES);
  const parsed = orderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Ordem inválida.' };

  const asset = await prisma.asset.findUnique({ where: { id: parsed.data.assetId } });
  if (!asset || asset.status !== 'ACTIVE') return { error: 'Ativo não está ativo para negociação.' };

  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet) return { error: 'Carteira não encontrada.' };

  const qty = parsed.data.quantity;

  try {
    await prisma.$transaction(async (tx) => {
      const freshAsset = await tx.asset.findUnique({ where: { id: asset.id } });
      if (!freshAsset || freshAsset.status !== 'ACTIVE') throw new Error('Ativo indisponível.');
      const freshWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
      if (!freshWallet) throw new Error('Carteira não encontrada.');

      const { totalValue, reserveAmount } = calculateOrderTotals({
        quantity: qty,
        unitPrice: freshAsset.currentPrice,
        reservePercent: freshAsset.reservePercent,
      });
      const candleTimestamp = getCurrentMinuteBucket();

      if (parsed.data.type === OrderType.BUY) {
        const availableSupply = freshAsset.totalSupply - freshAsset.circulatingSupply;
        const buyValidation = validateBuyOrder({
          availableSupply,
          quantity: qty,
          walletBalance: freshWallet.balance,
          unitPrice: freshAsset.currentPrice,
        });
        if ('error' in buyValidation) throw new Error(buyValidation.error);

        const walletUpdated = await tx.wallet.updateMany({
          where: { id: wallet.id, balance: { gte: totalValue } },
          data: { balance: { decrement: totalValue } },
        });
        if (walletUpdated.count === 0) throw new Error('Saldo insuficiente.');

        const holding = await tx.holding.findUnique({ where: { walletId_assetId: { walletId: wallet.id, assetId: asset.id } } });
        const newQty = (holding?.quantity ?? 0) + qty;
        const avg = holding
          ? money(holding.averagePrice.mul(holding.quantity).add(totalValue).div(newQty))
          : freshAsset.currentPrice;

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

        const nextPrice = money(freshAsset.currentPrice.mul(BUY_MULTIPLIER));
        await tx.asset.update({
          where: { id: asset.id },
          data: {
            circulatingSupply: { increment: qty },
            currentPrice: nextPrice,
            // Regra econômica: reserveFundValue representa parte do valor pago em BUY
            // realocada para reserva contábil do ativo (não é criação monetária).
            reserveFundValue: { increment: reserveAmount },
          },
        });

        const currentCandle = await tx.candle.findUnique({
          where: { assetId_timeframe_timestamp: { assetId: asset.id, timeframe: 'M1', timestamp: candleTimestamp } },
        });
        if (!currentCandle) {
          await tx.candle.create({
            data: {
              assetId: asset.id,
              timeframe: 'M1',
              timestamp: candleTimestamp,
              open: freshAsset.currentPrice,
              high: maxDecimal(freshAsset.currentPrice, nextPrice),
              low: minDecimal(freshAsset.currentPrice, nextPrice),
              close: nextPrice,
              volume: decimal(qty),
            },
          });
        } else {
          await tx.candle.update({
            where: { id: currentCandle.id },
            data: {
              high: maxDecimal(currentCandle.high, nextPrice),
              low: minDecimal(currentCandle.low, nextPrice),
              close: nextPrice,
              volume: money(currentCandle.volume.add(qty)),
            },
          });
        }

        await tx.auditLog.createMany({ data: [
          { actorId: user.id, action: 'ORDER_BUY_CREATED', entityType: 'Order' },
          { actorId: user.id, action: 'ORDER_BUY_EXECUTED', entityType: 'Order' },
          { actorId: user.id, action: 'WALLET_ADJUSTED', entityType: 'Wallet', entityId: wallet.id, metadata: { delta: totalValue.toString() } },
          { actorId: user.id, action: 'ASSET_RESERVE_ALLOCATED', entityType: 'Asset', entityId: asset.id, metadata: { reserveAmount: reserveAmount.toString() } },
        ]});
      } else {
        const holding = await tx.holding.findUnique({ where: { walletId_assetId: { walletId: wallet.id, assetId: asset.id } } });
        const sellValidation = validateSellOrder({
          holdingQuantity: holding?.quantity ?? 0,
          quantity: qty,
          circulatingSupply: freshAsset.circulatingSupply,
        });
        if ('error' in sellValidation) throw new Error(sellValidation.error);

        const remaining = (holding?.quantity ?? 0) - qty;
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

        const nextPrice = money(freshAsset.currentPrice.mul(SELL_MULTIPLIER));
        await tx.asset.update({
          where: { id: asset.id },
          data: {
            circulatingSupply: { decrement: qty },
            currentPrice: nextPrice,
          },
        });

        const currentCandle = await tx.candle.findUnique({
          where: { assetId_timeframe_timestamp: { assetId: asset.id, timeframe: 'M1', timestamp: candleTimestamp } },
        });
        if (!currentCandle) {
          await tx.candle.create({
            data: {
              assetId: asset.id,
              timeframe: 'M1',
              timestamp: candleTimestamp,
              open: freshAsset.currentPrice,
              high: maxDecimal(freshAsset.currentPrice, nextPrice),
              low: minDecimal(freshAsset.currentPrice, nextPrice),
              close: nextPrice,
              volume: decimal(qty),
            },
          });
        } else {
          await tx.candle.update({
            where: { id: currentCandle.id },
            data: {
              high: maxDecimal(currentCandle.high, nextPrice),
              low: minDecimal(currentCandle.low, nextPrice),
              close: nextPrice,
              volume: money(currentCandle.volume.add(qty)),
            },
          });
        }

        await tx.auditLog.createMany({ data: [
          { actorId: user.id, action: 'ORDER_SELL_CREATED', entityType: 'Order' },
          { actorId: user.id, action: 'ORDER_SELL_EXECUTED', entityType: 'Order' },
          { actorId: user.id, action: 'WALLET_ADJUSTED', entityType: 'Wallet', entityId: wallet.id, metadata: { delta: totalValue.toString() } },
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

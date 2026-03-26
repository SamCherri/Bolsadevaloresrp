'use server';

import { requireRole, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exchangeSchema } from '@/lib/validation';
import { ExchangeStatus, ExchangeType, UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { expirePendingExchangeOperations } from '@/domain/exchange';
import { ActionState } from '@/types/action-state';
import { money, rate } from '@/lib/money';

export async function createExchangeOperationAction(formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const parsed = exchangeSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: 'Dados de câmbio inválidos.' };

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) return { error: 'Carteira não encontrada.' };

    const amountGameCurrency = money(parsed.data.amountGameCurrency);
    const exchangeRate = rate(parsed.data.exchangeRate);
    const platformAmount = money(amountGameCurrency.mul(exchangeRate));
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      if (parsed.data.type === ExchangeType.WITHDRAW) {
        const updated = await tx.wallet.updateMany({
          where: { id: wallet.id, balance: { gte: platformAmount } },
          data: {
            balance: { decrement: platformAmount },
            reservedBalance: { increment: platformAmount },
          },
        });
        if (updated.count === 0) throw new Error('Saldo insuficiente para saque.');
      }

      const op = await tx.exchangeOperation.create({
        data: {
          type: parsed.data.type,
          userId: user.id,
          walletId: wallet.id,
          amountGameCurrency,
          amountPlatformCurrency: platformAmount,
          exchangeRate,
          reservedAmount: parsed.data.type === ExchangeType.WITHDRAW ? platformAmount : money(0),
          status: ExchangeStatus.PENDING,
          expiresAt,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: parsed.data.type === ExchangeType.DEPOSIT ? 'EXCHANGE_DEPOSIT_CREATED' : 'EXCHANGE_WITHDRAW_CREATED',
          entityType: 'ExchangeOperation',
          entityId: op.id,
        },
      });
    });

    revalidatePath('/exchange');
    revalidatePath('/portfolio');
    revalidatePath('/collaborator');
    return { success: 'Operação de câmbio criada.' };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: 'Falha ao criar operação de câmbio.' };
  }
}

export async function processExchangeOperationAction(operationId: string, approve: boolean, notes?: string): Promise<ActionState> {
  try {
    const collaborator = await requireRole([UserRole.COLLABORATOR, UserRole.ADMIN]);
    if (!operationId) return { error: 'Operação inválida.' };
    await expirePendingExchangeOperations();

    await prisma.$transaction(async (tx) => {
      const op = await tx.exchangeOperation.findUnique({ where: { id: operationId } });
      if (!op || op.status !== 'PENDING') throw new Error('Operação não encontrada ou já processada.');

      if (op.expiresAt < new Date()) {
        if (op.type === ExchangeType.WITHDRAW && op.reservedAmount.greaterThan(0)) {
          const walletUpdated = await tx.wallet.updateMany({
            where: { id: op.walletId, reservedBalance: { gte: op.reservedAmount } },
            data: { reservedBalance: { decrement: op.reservedAmount }, balance: { increment: op.reservedAmount } },
          });
          if (walletUpdated.count === 0) throw new Error('Saldo reservado inconsistente para expiração.');
        }
        await tx.exchangeOperation.update({
          where: { id: op.id },
          data: { status: 'EXPIRED', processedAt: new Date(), collaboratorId: collaborator.id, notes, wasRefunded: op.type === 'WITHDRAW' },
        });
        await tx.auditLog.create({
          data: { actorId: collaborator.id, action: op.type === 'DEPOSIT' ? 'EXCHANGE_DEPOSIT_EXPIRED' : 'EXCHANGE_WITHDRAW_EXPIRED', entityType: 'ExchangeOperation', entityId: op.id },
        });
        return;
      }

      if (approve) {
        if (op.type === ExchangeType.DEPOSIT) {
          await tx.wallet.update({ where: { id: op.walletId }, data: { balance: { increment: op.amountPlatformCurrency } } });
        } else {
          const walletUpdated = await tx.wallet.updateMany({
            where: { id: op.walletId, reservedBalance: { gte: op.reservedAmount } },
            data: { reservedBalance: { decrement: op.reservedAmount } },
          });
          if (walletUpdated.count === 0) throw new Error('Saldo reservado inconsistente para aprovação.');
        }

        await tx.exchangeOperation.update({
          where: { id: op.id },
          data: { status: 'APPROVED', processedAt: new Date(), collaboratorId: collaborator.id, notes },
        });

        await tx.auditLog.create({
          data: {
            actorId: collaborator.id,
            action: op.type === 'DEPOSIT' ? 'EXCHANGE_DEPOSIT_APPROVED' : 'EXCHANGE_WITHDRAW_APPROVED',
            entityType: 'ExchangeOperation',
            entityId: op.id,
          },
        });
        await tx.auditLog.create({
          data: { actorId: collaborator.id, action: 'WALLET_ADJUSTED', entityType: 'Wallet', entityId: op.walletId, metadata: { amount: op.amountPlatformCurrency.toString(), type: op.type } },
        });
        return;
      }

      if (op.type === ExchangeType.WITHDRAW && op.reservedAmount.greaterThan(0)) {
        const walletUpdated = await tx.wallet.updateMany({
          where: { id: op.walletId, reservedBalance: { gte: op.reservedAmount } },
          data: {
            reservedBalance: { decrement: op.reservedAmount },
            balance: { increment: op.reservedAmount },
          },
        });
        if (walletUpdated.count === 0) throw new Error('Saldo reservado inconsistente para rejeição.');
      }

      await tx.exchangeOperation.update({
        where: { id: op.id },
        data: {
          status: 'REJECTED',
          processedAt: new Date(),
          collaboratorId: collaborator.id,
          notes,
          wasRefunded: op.type === 'WITHDRAW',
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: collaborator.id,
          action: op.type === 'DEPOSIT' ? 'EXCHANGE_DEPOSIT_REJECTED' : 'EXCHANGE_WITHDRAW_REJECTED',
          entityType: 'ExchangeOperation',
          entityId: op.id,
        },
      });
    });

    revalidatePath('/exchange');
    revalidatePath('/portfolio');
    revalidatePath('/collaborator');
    revalidatePath('/dashboard');
    return { success: 'Operação processada.' };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: 'Falha ao processar operação.' };
  }
}



export async function runExchangeExpirationAction(): Promise<ActionState> {
  try {
    await requireRole([UserRole.COLLABORATOR, UserRole.ADMIN]);
    const expiredCount = await expirePendingExchangeOperations();
    revalidatePath('/collaborator');
    revalidatePath('/exchange');
    revalidatePath('/dashboard');
    return { success: `Rotina executada. Operações expiradas: ${expiredCount}.` };
  } catch {
    return { error: 'Falha ao executar rotina de expiração.' };
  }
}

export async function createExchangeOperationFormAction(_: ActionState, formData: FormData): Promise<ActionState> {
  return createExchangeOperationAction(formData);
}

export async function processExchangeOperationFormAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const operationId = String(formData.get('operationId') ?? '');
  const approve = String(formData.get('approve') ?? 'false') === 'true';
  const notes = String(formData.get('notes') ?? '').trim();
  if (!operationId) return { error: 'Operação inválida.' };
  return processExchangeOperationAction(operationId, approve, notes || undefined);
}

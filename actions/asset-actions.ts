'use server';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assetRequestSchema } from '@/lib/validation';
import { AssetStatus, Prisma, UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { writeAuditLog } from '@/domain/audit';
import { ActionState } from '@/types/action-state';

export async function createAssetRequestAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireRole([UserRole.ISSUER, UserRole.ADMIN]);
    const parsed = assetRequestSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: 'Dados inválidos para criação de ativo.' };

    const ticker = parsed.data.ticker.trim().toUpperCase();
    const existing = await prisma.asset.findUnique({ where: { ticker } });
    if (existing) return { error: `Ticker ${ticker} já está em uso.` };

    const asset = await prisma.asset.create({
      data: {
        ticker,
        name: parsed.data.name.trim(),
        description: parsed.data.description.trim(),
        issuerId: user.id,
        initialPrice: parsed.data.initialPrice,
        currentPrice: parsed.data.initialPrice,
        totalSupply: parsed.data.quantity,
        circulatingSupply: 0,
        feePercent: parsed.data.feePercent,
        reservePercent: parsed.data.reservePercent,
        fundPurpose: parsed.data.fundPurpose.trim(),
        status: AssetStatus.PENDING_APPROVAL,
        approvals: { create: {} },
      },
    });

    await writeAuditLog({ actorId: user.id, action: 'ASSET_CREATED', entityType: 'Asset', entityId: asset.id });
    revalidatePath('/admin');
    revalidatePath('/market');
    return { success: 'Solicitação enviada para aprovação.' };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'Ticker já existe. Escolha outro.' };
    }
    return { error: 'Falha ao criar solicitação de ativo.' };
  }
}

export async function reviewAssetAction(assetId: string, approved: boolean, notes?: string): Promise<ActionState> {
  try {
    const admin = await requireRole([UserRole.ADMIN]);

    const current = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!current) return { error: 'Ativo não encontrado.' };
    if (current.status !== AssetStatus.PENDING_APPROVAL) {
      return { error: `Ativo está em status ${current.status} e não pode ser revisado novamente.` };
    }

    const asset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        status: approved ? AssetStatus.ACTIVE : AssetStatus.REJECTED,
        approvals: {
          create: {
            adminId: admin.id,
            approved,
            notes,
            reviewedAt: new Date(),
          },
        },
      },
    });

    await writeAuditLog({
      actorId: admin.id,
      action: approved ? 'ASSET_APPROVED' : 'ASSET_REJECTED',
      entityType: 'Asset',
      entityId: asset.id,
      metadata: { notes },
    });

    revalidatePath('/admin');
    revalidatePath('/assets');
    revalidatePath('/market');
    return { success: approved ? 'Ativo aprovado.' : 'Ativo rejeitado.' };
  } catch {
    return { error: 'Falha ao revisar ativo.' };
  }
}

export async function freezeAssetAction(assetId: string): Promise<ActionState> {
  try {
    const admin = await requireRole([UserRole.ADMIN]);
    const current = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!current) return { error: 'Ativo não encontrado.' };
    if (current.status === AssetStatus.FROZEN) return { error: 'Ativo já está congelado.' };

    await prisma.asset.update({ where: { id: assetId }, data: { status: AssetStatus.FROZEN } });
    await writeAuditLog({ actorId: admin.id, action: 'ASSET_FROZEN', entityType: 'Asset', entityId: assetId });
    revalidatePath('/admin');
    revalidatePath('/market');
    return { success: 'Ativo congelado.' };
  } catch {
    return { error: 'Falha ao congelar ativo.' };
  }
}


export async function reviewAssetFormAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const assetId = String(formData.get('assetId') ?? '');
  const decision = String(formData.get('decision') ?? '');
  const notes = String(formData.get('notes') ?? '').trim();

  if (!assetId) return { error: 'Ativo inválido.' };
  if (!['approve', 'reject'].includes(decision)) return { error: 'Decisão inválida.' };

  return reviewAssetAction(assetId, decision === 'approve', notes || undefined);
}

export async function freezeAssetFormAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const assetId = String(formData.get('assetId') ?? '');
  if (!assetId) return { error: 'Ativo inválido.' };
  return freezeAssetAction(assetId);
}

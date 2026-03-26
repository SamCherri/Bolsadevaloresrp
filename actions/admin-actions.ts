'use server';

import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { ActionState } from '@/types/action-state';

export async function updateUserRoleAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const admin = await requireRole([UserRole.ADMIN]);
    const userId = String(formData.get('userId') ?? '');
    const role = String(formData.get('role') ?? '') as UserRole;

    if (!userId) return { error: 'Usuário inválido.' };
    if (!['INVESTOR', 'ISSUER', 'COLLABORATOR', 'ADMIN'].includes(role)) return { error: 'Role inválida.' };

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return { error: 'Usuário não encontrado.' };

    if (target.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
      const totalAdmins = await prisma.user.count({ where: { role: UserRole.ADMIN } });
      if (totalAdmins <= 1) {
        return { error: 'Não é permitido remover o último ADMIN do sistema.' };
      }
    }

    await prisma.user.update({ where: { id: userId }, data: { role } });
    await prisma.auditLog.create({
      data: { actorId: admin.id, action: 'ROLE_CHANGED', entityType: 'User', entityId: userId, metadata: { from: target.role, to: role } },
    });
    revalidatePath('/admin');
    return { success: 'Role atualizada.' };
  } catch {
    return { error: 'Falha ao atualizar role.' };
  }
}

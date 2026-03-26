import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function writeAuditLog(input: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const data: Prisma.AuditLogUncheckedCreateInput = {
    action: input.action,
    entityType: input.entityType,
    actorId: input.actorId,
    entityId: input.entityId,
    metadata: input.metadata as Prisma.InputJsonValue | undefined,
  };

  await prisma.auditLog.create({ data });
}

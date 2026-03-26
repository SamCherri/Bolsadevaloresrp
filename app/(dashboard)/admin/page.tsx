import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { StatusBadge } from '@/components/ui/status-badge';
import { AdminUserRoleForm } from '@/components/forms/admin-user-role-form';
import { AdminAssetDecisionForm } from '@/components/forms/admin-asset-decision-form';

export default async function AdminPage() {
  await requireRole([UserRole.ADMIN]);
  const pendingAssets = await prisma.asset.findMany({ where: { status: 'PENDING_APPROVAL' }, include: { issuer: true } });
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  const auditLogs = await prisma.auditLog.findMany({ take: 30, orderBy: { createdAt: 'desc' }, include: { actor: true } });
  const exchanges = await prisma.exchangeOperation.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { user: true, collaborator: true } });

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-xl font-semibold mb-3">Aprovação de ativos</h2>
        {pendingAssets.map((asset) => (
          <div key={asset.id} className="border border-border rounded-lg p-3 mb-2 space-y-2">
            <p>{asset.ticker} - {asset.name} ({asset.issuer.username})</p>
            <div className="grid md:grid-cols-3 gap-2">
              <AdminAssetDecisionForm assetId={asset.id} mode="approve" />
              <AdminAssetDecisionForm assetId={asset.id} mode="reject" />
              <AdminAssetDecisionForm assetId={asset.id} mode="freeze" />
            </div>
          </div>
        ))}
      </section>

      <section className="card">
        <h2 className="text-xl font-semibold mb-3">Gestão de usuários</h2>
        {users.map((u) => (
          <AdminUserRoleForm key={u.id} userId={u.id} username={u.username} email={u.email} currentRole={u.role} />
        ))}
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card"><h3 className="font-semibold mb-2">Câmbio recente</h3>{exchanges.map((e) => <p key={e.id} className="text-sm border-b border-border py-1">{e.user.username} {e.type} <StatusBadge value={e.status} /></p>)}</div>
        <div className="card"><h3 className="font-semibold mb-2">Auditoria</h3>{auditLogs.map((log) => <p key={log.id} className="text-sm border-b border-border py-1">{log.action} · {log.actor?.username ?? 'system'}</p>)}</div>
      </section>
    </div>
  );
}

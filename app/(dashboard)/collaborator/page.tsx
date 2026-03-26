import { requireRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { StatusBadge } from '@/components/ui/status-badge';
import { getCollaboratorExchangeOperations } from '@/services/exchange-service';
import { CollaboratorOperationForm } from '@/components/forms/collaborator-operation-form';
import { ExpireExchangeForm } from '@/components/forms/expire-exchange-form';

export default async function CollaboratorPage() {
  await requireRole([UserRole.COLLABORATOR, UserRole.ADMIN]);
  const operations = await getCollaboratorExchangeOperations();

  return (
    <section className="card space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <h2 className="text-xl font-semibold">Painel do Colaborador (Câmbio Manual)</h2>
        <ExpireExchangeForm />
      </div>

      <div className="space-y-3">
        {operations.map((op) => (
          <div key={op.id} className="border border-border rounded-lg p-3 text-sm space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
              <p className="break-words">{op.user.username} · {op.type} · Taxa {Number(op.exchangeRate).toFixed(4)}</p>
              <StatusBadge value={op.status} />
            </div>
            <p className="break-words">Jogo: {Number(op.amountGameCurrency).toFixed(2)} | Plataforma: R$ {Number(op.amountPlatformCurrency).toFixed(2)}</p>
            <p className="text-xs text-slate-400">Prazo: {new Date(op.expiresAt).toLocaleString('pt-BR')}</p>
            {op.status === 'PENDING' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <CollaboratorOperationForm operationId={op.id} approve />
                <CollaboratorOperationForm operationId={op.id} approve={false} />
              </div>
            )}
          </div>
        ))}
        {operations.length === 0 && <p className="text-sm text-slate-400">Sem operações pendentes no momento.</p>}
      </div>
    </section>
  );
}

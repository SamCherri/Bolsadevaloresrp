import { requireUser } from '@/lib/auth';
import { StatusBadge } from '@/components/ui/status-badge';
import { getUserExchangeOperations } from '@/services/exchange-service';
import { ExchangeOperationForm } from '@/components/forms/exchange-operation-form';

export default async function ExchangePage() {
  const user = await requireUser();
  const operations = await getUserExchangeOperations(user.id, 20);

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExchangeOperationForm type="DEPOSIT" />
        <ExchangeOperationForm type="WITHDRAW" />
      </section>

      <section className="card">
        <h3 className="font-semibold mb-2">Histórico de câmbio</h3>
        <div className="space-y-2">
          {operations.map((op) => (
            <div key={op.id} className="flex flex-col gap-2 sm:flex-row sm:justify-between border border-border rounded-lg p-3 text-sm">
              <span className="break-words">{op.type} · jogo {Number(op.amountGameCurrency).toFixed(2)} · plataforma R$ {Number(op.amountPlatformCurrency).toFixed(2)}</span>
              <StatusBadge value={op.status} />
            </div>
          ))}
        </div>
        {operations.length === 0 && <p className="text-sm text-slate-400">Nenhuma operação de câmbio registrada.</p>}
      </section>
    </div>
  );
}

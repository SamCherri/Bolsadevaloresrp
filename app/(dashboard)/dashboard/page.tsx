import { requireUser } from '@/lib/auth';
import { getDashboardData } from '@/services/dashboard-service';
import { StatusBadge } from '@/components/ui/status-badge';
import { Prisma } from '@prisma/client';

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id, user.role);
  const holdingsValue = data.wallet?.holdings.reduce((acc, h) => acc.add(h.asset.currentPrice.mul(h.quantity)), new Prisma.Decimal(0)) ?? new Prisma.Decimal(0);

  return (
    <div className="space-y-6">
      <section className="grid md:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-slate-400">Saldo universal disponível</p><p className="text-2xl font-bold">R$ {Number(data.wallet?.balance ?? 0).toFixed(2)}</p></div>
        <div className="card"><p className="text-sm text-slate-400">Saldo reservado (saques)</p><p className="text-2xl font-bold">R$ {Number(data.wallet?.reservedBalance ?? 0).toFixed(2)}</p></div>
        <div className="card"><p className="text-sm text-slate-400">Valor em ações</p><p className="text-2xl font-bold">R$ {Number(holdingsValue).toFixed(2)}</p></div>
        <div className="card"><p className="text-sm text-slate-400">{data.isGlobalPendingMetric ? 'Câmbios pendentes (globais)' : 'Seus câmbios pendentes'}</p><p className="text-2xl font-bold">{data.pendingExchange}</p></div>
      </section>

      <section className="card">
        <h2 className="font-semibold mb-3">Ativos em destaque</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="text-left text-slate-400"><th>Ticker</th><th>Nome</th><th>Preço</th><th>Status</th></tr></thead>
            <tbody>{data.highlightedAssets.map((a) => <tr key={a.id} className="border-t border-border"><td>{a.ticker}</td><td>{a.name}</td><td>R$ {Number(a.currentPrice).toFixed(2)}</td><td><StatusBadge value={a.status} /></td></tr>)}</tbody></table>
        </div>
      </section>

      <section className="card">
        <h2 className="font-semibold mb-3">Ordens recentes</h2>
        <div className="space-y-2 text-sm">
          {data.wallet?.orders.map((o) => (
            <div key={o.id} className="flex justify-between border-b border-border pb-2">
              <span>{o.type} {o.quantity}x {o.asset.ticker} · R$ {Number(o.totalValue).toFixed(2)}</span>
              <StatusBadge value={o.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

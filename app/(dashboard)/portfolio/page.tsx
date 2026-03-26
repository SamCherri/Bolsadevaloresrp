import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StatusBadge } from '@/components/ui/status-badge';
import { getUserExchangeOperations } from '@/services/exchange-service';

export default async function PortfolioPage() {
  const user = await requireUser();

  const wallet = await prisma.wallet.findUniqueOrThrow({
    where: { userId: user.id },
    include: {
      holdings: { include: { asset: true } },
      orders: { include: { asset: true }, orderBy: { createdAt: 'desc' }, take: 30 },
    },
  });

  const exchanges = await getUserExchangeOperations(user.id, 20);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card"><p className="text-sm text-slate-400">Saldo universal disponível</p><p className="text-2xl font-bold">R$ {Number(wallet.balance).toFixed(2)}</p></div>
        <div className="card"><p className="text-sm text-slate-400">Saldo reservado em saques</p><p className="text-2xl font-bold">R$ {Number(wallet.reservedBalance).toFixed(2)}</p></div>
      </div>

      <section className="card">
        <h3 className="font-semibold mb-2">Ativos na carteira</h3>
        {wallet.holdings.map((h) => (
          <div key={h.id} className="flex justify-between border-b border-border py-2 text-sm">
            <span>{h.asset.ticker} ({h.quantity})</span>
            <span>Médio R$ {Number(h.averagePrice).toFixed(2)} | Estimado R$ {(h.quantity * Number(h.asset.currentPrice)).toFixed(2)}</span>
          </div>
        ))}
      </section>

      <section className="card">
        <h3 className="font-semibold mb-2">Histórico de ordens</h3>
        {wallet.orders.map((o) => (
          <div key={o.id} className="flex justify-between border-b border-border py-2 text-sm">
            <span>{o.type} {o.quantity}x {o.asset.ticker} · R$ {Number(o.totalValue).toFixed(2)}</span>
            <StatusBadge value={o.status} />
          </div>
        ))}
      </section>

      <section className="card">
        <h3 className="font-semibold mb-2">Histórico de câmbio</h3>
        {exchanges.map((op) => (
          <div key={op.id} className="flex justify-between border-b border-border py-2 text-sm">
            <span>{op.type} · jogo {Number(op.amountGameCurrency).toFixed(2)} → plataforma R$ {Number(op.amountPlatformCurrency).toFixed(2)}</span>
            <StatusBadge value={op.status} />
          </div>
        ))}
      </section>
    </div>
  );
}

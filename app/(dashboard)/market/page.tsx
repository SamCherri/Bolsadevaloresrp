import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { StatusBadge } from '@/components/ui/status-badge';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export default async function MarketPage() {
  await requireRole([UserRole.INVESTOR, UserRole.ISSUER, UserRole.ADMIN]);
  const assets = await prisma.asset.findMany({ where: { status: 'ACTIVE' }, orderBy: { updatedAt: 'desc' } });

  return (
    <section className="card space-y-4">
      <h2 className="font-semibold">Mercado de ações interno</h2>

      <div className="grid gap-3 sm:hidden">
        {assets.map((asset) => (
          <article key={asset.id} className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{asset.ticker}</p>
              <StatusBadge value={asset.status} />
            </div>
            <p className="text-sm break-words">{asset.name}</p>
            <p className="text-sm">Preço: R$ {Number(asset.currentPrice).toFixed(2)}</p>
            <p className="text-xs text-slate-400">Supply {asset.circulatingSupply}/{asset.totalSupply}</p>
            <Link className="btn-primary w-full" href={`/assets/${asset.id}`}>Negociar</Link>
          </article>
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="text-left text-slate-400"><th>Ticker</th><th>Nome</th><th>Preço</th><th>Supply circ.</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-t border-border">
                <td>{asset.ticker}</td><td>{asset.name}</td><td>R$ {Number(asset.currentPrice).toFixed(2)}</td><td>{asset.circulatingSupply}/{asset.totalSupply}</td>
                <td><StatusBadge value={asset.status} /></td>
                <td><Link className="text-info" href={`/assets/${asset.id}`}>Negociar</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {assets.length === 0 && <p className="text-sm text-slate-400 mt-3">Sem ativos ativos no momento.</p>}
    </section>
  );
}

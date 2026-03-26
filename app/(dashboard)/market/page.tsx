import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { StatusBadge } from '@/components/ui/status-badge';

export default async function MarketPage() {
  const assets = await prisma.asset.findMany({ where: { status: 'ACTIVE' }, orderBy: { updatedAt: 'desc' } });

  return (
    <section className="card">
      <h2 className="font-semibold mb-4">Mercado de ações interno</h2>
      <div className="overflow-x-auto">
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

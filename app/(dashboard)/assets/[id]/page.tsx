import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CandlestickChart } from '@/components/charts/candlestick-chart';
import { OrderForm } from '@/components/forms/order-form';

export default async function AssetDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      issuer: true,
      trades: { take: 15, orderBy: { createdAt: 'desc' } },
      candles: { where: { timeframe: 'M1' }, take: 120, orderBy: { timestamp: 'asc' } },
    },
  });
  if (!asset) return notFound();

  const candles = asset.candles.map((c) => ({
    time: Math.floor(new Date(c.timestamp).getTime() / 1000) as never,
    open: Number(c.open), high: Number(c.high), low: Number(c.low), close: Number(c.close),
  }));

  return (
    <div className="space-y-4">
      <section className="card">
        <h2 className="text-2xl font-bold">{asset.ticker} - {asset.name}</h2>
        <p className="text-slate-300 mt-2">{asset.description}</p>
        <p className="text-xs text-warning mt-2">No MVP, candles podem conter dados demonstrativos seedados e atualização simplificada por trade.</p>
        <div className="grid md:grid-cols-3 gap-3 mt-4 text-sm">
          <p>Emissor: {asset.issuer.username}</p>
          <p>Preço atual: R$ {Number(asset.currentPrice).toFixed(2)}</p>
          <p>Supply: {asset.circulatingSupply}/{asset.totalSupply}</p>
          <p>Reserva: R$ {Number(asset.reserveFundValue).toFixed(2)}</p>
          <p>Taxa: {Number(asset.feePercent)}%</p>
          <p>Status: {asset.status}</p>
        </div>
      </section>

      <CandlestickChart data={candles} />

      {asset.status === 'ACTIVE' && (
        <section className="grid md:grid-cols-2 gap-4">
          <OrderForm assetId={asset.id} type="BUY" />
          <OrderForm assetId={asset.id} type="SELL" />
        </section>
      )}

      <section className="card">
        <h3 className="font-semibold mb-2">Histórico de trades</h3>
        <div className="space-y-1">
          {asset.trades.map((trade) => (
            <div key={trade.id} className="text-sm border-b border-border py-1 break-words">{trade.quantity} cotas @ R$ {Number(trade.price).toFixed(2)} · {new Date(trade.createdAt).toLocaleString('pt-BR')}</div>
          ))}
          {asset.trades.length === 0 && <p className="text-sm text-slate-400">Sem trades executados para este ativo.</p>}
        </div>
      </section>
    </div>
  );
}

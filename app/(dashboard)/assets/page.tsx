import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export default async function AssetsPage() {
  await requireRole([UserRole.INVESTOR, UserRole.ISSUER, UserRole.ADMIN]);
  const assets = await prisma.asset.findMany({ include: { issuer: true }, orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-xl font-semibold">Ativos RP</h2>
        <Link className="btn-primary w-full sm:w-auto text-center" href="/new-asset">Criar ativo</Link>
      </div>
      {assets.map((asset) => (
        <article key={asset.id} className="card space-y-2">
          <h3 className="font-semibold break-words">{asset.ticker} - {asset.name}</h3>
          <p className="text-sm text-slate-300 break-words">{asset.description}</p>
          <p className="text-xs text-slate-400 break-words">Emissor: {asset.issuer.username} | Finalidade: {asset.fundPurpose}</p>
        </article>
      ))}
      {assets.length === 0 && <section className="card text-sm text-slate-400">Nenhum ativo cadastrado ainda.</section>}
    </div>
  );
}

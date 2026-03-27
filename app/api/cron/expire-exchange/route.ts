import { NextResponse } from 'next/server';
import { expirePendingExchangeOperations } from '@/domain/exchange';

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expiredCount = await expirePendingExchangeOperations();
  return NextResponse.json({ ok: true, expiredCount, ranAt: new Date().toISOString() });
}

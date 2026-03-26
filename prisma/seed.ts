import { PrismaClient, UserRole, AssetStatus, CandleTimeframe, ExchangeStatus, ExchangeType, OrderStatus, OrderType } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

function getSeedPassword(role: string) {
  const shared = process.env.SEED_DEMO_PASSWORD;
  const specific = process.env[`SEED_${role}_PASSWORD`];
  return specific || shared || 'ChangeMe!123';
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.candle.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.order.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.exchangeOperation.deleteMany();
  await prisma.assetApproval.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const [adminPw, collabPw, issuerPw, investorPw] = await Promise.all([
    hash(getSeedPassword('ADMIN'), 12), hash(getSeedPassword('COLLABORATOR'), 12), hash(getSeedPassword('ISSUER'), 12), hash(getSeedPassword('INVESTOR'), 12),
  ]);

  const admin = await prisma.user.create({ data: { name: 'Admin RP', username: 'adminrp', email: 'admin@bvrp.local', passwordHash: adminPw, role: UserRole.ADMIN, wallet: { create: { balance: 20000 } } } });
  const collaborator = await prisma.user.create({ data: { name: 'Colaborador RP', username: 'collabrp', email: 'collab@bvrp.local', passwordHash: collabPw, role: UserRole.COLLABORATOR, wallet: { create: { balance: 5000 } } } });
  const issuer = await prisma.user.create({ data: { name: 'Emissor RP', username: 'issuerrp', email: 'issuer@bvrp.local', passwordHash: issuerPw, role: UserRole.ISSUER, wallet: { create: { balance: 8000 } } } });
  const investor = await prisma.user.create({ data: { name: 'Investidor RP', username: 'investorrp', email: 'investor@bvrp.local', passwordHash: investorPw, role: UserRole.INVESTOR, wallet: { create: { balance: 15000 } } } });

  const assets = await Promise.all([
    prisma.asset.create({ data: { ticker: 'LSCN', name: 'Los Santos Construções', description: 'Construtora RP focada em imóveis de luxo.', issuerId: issuer.id, initialPrice: 12.5, currentPrice: 15.2, totalSupply: 150000, circulatingSupply: 50000, feePercent: 2.5, reservePercent: 8, reserveFundValue: 12000, fundPurpose: 'Expansão imobiliária', status: AssetStatus.ACTIVE } }),
    prisma.asset.create({ data: { ticker: 'BANC', name: 'Banco Central Vinewood', description: 'Instituição financeira RP.', issuerId: issuer.id, initialPrice: 20, currentPrice: 22.8, totalSupply: 90000, circulatingSupply: 35000, feePercent: 1.8, reservePercent: 10, reserveFundValue: 20000, fundPurpose: 'Capital de giro e empréstimos', status: AssetStatus.ACTIVE } }),
    prisma.asset.create({ data: { ticker: 'TAXI', name: 'Taxi Downtown', description: 'Serviço de transporte RP.', issuerId: issuer.id, initialPrice: 6.5, currentPrice: 5.9, totalSupply: 200000, circulatingSupply: 0, feePercent: 3.2, reservePercent: 6, reserveFundValue: 0, fundPurpose: 'Renovação de frota', status: AssetStatus.PENDING_APPROVAL, approvals: { create: {} } } }),
  ]);

  const investorWallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: investor.id } });

  await prisma.holding.createMany({ data: [
    { walletId: investorWallet.id, assetId: assets[0].id, quantity: 100, averagePrice: 14.0 },
    { walletId: investorWallet.id, assetId: assets[1].id, quantity: 40, averagePrice: 21.5 },
  ]});

  const buyOrder = await prisma.order.create({ data: { userId: investor.id, walletId: investorWallet.id, assetId: assets[0].id, type: OrderType.BUY, quantity: 15, unitPrice: 15.0, totalValue: 225, status: OrderStatus.EXECUTED } });
  await prisma.trade.create({ data: { assetId: assets[0].id, orderId: buyOrder.id, quantity: 15, price: 15.0, value: 225 } });

  await prisma.exchangeOperation.createMany({ data: [
    { type: ExchangeType.DEPOSIT, userId: investor.id, walletId: investorWallet.id, collaboratorId: collaborator.id, amountGameCurrency: 50000, amountPlatformCurrency: 500, exchangeRate: 0.01, status: ExchangeStatus.APPROVED, processedAt: new Date(), expiresAt: new Date(Date.now() + 3600_000) },
    { type: ExchangeType.WITHDRAW, userId: investor.id, walletId: investorWallet.id, collaboratorId: null, amountGameCurrency: 20000, amountPlatformCurrency: 200, exchangeRate: 0.01, reservedAmount: 200, status: ExchangeStatus.PENDING, expiresAt: new Date(Date.now() + 3600_000) },
  ]});

  for (let i = 0; i < 120; i++) {
    const base = 14 + Math.sin(i / 8) * 1.5;
    const open = base + Math.random() * 0.2;
    const close = base + (Math.random() - 0.5) * 0.6;
    const high = Math.max(open, close) + Math.random() * 0.4;
    const low = Math.min(open, close) - Math.random() * 0.4;
    await prisma.candle.create({ data: { assetId: assets[0].id, timeframe: CandleTimeframe.M1, timestamp: new Date(Date.now() - (120 - i) * 60_000), open, high, low, close, volume: 200 + Math.random() * 150 } });
  }

  await prisma.auditLog.createMany({ data: [
    { actorId: admin.id, action: 'SEED_INIT', entityType: 'System' },
    { actorId: investor.id, action: 'ORDER_BUY_EXECUTED', entityType: 'Order', entityId: buyOrder.id },
  ] });

  console.log('Seed concluído para ambiente de desenvolvimento. Defina SEED_DEMO_PASSWORD para trocar senha padrão.');
}

main().finally(() => prisma.$disconnect());

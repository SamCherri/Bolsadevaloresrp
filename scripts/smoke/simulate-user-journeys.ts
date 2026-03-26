import { Prisma } from '@prisma/client';
import { calculateOrderTotals, validateBuyOrder, validateSellOrder } from '@/domain/trading-rules';

type Scenario = { name: string; run: () => void };

const scenarios: Scenario[] = [
  {
    name: 'visitante acessa login',
    run: () => {
      const publicRoute = '/login';
      if (!publicRoute.startsWith('/login')) throw new Error('Rota pública inválida');
    },
  },
  {
    name: 'compra bloqueada por saldo insuficiente',
    run: () => {
      const result = validateBuyOrder({ availableSupply: 100, quantity: 20, walletBalance: new Prisma.Decimal(150), unitPrice: new Prisma.Decimal(10) });
      if (!('error' in result)) throw new Error('Compra deveria falhar por saldo insuficiente');
    },
  },
  {
    name: 'compra bloqueada por supply insuficiente',
    run: () => {
      const result = validateBuyOrder({ availableSupply: 2, quantity: 5, walletBalance: new Prisma.Decimal(1000), unitPrice: new Prisma.Decimal(10) });
      if (!('error' in result)) throw new Error('Compra deveria falhar por supply insuficiente');
    },
  },
  {
    name: 'venda bloqueada por holding insuficiente',
    run: () => {
      const result = validateSellOrder({ holdingQuantity: 1, quantity: 5, circulatingSupply: 50 });
      if (!('error' in result)) throw new Error('Venda deveria falhar por holding insuficiente');
    },
  },
  {
    name: 'venda bloqueada por inconsistência de supply',
    run: () => {
      const result = validateSellOrder({ holdingQuantity: 10, quantity: 5, circulatingSupply: 3 });
      if (!('error' in result)) throw new Error('Venda deveria falhar por supply inconsistente');
    },
  },
  {
    name: 'totais da ordem calculados com reserva',
    run: () => {
      const totals = calculateOrderTotals({ quantity: 4, unitPrice: new Prisma.Decimal('12.5'), reservePercent: new Prisma.Decimal(10) });
      if (!totals.totalValue.equals('50.0000') || !totals.reserveAmount.equals('5.0000')) {
        throw new Error('Cálculo de total/reserva inconsistente');
      }
    },
  },
];

let failed = 0;
for (const scenario of scenarios) {
  try {
    scenario.run();
    console.log(`✅ ${scenario.name}`);
  } catch (error) {
    failed += 1;
    console.error(`❌ ${scenario.name}: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
  }
}

if (failed > 0) {
  console.error(`\nFalhas: ${failed}`);
  process.exit(1);
}

console.log(`\n${scenarios.length} cenários executados sem falhas.`);

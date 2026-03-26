import test from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { calculateOrderTotals, validateBuyOrder, validateSellOrder } from '@/domain/trading-rules';

test('validateBuyOrder rejeita supply insuficiente', () => {
  const result = validateBuyOrder({ availableSupply: 5, quantity: 10, walletBalance: new Prisma.Decimal(1000), unitPrice: new Prisma.Decimal(10) });
  assert.equal('error' in result, true);
  if ('error' in result) {
    assert.ok(result.error);
    assert.match(result.error, /supply/i);
  }
});

test('validateBuyOrder rejeita saldo insuficiente', () => {
  const result = validateBuyOrder({ availableSupply: 100, quantity: 10, walletBalance: new Prisma.Decimal(50), unitPrice: new Prisma.Decimal(10) });
  assert.equal('error' in result, true);
  if ('error' in result) {
    assert.ok(result.error);
    assert.match(result.error, /Saldo insuficiente/i);
  }
});

test('validateSellOrder rejeita holding insuficiente', () => {
  const result = validateSellOrder({ holdingQuantity: 1, quantity: 2, circulatingSupply: 100 });
  assert.equal('error' in result, true);
  if ('error' in result) {
    assert.ok(result.error);
    assert.match(result.error, /Holding insuficiente/i);
  }
});

test('validateSellOrder rejeita inconsistência de supply', () => {
  const result = validateSellOrder({ holdingQuantity: 10, quantity: 5, circulatingSupply: 3 });
  assert.equal('error' in result, true);
  if ('error' in result) {
    assert.ok(result.error);
    assert.match(result.error, /Inconsistência de supply/i);
  }
});

test('calculateOrderTotals retorna total e reserva com precisão controlada', () => {
  const result = calculateOrderTotals({ quantity: 3, unitPrice: new Prisma.Decimal('10.1555'), reservePercent: new Prisma.Decimal(15) });
  assert.equal(result.totalValue.toString(), '30.4665');
  assert.equal(result.reserveAmount.toString(), '4.57');
});

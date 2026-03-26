import { Prisma } from '@prisma/client';
import { money, percentToFactor } from '@/lib/money';

type BuyValidationInput = {
  availableSupply: number;
  quantity: number;
  walletBalance: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
};

type SellValidationInput = {
  holdingQuantity: number;
  quantity: number;
  circulatingSupply: number;
};

export function getCurrentMinuteBucket(date = new Date()) {
  return new Date(Math.floor(date.getTime() / 60000) * 60000);
}

export function calculateOrderTotals(input: { quantity: number; unitPrice: Prisma.Decimal; reservePercent: Prisma.Decimal }) {
  const quantity = new Prisma.Decimal(input.quantity);
  const totalValue = money(quantity.mul(input.unitPrice));
  const reserveAmount = money(totalValue.mul(percentToFactor(input.reservePercent)));
  return { totalValue, reserveAmount };
}

export function validateBuyOrder(input: BuyValidationInput) {
  if (input.availableSupply < input.quantity) {
    return { error: 'Sem supply disponível para compra.' };
  }

  const totalValue = input.unitPrice.mul(input.quantity);
  if (input.walletBalance.lessThan(totalValue)) {
    return { error: 'Saldo insuficiente.' };
  }

  return { ok: true as const };
}

export function validateSellOrder(input: SellValidationInput) {
  if (input.holdingQuantity < input.quantity) {
    return { error: 'Holding insuficiente para venda.' };
  }

  if (input.circulatingSupply < input.quantity) {
    return { error: 'Inconsistência de supply detectada. Contate o suporte.' };
  }

  return { ok: true as const };
}

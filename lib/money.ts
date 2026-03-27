import { Prisma } from '@prisma/client';

export const MONEY_SCALE = 4;
export const RATE_SCALE = 6;

export function decimal(value: Prisma.Decimal | string | number) {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
}

export function money(value: Prisma.Decimal | string | number) {
  return decimal(value).toDecimalPlaces(MONEY_SCALE, Prisma.Decimal.ROUND_HALF_UP);
}

export function rate(value: Prisma.Decimal | string | number) {
  return decimal(value).toDecimalPlaces(RATE_SCALE, Prisma.Decimal.ROUND_HALF_UP);
}

export function percentToFactor(percent: Prisma.Decimal | string | number) {
  return decimal(percent).div(100);
}

export function minDecimal(a: Prisma.Decimal, b: Prisma.Decimal) {
  return a.lessThan(b) ? a : b;
}

export function maxDecimal(a: Prisma.Decimal, b: Prisma.Decimal) {
  return a.greaterThan(b) ? a : b;
}

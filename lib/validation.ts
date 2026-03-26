import { z } from 'zod';

const tickerRegex = /^[A-Z0-9]{3,8}$/;
const safeTextRegex = /^[\p{L}\p{N}\s.,:;!?()'"\-_/]+$/u;
const decimalStringRegex = /^\d+(?:[.,]\d{1,6})?$/;

const decimalInput = z
  .string()
  .trim()
  .regex(decimalStringRegex, 'Valor numérico inválido')
  .transform((value) => value.replace(',', '.'));

export const registerSchema = z.object({
  name: z.string().trim().min(3).max(80),
  username: z.string().trim().min(3).max(30).regex(/^[a-z0-9_]+$/i),
  email: z.string().trim().email(),
  password: z
    .string()
    .min(10)
    .max(128)
    .regex(/[A-Z]/, 'Senha deve conter letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter símbolo'),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(120),
  password: z.string().min(8).max(128),
});

export const assetRequestSchema = z.object({
  name: z.string().trim().min(2).max(120).regex(safeTextRegex),
  ticker: z.string().trim().toUpperCase().regex(tickerRegex),
  description: z.string().trim().min(10).max(800),
  initialPrice: decimalInput,
  quantity: z.coerce.number().int().positive().max(10_000_000),
  feePercent: decimalInput,
  reservePercent: decimalInput,
  fundPurpose: z.string().trim().min(5).max(200),
});

export const orderSchema = z.object({
  assetId: z.string().cuid(),
  quantity: z.coerce.number().int().positive().max(1_000_000),
  type: z.enum(['BUY', 'SELL']),
});

export const exchangeSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAW']),
  amountGameCurrency: decimalInput,
  exchangeRate: decimalInput,
});

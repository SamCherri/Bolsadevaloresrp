import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(3),
  username: z.string().min(3).regex(/^[a-z0-9_]+$/i),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(8),
});

export const assetRequestSchema = z.object({
  name: z.string().min(2),
  ticker: z.string().min(2).max(8),
  description: z.string().min(10),
  initialPrice: z.coerce.number().positive(),
  quantity: z.coerce.number().int().positive(),
  feePercent: z.coerce.number().min(0).max(100),
  reservePercent: z.coerce.number().min(0).max(100),
  fundPurpose: z.string().min(5),
});

export const orderSchema = z.object({
  assetId: z.string().cuid(),
  quantity: z.coerce.number().int().positive(),
  type: z.enum(['BUY', 'SELL']),
});

export const exchangeSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAW']),
  amountGameCurrency: z.coerce.number().positive(),
  exchangeRate: z.coerce.number().positive(),
});

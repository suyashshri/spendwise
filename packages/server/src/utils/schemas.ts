import { z } from "zod";
import { PASSWORD_MIN_LENGTH, BUDGET_PERIODS, SUPPORTED_CURRENCY_CODES } from "@spendwise/shared";

const currencyCodeSchema = z.enum(SUPPORTED_CURRENCY_CODES as [string, ...string[]]);

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(PASSWORD_MIN_LENGTH),
  name: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currency: currencyCodeSchema.optional(),
  monthlyBudget: z.number().positive().nullable().optional(),
});

export const parseTextSchema = z.object({
  text: z.string().min(1).max(2000),
});

export const categorizeSchema = z.object({
  transactionId: z.string().min(1),
  category: z.string().min(1),
});

export const createTransactionSchema = z.object({
  amount: z.number().positive(),
  currency: currencyCodeSchema.optional(),
  merchant: z.string().min(1).max(100),
  category: z.string().min(1),
  date: z.string().datetime().or(z.string().min(1)),
  note: z.string().max(500).optional(),
});

export const updateTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  currency: currencyCodeSchema.optional(),
  merchant: z.string().min(1).max(100).optional(),
  category: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  note: z.string().max(500).optional(),
});

export const createBudgetSchema = z.object({
  category: z.string().min(1),
  limit: z.number().positive(),
  period: z.enum(BUDGET_PERIODS),
  alertAt: z.number().min(0).max(100).default(80),
});

export const updateBudgetSchema = z.object({
  limit: z.number().positive().optional(),
  alertAt: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const exportQuerySchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2000).max(2100).optional(),
  category: z.string().optional(),
  format: z.enum(["csv", "pdf"]),
});

export const pushTokenSchema = z.object({
  token: z.string().min(1),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(40),
  icon: z.string().min(1).max(8),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "color must be a hex value like #6C5CE7"),
});

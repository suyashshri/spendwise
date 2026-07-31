import type { BUDGET_PERIODS, INPUT_TYPES, AUTH_PROVIDERS } from "./constants";

export type BudgetPeriod = (typeof BUDGET_PERIODS)[number];
export type TransactionInputType = (typeof INPUT_TYPES)[number];
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export interface User {
  id: string;
  email: string;
  name: string;
  authProvider: AuthProvider;
  currency: string;
  categories: string[];
  monthlyBudget?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  merchant: string;
  category: string;
  rawInput?: string;
  inputType: TransactionInputType;
  upiRefId?: string;
  date: string;
  note?: string;
  confidence: number;
  isRecurring: boolean;
  needsReview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  period: BudgetPeriod;
  alertAt: number;
  isActive: boolean;
  spent?: number;
  remaining?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
  isDefault: boolean;
}

export interface AiParseResult {
  amount: number;
  merchant: string;
  date: string | null;
  upiRefId: string | null;
  suggestedCategory: string;
  confidence: number;
}

export interface AnalyticsSummary {
  totalSpent: number;
  byCategory: Array<{ category: string; amount: number; percent: number }>;
  transactionCount: number;
}

export interface AnalyticsTrendPoint {
  month: number;
  year: number;
  totalSpent: number;
}

export interface TopMerchant {
  merchant: string;
  totalSpent: number;
  count: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiErrorBody {
  error: {
    message: string;
    code: string;
  };
}

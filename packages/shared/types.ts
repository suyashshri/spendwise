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
  /** ISO 4217 code of the currency `amount` is denominated in — see packages/shared/currencies.ts.
   * AI/OCR-parsed transactions are always "INR" (UPI is India-only); manual entries are
   * user-selectable. */
  currency: string;
  /** `amount` converted to the user's account currency at the exchange rate captured when this
   * transaction was saved (never recomputed later) — this is what budgets/analytics sum across
   * transactions of different currencies. Equal to `amount` when `currency` already matches the
   * user's account currency. */
  amountInBaseCurrency: number;
  /** The `currency` -> account-currency rate used to compute amountInBaseCurrency, for display
   * ("1 USD = ₹95.38 on this date") — not used in any calculation after save time. */
  exchangeRate: number;
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

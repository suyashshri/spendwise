import { Types } from "mongoose";
import { Transaction } from "../models/Transaction";
import { getExchangeRate } from "./exchangeRateService";

/**
 * Re-converts every one of a user's transactions' `amountInBaseCurrency`/`exchangeRate` to a new
 * account currency. `amountInBaseCurrency` is normally frozen at save time (see
 * models/Transaction.ts) so historical totals don't drift as exchange rates move day to day — but
 * that assumes the account currency it was converted *to* stays constant. When the user explicitly
 * changes their account currency (routes/auth.ts PATCH /me), every existing transaction's stored
 * conversion is now relative to the *old* currency, while budgets/analytics/the UI immediately
 * start treating `amountInBaseCurrency` as if it were in the *new* one — silently wrong until
 * fixed. This is the fix: one explicit, one-time re-conversion pass triggered by that specific user
 * action, not a recurring recompute-on-read (which is exactly what save-time freezing is meant to
 * avoid).
 *
 * Grouped by distinct `currency` present in the user's transactions (typically 1-3) rather than
 * one rate lookup per transaction — each group's rate is fetched once and applied via a
 * pipeline update ($multiply against each doc's own `amount`), done in the database.
 */
export async function reconvertTransactionsToBaseCurrency(
  userId: Types.ObjectId,
  newBaseCurrency: string
): Promise<void> {
  const currencies = await Transaction.distinct("currency", { userId });

  for (const currency of currencies) {
    const rate = await getExchangeRate(currency, newBaseCurrency);
    await Transaction.updateMany({ userId, currency }, [
      { $set: { amountInBaseCurrency: { $multiply: ["$amount", rate] }, exchangeRate: rate } },
    ]);
  }
}

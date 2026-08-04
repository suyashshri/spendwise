import { Types } from "mongoose";
import { Transaction } from "../models/Transaction";

const MIN_OCCURRENCES = 3;
const AMOUNT_TOLERANCE = 0.15; // 15% — covers small monthly variation (e.g. usage-based bills)

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function amountsAreSimilar(a: number, b: number): boolean {
  const reference = Math.max(a, b);
  return reference === 0 || Math.abs(a - b) / reference <= AMOUNT_TOLERANCE;
}

/**
 * Flags a merchant's transactions as recurring once they've appeared in at least
 * MIN_OCCURRENCES distinct calendar months at a roughly similar amount (subscriptions, rent,
 * recurring bills). Runs incrementally after each new transaction is saved — see
 * routes/parse.ts and routes/transactions.ts — rather than as a scheduled batch job, so
 * `isRecurring` stays current without needing cron infrastructure.
 */
export async function detectRecurringForMerchant(userId: Types.ObjectId, merchant: string): Promise<void> {
  const transactions = await Transaction.find({ userId, merchant }).sort({ date: 1 });
  if (transactions.length < MIN_OCCURRENCES) return;

  // Group by month, keeping one representative amount per month (the latest that month).
  const byMonth = new Map<string, { amount: number; ids: Types.ObjectId[] }>();
  for (const t of transactions) {
    const key = monthKey(t.date);
    const entry = byMonth.get(key);
    if (entry) {
      entry.amount = t.amount;
      entry.ids.push(t._id);
    } else {
      byMonth.set(key, { amount: t.amount, ids: [t._id] });
    }
  }

  const monthEntries = [...byMonth.values()];
  if (monthEntries.length < MIN_OCCURRENCES) return;

  // Find the longest run of consecutive months (by insertion order, already chronological)
  // with mutually similar amounts.
  let matchedIds: Types.ObjectId[] = [];
  let runStart = 0;
  for (let i = 1; i <= monthEntries.length; i++) {
    const brokeRun = i === monthEntries.length || !amountsAreSimilar(monthEntries[i].amount, monthEntries[runStart].amount);
    if (brokeRun) {
      const runLength = i - runStart;
      if (runLength >= MIN_OCCURRENCES) {
        matchedIds = monthEntries.slice(runStart, i).flatMap((e) => e.ids);
      }
      runStart = i;
    }
  }

  if (matchedIds.length > 0) {
    await Transaction.updateMany({ _id: { $in: matchedIds } }, { $set: { isRecurring: true } });
  }
}

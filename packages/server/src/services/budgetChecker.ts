import { Types } from "mongoose";
import { Budget } from "../models/Budget";
import { Transaction } from "../models/Transaction";

export interface BudgetAlert {
  budgetId: string;
  category: string;
  limit: number;
  spent: number;
  percentUsed: number;
}

export function periodStart(period: "monthly" | "weekly"): Date {
  const now = new Date();
  if (period === "weekly") {
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Checks the active budget(s) matching a transaction's category (and the user's
 * overall budget) against spend-to-date, returning any that just crossed their
 * alertAt threshold. Push-notification delivery is wired up in Phase 3 — for now
 * this is the pure computation callers can log or act on.
 */
export async function checkBudgetsForTransaction(
  userId: Types.ObjectId,
  category: string
): Promise<BudgetAlert[]> {
  const budgets = await Budget.find({
    userId,
    isActive: true,
    category: { $in: [category, "Overall"] },
  });

  if (budgets.length === 0) return [];

  const alerts: BudgetAlert[] = [];

  for (const budget of budgets) {
    const start = periodStart(budget.period);
    const matchCategory = budget.category === "Overall" ? {} : { category: budget.category };

    const [{ total } = { total: 0 }] = await Transaction.aggregate([
      { $match: { userId, date: { $gte: start }, ...matchCategory } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const percentUsed = budget.limit > 0 ? (total / budget.limit) * 100 : 0;
    if (percentUsed >= budget.alertAt) {
      alerts.push({
        budgetId: budget._id.toString(),
        category: budget.category,
        limit: budget.limit,
        spent: total,
        percentUsed,
      });
    }
  }

  return alerts;
}

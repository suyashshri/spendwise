import { Router } from "express";
import { Types } from "mongoose";
import { Budget } from "../models/Budget";
import { Transaction } from "../models/Transaction";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";
import { asyncHandler } from "../middleware/errorHandler";
import { AppError } from "../utils/AppError";
import { createBudgetSchema, updateBudgetSchema } from "../utils/schemas";
import { periodStart } from "../services/budgetChecker";

const router = Router();
router.use(requireAuth);

async function spentForBudget(userId: Types.ObjectId, category: string, period: "monthly" | "weekly"): Promise<number> {
  const start = periodStart(period);
  const matchCategory = category === "Overall" ? {} : { category };

  const [{ total } = { total: 0 }] = await Transaction.aggregate([
    { $match: { userId, date: { $gte: start }, ...matchCategory } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  return total;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = new Types.ObjectId(req.user!.id);
    const budgets = await Budget.find({ userId }).sort({ createdAt: -1 });

    const withSpend = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await spentForBudget(userId, budget.category, budget.period);
        return {
          ...budget.toJSON(),
          spent,
          remaining: Math.max(budget.limit - spent, 0),
        };
      })
    );

    res.json({ budgets: withSpend });
  })
);

router.post(
  "/",
  validateBody(createBudgetSchema),
  asyncHandler(async (req, res) => {
    const { category, limit, period, alertAt } = req.body as {
      category: string;
      limit: number;
      period: "monthly" | "weekly";
      alertAt: number;
    };
    const userId = req.user!.id;

    const existing = await Budget.findOne({ userId, category, period });
    if (existing) {
      throw AppError.conflict(
        `A ${period} budget for "${category}" already exists — edit it instead.`,
        "BUDGET_EXISTS"
      );
    }

    const budget = await Budget.create({ userId, category, limit, period, alertAt });
    res.status(201).json({ budget: { ...budget.toJSON(), spent: 0, remaining: limit } });
  })
);

router.patch(
  "/:id",
  validateBody(updateBudgetSchema),
  asyncHandler(async (req, res) => {
    const updates = req.body as Partial<{ limit: number; alertAt: number; isActive: boolean }>;

    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!budget) {
      throw AppError.notFound("Budget not found");
    }

    if (updates.limit !== undefined) budget.limit = updates.limit;
    if (updates.alertAt !== undefined) budget.alertAt = updates.alertAt;
    if (updates.isActive !== undefined) budget.isActive = updates.isActive;

    await budget.save();

    const spent = await spentForBudget(new Types.ObjectId(req.user!.id), budget.category, budget.period);
    res.json({ budget: { ...budget.toJSON(), spent, remaining: Math.max(budget.limit - spent, 0) } });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await Budget.deleteOne({ _id: req.params.id, userId: req.user!.id });
    if (result.deletedCount === 0) {
      throw AppError.notFound("Budget not found");
    }
    res.status(204).end();
  })
);

export default router;

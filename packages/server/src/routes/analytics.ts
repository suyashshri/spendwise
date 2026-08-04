import { Router } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { Transaction } from "../models/Transaction";
import { requireAuth } from "../middleware/auth";
import { validateQuery } from "../middleware/validation";
import { asyncHandler } from "../middleware/errorHandler";
import { BASE_AMOUNT_EXPR } from "../services/budgetChecker";

const router = Router();
router.use(requireAuth);

function monthRange(month: number, year: number): { start: Date; end: Date } {
  return { start: new Date(year, month - 1, 1), end: new Date(year, month, 1) };
}

interface Summary {
  totalSpent: number;
  byCategory: Array<{ category: string; amount: number; percent: number }>;
  transactionCount: number;
}

async function computeSummary(userId: Types.ObjectId, month: number, year: number): Promise<Summary> {
  const { start, end } = monthRange(month, year);

  const rows = await Transaction.aggregate<{ _id: string; amount: number; count: number }>([
    { $match: { userId, date: { $gte: start, $lt: end } } },
    { $group: { _id: "$category", amount: { $sum: BASE_AMOUNT_EXPR }, count: { $sum: 1 } } },
    { $sort: { amount: -1 } },
  ]);

  const totalSpent = rows.reduce((sum, r) => sum + r.amount, 0);
  const transactionCount = rows.reduce((sum, r) => sum + r.count, 0);

  const byCategory = rows.map((r) => ({
    category: r._id,
    amount: r.amount,
    percent: totalSpent > 0 ? Math.round((r.amount / totalSpent) * 1000) / 10 : 0,
  }));

  return { totalSpent, byCategory, transactionCount };
}

const monthYearSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
});

router.get(
  "/summary",
  validateQuery(monthYearSchema),
  asyncHandler(async (req, res) => {
    const { month, year } = req.query as unknown as z.infer<typeof monthYearSchema>;
    const userId = new Types.ObjectId(req.user!.id);
    res.json(await computeSummary(userId, month, year));
  })
);

const trendsSchema = z.object({
  months: z.coerce.number().min(1).max(24).default(6),
});

router.get(
  "/trends",
  validateQuery(trendsSchema),
  asyncHandler(async (req, res) => {
    const { months } = req.query as unknown as z.infer<typeof trendsSchema>;
    const userId = new Types.ObjectId(req.user!.id);

    const now = new Date();
    const points: Array<{ month: number; year: number; totalSpent: number }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const { totalSpent } = await computeSummary(userId, month, year);
      points.push({ month, year, totalSpent });
    }

    res.json(points);
  })
);

const compareSchema = z.object({
  month1: z.coerce.number().min(1).max(12),
  month2: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
});

router.get(
  "/compare",
  validateQuery(compareSchema),
  asyncHandler(async (req, res) => {
    const { month1, month2, year } = req.query as unknown as z.infer<typeof compareSchema>;
    const userId = new Types.ObjectId(req.user!.id);

    const [summary1, summary2] = await Promise.all([
      computeSummary(userId, month1, year),
      computeSummary(userId, month2, year),
    ]);

    res.json({
      month1: summary1,
      month2: summary2,
      delta: summary2.totalSpent - summary1.totalSpent,
    });
  })
);

const topMerchantsSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
  limit: z.coerce.number().min(1).max(50).default(10),
});

router.get(
  "/top-merchants",
  validateQuery(topMerchantsSchema),
  asyncHandler(async (req, res) => {
    const { month, year, limit } = req.query as unknown as z.infer<typeof topMerchantsSchema>;
    const userId = new Types.ObjectId(req.user!.id);
    const { start, end } = monthRange(month, year);

    const rows = await Transaction.aggregate<{ _id: string; totalSpent: number; count: number }>([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: "$merchant", totalSpent: { $sum: BASE_AMOUNT_EXPR }, count: { $sum: 1 } } },
      { $sort: { totalSpent: -1 } },
      { $limit: limit },
    ]);

    res.json(rows.map((r) => ({ merchant: r._id, totalSpent: r.totalSpent, count: r.count })));
  })
);

export default router;

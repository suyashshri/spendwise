import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { TRANSACTIONS_DEFAULT_PAGE_SIZE } from "@spendwise/shared";
import { Transaction } from "../models/Transaction";
import { requireAuth } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validation";
import { asyncHandler } from "../middleware/errorHandler";
import { AppError } from "../utils/AppError";
import { createTransactionSchema, updateTransactionSchema } from "../utils/schemas";
import { detectRecurringForMerchant } from "../services/recurringDetector";

const router = Router();
router.use(requireAuth);

const listQuerySchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2000).max(2100).optional(),
  category: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(TRANSACTIONS_DEFAULT_PAGE_SIZE),
});

router.get(
  "/",
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    const { month, year, category, page, limit } = req.query as unknown as z.infer<typeof listQuerySchema>;
    const userId = req.user!.id;

    const filter: Record<string, unknown> = { userId };
    if (category) filter.category = category;
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      filter.date = { $gte: start, $lt: end };
    } else if (year) {
      filter.date = { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) };
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      transactions: transactions.map((t) => t.toJSON()),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!transaction) {
      throw AppError.notFound("Transaction not found");
    }
    res.json({ transaction: transaction.toJSON() });
  })
);

router.post(
  "/",
  validateBody(createTransactionSchema),
  asyncHandler(async (req, res) => {
    const { amount, merchant, category, date, note } = req.body as {
      amount: number;
      merchant: string;
      category: string;
      date: string;
      note?: string;
    };

    const userId = new Types.ObjectId(req.user!.id);

    const transaction = await Transaction.create({
      userId,
      amount,
      merchant,
      category,
      date: new Date(date),
      note,
      inputType: "manual",
      confidence: 1,
      needsReview: false,
    });

    await detectRecurringForMerchant(userId, transaction.merchant);
    const saved = (await Transaction.findById(transaction._id)) ?? transaction;

    res.status(201).json({ transaction: saved.toJSON() });
  })
);

router.patch(
  "/:id",
  validateBody(updateTransactionSchema),
  asyncHandler(async (req, res) => {
    const updates = req.body as Partial<{
      amount: number;
      merchant: string;
      category: string;
      date: string;
      note: string;
    }>;

    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!transaction) {
      throw AppError.notFound("Transaction not found");
    }

    if (updates.amount !== undefined) transaction.amount = updates.amount;
    if (updates.merchant !== undefined) transaction.merchant = updates.merchant;
    if (updates.category !== undefined) {
      transaction.category = updates.category;
      transaction.needsReview = false;
    }
    if (updates.date !== undefined) transaction.date = new Date(updates.date);
    if (updates.note !== undefined) transaction.note = updates.note;

    await transaction.save();
    res.json({ transaction: transaction.toJSON() });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await Transaction.deleteOne({ _id: req.params.id, userId: req.user!.id });
    if (result.deletedCount === 0) {
      throw AppError.notFound("Transaction not found");
    }
    res.status(204).end();
  })
);

export default router;

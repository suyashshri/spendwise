import { Router } from "express";
import { Types } from "mongoose";
import { AI_CONFIDENCE_REVIEW_THRESHOLD } from "@spendwise/shared";
import { Transaction } from "../models/Transaction";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";
import { asyncHandler } from "../middleware/errorHandler";
import { AppError } from "../utils/AppError";
import { parseTextSchema, categorizeSchema } from "../utils/schemas";
import { categorizeTransactionText } from "../services/aiCategorizer";
import { checkBudgetsForTransaction } from "../services/budgetChecker";

const router = Router();

router.post(
  "/text",
  requireAuth,
  validateBody(parseTextSchema),
  asyncHandler(async (req, res) => {
    const { text } = req.body as { text: string };
    const userId = new Types.ObjectId(req.user!.id);

    const parsed = await categorizeTransactionText(text);

    if (parsed.upiRefId) {
      const existing = await Transaction.findOne({ userId, upiRefId: parsed.upiRefId });
      if (existing) {
        res.json({ transaction: existing.toJSON(), duplicate: true });
        return;
      }
    }

    const transaction = await Transaction.create({
      userId,
      amount: parsed.amount,
      merchant: parsed.merchant,
      category: parsed.suggestedCategory,
      rawInput: text,
      inputType: "share_text",
      upiRefId: parsed.upiRefId ?? undefined,
      date: parsed.date ? new Date(parsed.date) : new Date(),
      confidence: parsed.confidence,
      needsReview: parsed.confidence < AI_CONFIDENCE_REVIEW_THRESHOLD,
    });

    const alerts = await checkBudgetsForTransaction(userId, transaction.category);

    res.status(201).json({ transaction: transaction.toJSON(), duplicate: false, budgetAlerts: alerts });
  })
);

router.post(
  "/image",
  requireAuth,
  asyncHandler(async (_req, _res) => {
    // OCR screenshot parsing lands in Phase 3 (see specifications/05-ai-categorization.md
    // "OCR path"). Route is registered now so the client contract is stable ahead of that work.
    throw AppError.badRequest(
      "Screenshot parsing is not yet available — share the payment text instead, or add the transaction manually.",
      "NOT_IMPLEMENTED"
    );
  })
);

router.post(
  "/categorize",
  requireAuth,
  validateBody(categorizeSchema),
  asyncHandler(async (req, res) => {
    const { transactionId, category } = req.body as { transactionId: string; category: string };
    const userId = req.user!.id;

    const transaction = await Transaction.findOne({ _id: transactionId, userId });
    if (!transaction) {
      throw AppError.notFound("Transaction not found");
    }

    transaction.category = category;
    transaction.needsReview = false;
    await transaction.save();

    res.json({ transaction: transaction.toJSON() });
  })
);

export default router;

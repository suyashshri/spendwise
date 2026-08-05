import { Router } from "express";
import { Types } from "mongoose";
import { AI_CONFIDENCE_REVIEW_THRESHOLD, DEFAULT_CURRENCY } from "@spendwise/shared";
import { Transaction, type TransactionDocument } from "../models/Transaction";
import { User } from "../models/User";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";
import { uploadScreenshot } from "../middleware/upload";
import { asyncHandler } from "../middleware/errorHandler";
import { AppError } from "../utils/AppError";
import { parseTextSchema, categorizeSchema } from "../utils/schemas";
import { categorizeTransactionText } from "../services/aiCategorizer";
import { extractTextFromImage } from "../services/ocrParser";
import { checkBudgetsForTransaction } from "../services/budgetChecker";
import { detectRecurringForMerchant } from "../services/recurringDetector";
import { getExchangeRate } from "../services/exchangeRateService";
import type { AiParseResult, TransactionInputType } from "@spendwise/shared";

const router = Router();

/**
 * Shared by both /text and /image: given raw text (typed or OCR'd) and where it came from,
 * runs AI categorization, dedups on upiRefId, saves, and checks budgets. One code path regardless
 * of input source — see specifications/05-ai-categorization.md.
 *
 * UPI-sourced amounts are always INR (UPI is India-only) regardless of the user's account
 * currency — converted to the user's currency for budget/analytics aggregation, see
 * specifications/12-multi-currency.md.
 */
async function parseAndSaveTransaction(
  userId: Types.ObjectId,
  rawText: string,
  inputType: TransactionInputType
): Promise<{ transaction: TransactionDocument; duplicate: boolean; budgetAlerts: Awaited<ReturnType<typeof checkBudgetsForTransaction>> }> {
  const parsed: AiParseResult = await categorizeTransactionText(rawText, userId);

  if (parsed.upiRefId) {
    const existing = await Transaction.findOne({ userId, upiRefId: parsed.upiRefId });
    if (existing) {
      return { transaction: existing, duplicate: true, budgetAlerts: [] };
    }
  }

  const user = await User.findById(userId).select("currency");
  const userCurrency = user?.currency ?? DEFAULT_CURRENCY;
  const transactionCurrency = "INR";
  const exchangeRate = await getExchangeRate(transactionCurrency, userCurrency);

  const transaction = await Transaction.create({
    userId,
    amount: parsed.amount,
    currency: transactionCurrency,
    amountInBaseCurrency: parsed.amount * exchangeRate,
    exchangeRate,
    merchant: parsed.merchant,
    category: parsed.suggestedCategory,
    rawInput: rawText,
    inputType,
    upiRefId: parsed.upiRefId ?? undefined,
    date: parsed.date ? new Date(parsed.date) : new Date(),
    confidence: parsed.confidence,
    needsReview: parsed.confidence < AI_CONFIDENCE_REVIEW_THRESHOLD,
  });

  await detectRecurringForMerchant(userId, transaction.merchant);
  const budgetAlerts = await checkBudgetsForTransaction(userId, transaction.category);

  // Re-fetch: detectRecurringForMerchant may have just flipped this transaction's isRecurring
  // via a bulk updateMany, which wouldn't be reflected on the in-memory `transaction` doc above.
  const saved = (await Transaction.findById(transaction._id)) ?? transaction;

  return { transaction: saved, duplicate: false, budgetAlerts };
}

router.post(
  "/text",
  requireAuth,
  validateBody(parseTextSchema),
  asyncHandler(async (req, res) => {
    const { text } = req.body as { text: string };
    const userId = new Types.ObjectId(req.user!.id);

    const { transaction, duplicate, budgetAlerts } = await parseAndSaveTransaction(userId, text, "share_text");

    res.status(201).json({ transaction: transaction.toJSON(), duplicate, budgetAlerts });
  })
);

router.post(
  "/image",
  requireAuth,
  uploadScreenshot.single("screenshot"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw AppError.badRequest("No screenshot file provided", "MISSING_FILE");
    }
    const userId = new Types.ObjectId(req.user!.id);

    const rawText = await extractTextFromImage(req.file.buffer);
    if (!rawText) {
      throw AppError.badRequest(
        "Couldn't read any text from that screenshot — try a clearer image, or add the expense manually.",
        "OCR_EMPTY"
      );
    }

    const { transaction, duplicate, budgetAlerts } = await parseAndSaveTransaction(userId, rawText, "screenshot");

    res.status(201).json({ transaction: transaction.toJSON(), duplicate, budgetAlerts });
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

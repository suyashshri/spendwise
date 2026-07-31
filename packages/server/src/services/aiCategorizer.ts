import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/config";
import { Category } from "../models/Category";
import { buildParseTextPrompt } from "../utils/aiPrompts";
import type { AiParseResult } from "@spendwise/shared";

const FALLBACK_CATEGORY = "Miscellaneous";

const genAI = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON object found in AI response");
  }
  return JSON.parse(text.slice(start, end + 1));
}

function fallbackMerchant(rawText: string): string {
  // Best-effort regex extraction so a degraded save still has something useful,
  // e.g. "Paid ₹450 to Swiggy via UPI" -> "Swiggy"
  const match = rawText.match(/(?:to|paid to)\s+([A-Za-z0-9&.\-' ]{2,40}?)(?:\s+via|\s+on|\.|,|$)/i);
  return match?.[1]?.trim() || "Unknown";
}

function fallbackAmount(rawText: string): number {
  const match = rawText.match(/(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d{1,2})?)/i);
  return match ? Number(match[1].replace(/,/g, "")) : 0;
}

function fallbackUpiRefId(rawText: string): string | null {
  // Covers "UPI Ref: 123", "Ref No. 123", "UPI transaction ID 123" etc. — kept even in the
  // degraded path so dedup (unique sparse index on Transaction.upiRefId) still works when Gemini is down.
  const match = rawText.match(/(?:upi\s*)?ref(?:erence)?(?:\s*no\.?|\s*id)?\.?:?\s*#?(\d{6,})/i);
  return match?.[1] ?? null;
}

function degradedResult(rawText: string): AiParseResult {
  return {
    amount: fallbackAmount(rawText),
    merchant: fallbackMerchant(rawText),
    date: null,
    upiRefId: fallbackUpiRefId(rawText),
    suggestedCategory: FALLBACK_CATEGORY,
    confidence: 0,
  };
}

function isValidParseResult(value: unknown): value is AiParseResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.amount === "number" &&
    typeof v.merchant === "string" &&
    (typeof v.date === "string" || v.date === null) &&
    (typeof v.upiRefId === "string" || v.upiRefId === null || v.upiRefId === undefined) &&
    typeof v.suggestedCategory === "string" &&
    typeof v.confidence === "number"
  );
}

async function callGemini(prompt: string): Promise<AiParseResult> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = extractJson(text);
  if (!isValidParseResult(parsed)) {
    throw new Error("AI response did not match expected shape");
  }
  return parsed;
}

/**
 * Parses raw UPI share text (or OCR'd screenshot text) into a structured transaction.
 * Never throws — falls back to a degraded, low-confidence result so the caller can
 * always save *something* rather than losing the user's transaction.
 */
export async function categorizeTransactionText(rawText: string): Promise<AiParseResult> {
  const categories = await Category.find({}, "name keywords").lean();
  const prompt = buildParseTextPrompt(rawText, categories);

  try {
    return await callGemini(prompt);
  } catch {
    try {
      // one retry — transient network/parse hiccups are common
      return await callGemini(prompt);
    } catch {
      return degradedResult(rawText);
    }
  }
}

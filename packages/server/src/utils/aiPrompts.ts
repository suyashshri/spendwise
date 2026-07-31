import { DEFAULT_CATEGORY_NAMES } from "@spendwise/shared";
import type { CategoryDocument } from "../models/Category";

export function buildParseTextPrompt(rawText: string, categories: Pick<CategoryDocument, "name" | "keywords">[]): string {
  const categoryNames = categories.length > 0 ? categories.map((c) => c.name) : DEFAULT_CATEGORY_NAMES;

  const keywordHints = categories
    .filter((c) => c.keywords.length > 0)
    .map((c) => `${c.name}: ${c.keywords.join(", ")}`)
    .join("\n");

  return `Extract the following from this UPI payment message and return JSON:
- amount (number)
- merchant (string — the business/person name)
- date (ISO string if mentioned, otherwise null)
- upiRefId (string if present)
- suggestedCategory (one of: ${categoryNames.join(", ")})
- confidence (0 to 1, how confident you are in the category)

Use these keyword hints to help pick the category (merchant names are case-insensitive):
${keywordHints}

Message: "${rawText}"

Respond with ONLY a JSON object matching this shape, no markdown fences, no extra text:
{"amount": number, "merchant": string, "date": string | null, "upiRefId": string | null, "suggestedCategory": string, "confidence": number}`;
}

# AI Categorization (Gemini)

`packages/server/src/services/aiCategorizer.ts` owns all Gemini calls. Prompt templates live in
`packages/server/src/utils/aiPrompts.ts`.

## Prompt (text path)

Category names in the prompt are generated from `packages/shared/categories.ts` at call time (not
hardcoded in the prompt string), so adding/renaming a default category only requires editing one file.

```
Extract the following from this UPI payment message and return JSON:
- amount (number)
- merchant (string — the business/person name)
- date (ISO string if mentioned, otherwise null)
- upiRefId (string if present)
- suggestedCategory (one of: Food & Dining, Groceries, Transport, Shopping, Bills & Utilities,
  Rent & Housing, Entertainment, Health & Medical, Investment, Education, Miscellaneous)
- confidence (0 to 1, how confident you are in the category)

Message: "{rawText}"
```

The model is additionally given each category's `keywords` list (from the `Category` collection) as
grounding context, so "swiggy" reliably maps to Food & Dining etc. without relying purely on the
model's world knowledge.

Response is requested/parsed as strict JSON (Gemini's JSON response mode). If the response fails to
parse, the request is retried once; if it still fails, falls back to the "AI down" path below.

## Confidence handling

- `confidence >= 0.7` — transaction saved normally, category applied as-is.
- `confidence < 0.7` — transaction is still saved (never block the save on uncertainty) but flagged
  `needsReview: true`; mobile/web UI surfaces these for a quick user confirm/edit.

## Learning from corrections

`POST /api/parse/categorize` (user manually changes a transaction's category) is treated as a
training signal:
- The correction is stored (transaction updated, plus an implicit log via `updatedAt`).
- Future iteration: append the merchant/keyword to that category's `keywords` array so subsequent
  AI calls for the same merchant are grounded correctly — this is a cheap, immediate feedback loop
  that doesn't require model fine-tuning.

## Fallback when Gemini is unavailable

If the Gemini API call fails (timeout, 5xx, quota) or its response can't be parsed after retry:
- The transaction is still saved with `category: "Miscellaneous"`, `confidence: 0`,
  `needsReview: true`, and `merchant` best-effort regex-extracted from the raw text (e.g. `Paid ₹X to
  (Y) via`) so the record isn't lost.
- This never throws a 500 back to the client for the parse endpoints — a degraded save beats losing
  the user's transaction.

## OCR path (screenshot share)

`services/ocrParser.ts` runs the uploaded image through Google Cloud Vision (primary) or
Tesseract.js (fallback / no-API-key dev mode), producing raw text that is then fed through the exact
same `aiCategorizer` used by the text path — one categorization code path regardless of input source.

# Phase 3 — Intelligence Layer

Covers everything built in Phase 3: OCR screenshot parsing (see
[05-ai-categorization.md](05-ai-categorization.md) for that one in detail), budgets CRUD, analytics,
and recurring-transaction detection.

## Budgets (`routes/budgets.ts`)

Standard CRUD scoped to `req.user`, plus one computed field: every budget returned from `GET
/api/budgets` and mutated via `POST`/`PATCH /api/budgets/:id` is annotated with `spent` and
`remaining`, computed live from `Transaction` rather than stored on the `Budget` document — so
editing or deleting a transaction is immediately reflected in budget progress without any
denormalization to keep in sync.

- `spentForBudget(userId, category, period)` aggregates `Transaction` where `date >= periodStart`
  (reuses `periodStart()` from `services/budgetChecker.ts` — exported specifically so this route and
  the budget-alert check during transaction parsing can't drift on what "the current period" means)
  and, for a category-scoped budget, `category` matches; for `category: "Overall"`, no category
  filter is applied.
- `POST /api/budgets` 409s (`BUDGET_EXISTS`) if a budget for the same `{category, period}` already
  exists for the user — matches the compound unique index on `Budget`, but checked explicitly first
  so the error message is actionable ("edit it instead") rather than a raw duplicate-key error.

## Analytics (`routes/analytics.ts`)

All four endpoints are thin wrappers around one `computeSummary(userId, month, year)` helper (a
single `Transaction.aggregate` grouping by category) except `top-merchants`, which groups by
merchant instead. `trends` calls `computeSummary` once per month in the requested range — fine at
the current scale (a handful of months, aggregation over one user's transactions); would need
rethinking (e.g. a single aggregation with a `$group` on year+month) if trend ranges grow large.

Verified against real seeded data (see build-progress verification log): summary, trends, compare,
and top-merchants all returned correctly-scoped, correctly-aggregated results, including a
month-over-month `compare` showing the right `delta` sign.

## Recurring transaction detection (`services/recurringDetector.ts`)

Runs **incrementally after every transaction save** (`/api/parse/text`, `/api/parse/image`, and
manual `POST /api/transactions` all call it) rather than as a scheduled batch job — no cron
infrastructure needed, and `isRecurring` is always current.

Algorithm, per merchant (exact string match on `Transaction.merchant`, scoped to one user):
1. Fetch all of that user's transactions for the merchant, sorted by date.
2. Bucket into calendar months, keeping one representative amount per month (the latest transaction
   that month, if there were several).
3. Walk the months in order looking for the longest run of **consecutive months** where each
   month's amount is within 15% of the run's starting amount (`AMOUNT_TOLERANCE` — covers
   usage-based bills like electricity without treating a `₹500` and a `₹5,000` charge as the same
   subscription).
4. If a run reaches `MIN_OCCURRENCES` (3) months, every transaction in those months is flagged
   `isRecurring: true` via one `updateMany` — including transactions from earlier months that
   *weren't* recurring-eligible the first two times they were saved (a subscription only becomes
   "recurring" on its 3rd occurrence, and this correctly back-fills the first two once it does).

Verified end-to-end: three ₹499 "Netflix" transactions one month apart — the 1st and 2nd stayed
`isRecurring: false` (not enough history yet), and creating the 3rd flipped all three to `true` in
one call.

**Known limitation**: merchant matching is exact-string (post-AI-extraction), so "Netflix" and
"NETFLIX.COM" wouldn't be linked. Not fixed in this pass — would need merchant name normalization
(lowercase + strip common suffixes) shared with the AI prompt's extraction step to be worth doing
properly rather than as a quick regex patch.

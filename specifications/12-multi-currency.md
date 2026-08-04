# Multi-Currency Support

Every user has one **account currency** (`User.currency`, already existed since Phase 1/2 — just
unused until now). Every `Transaction` can be in a *different* currency than the account currency
(e.g. INR from day-to-day UPI shares, USD/EUR for a trip) — this is genuine per-transaction
multi-currency, not just a single account-wide currency preference.

## Core design decision: convert and store at write time, never recompute at read time

Exchange rates move daily. If budgets/analytics recomputed conversions on every read using
*today's* rate, last month's spend total would silently drift every time the app is reopened — bad
for a finance app where a budget total should mean the same thing today as it did yesterday.

So: every `Transaction` stores `amount` + `currency` (what actually happened) plus
`amountInBaseCurrency` + `exchangeRate` (computed **once**, at save time, using the rate current at
that moment). Budgets and analytics sum `amountInBaseCurrency` — never `amount` directly, since
summing raw amounts across different currencies is meaningless (₹100 + $100 ≠ 200 of anything).

**The one place this gets recomputed**: if a user explicitly changes their account currency
(`PATCH /api/auth/me`), every existing transaction's `amountInBaseCurrency`/`exchangeRate` is
re-converted to the new account currency (`services/currencyMigration.ts`,
`reconvertTransactionsToBaseCurrency`) — grouped by distinct `currency` present in the user's
transactions (typically 1-3), one rate fetch per group, applied via a MongoDB pipeline update
(`$multiply` against each document's own `amount`, done in the database rather than looped in JS).
This is a deliberate, explicit, one-time action triggered by the user — not the same thing as
recomputing on every read, and it's necessary: without it, `amountInBaseCurrency` on old
transactions stays relative to the *old* account currency while the UI immediately starts
formatting it with the *new* currency's symbol, silently showing wrong numbers. Caught this via
manual testing (switched a test account INR -> USD, saw the total didn't change - it should have
dropped by ~95x) — see verification log in
[08-build-progress.md](08-build-progress.md).

## Exchange rate source

**Frankfurter** (`api.frankfurter.dev`) — free, no API key, ECB-sourced, verified directly against
the live endpoint (not just docs) before committing to it. `services/exchangeRateService.ts`:

- In-memory cache per `{from,to}` pair, 12h TTL (Frankfurter/ECB rates update once per business day).
- **Empirically flaky under back-to-back requests** — during testing, `base=INR` failed
  consistently in one run, then in a later run `base=USD` (previously reliable) also failed, then
  `base=EUR` worked. This isn't tied to one specific currency being a bad `base` — it reads as
  general intermittent unreliability of a free, unauthenticated API under rapid polling, possibly
  informal throttling. Mitigated with: one retry per direction, then trying the *inverse* query
  (`base=to, symbols=from`, inverting the result) with its own retry, before giving up.
- **Never throws** — if every attempt fails, falls back to 1:1 and logs loudly. This mirrors the
  "never lose the user's transaction" fallback philosophy used for Gemini (`aiCategorizer.ts`) and
  OCR (`ocrParser.ts`), but is a sharper trade-off here: a silent 1:1 between currencies that aren't
  actually near parity (INR/USD ≈ 95x apart) produces a **badly wrong number**, not just a
  degraded-but-plausible one. Acceptable for a first pass given Frankfurter's failures were
  transient/recoverable via retry in practice, but flagged as the top known risk of this feature.
  A production hardening pass should replace the request-path API call with a cron job that
  pre-fetches and caches the full rate table on a schedule, so a live transaction save never
  depends on a third-party API responding within the request window at all.

## Schema (`models/Transaction.ts`)

```ts
currency: string;              // ISO 4217, required, default "INR"
amountInBaseCurrency: number;  // amount converted to the user's account currency at save time
exchangeRate: number;          // the currency -> account-currency rate used, default 1
```

`amountInBaseCurrency`'s Mongoose default is a **function** (`() => this.amount`), not a static
value — this matters because Mongoose applies schema defaults whenever a document is hydrated
(loaded from the DB) and the field is `undefined`, not just on creation. That means transactions
saved before this migration "heal" themselves the moment they're next loaded via `find()`/`save()`,
without a migration script. Aggregation pipelines bypass document hydration entirely though (they
read raw collection documents), so every aggregation that sums this field uses
`{ $ifNull: ["$amountInBaseCurrency", "$amount"] }` (exported as `BASE_AMOUNT_EXPR` from
`services/budgetChecker.ts`) as a second safety net for the same legacy-document case.

## Supported currencies (`packages/shared/currencies.ts`)

INR, USD, EUR, GBP, SGD, AUD, CAD, JPY, CHF, HKD — each with a `locale` (for `Intl.NumberFormat`
digit grouping, e.g. INR's lakh/crore grouping vs. USD's thousands — this is a **locale** property,
not a currency one, which was a real bug in the original `formatCurrency()`: it hardcoded `en-IN`
regardless of the currency passed in, so a USD amount would've rendered with Indian digit grouping).
List curated to what's confirmed available from Frankfurter (checked directly — e.g. AED is
supported by the app's category/UPI concerns generally but Frankfurter's ECB-sourced rates don't
cover it, so it's excluded from the picker rather than silently falling back to a wrong rate).

## Where currency shows up

- **AI/OCR-parsed transactions** are always `currency: "INR"` — UPI is India-only, so this is
  correct by construction, not a limitation.
- **Manual entry** (`transaction/new.tsx`) has a `CurrencyPicker`, defaulting to the user's account
  currency.
- **Transaction detail** shows the amount in its own currency, plus a "≈ [account currency]
  ([rate])" line when they differ.
- **Transaction list / cards** show each transaction's own currency (not converted) — you see what
  you actually spent, in what you actually spent it in.
- **Home hero total, Budgets, SpendingChart, analytics** are always in the account currency (sums of
  `amountInBaseCurrency`) — `BudgetProgressBar`/`SpendingChart` take an explicit `currency` prop from
  callers (`user.currency`) rather than defaulting, since silently defaulting to INR here was the
  same class of bug as the `formatCurrency` locale issue.
- **Profile** — currency is now editable (was display-only before this pass, despite the backend
  already supporting it since Phase 2's `PATCH /api/auth/me`).

## Fixed alongside this: `Alert.alert` doesn't work on web

Found while testing the budgets delete flow: React Native Web doesn't render a usable dialog for
`Alert.alert`'s button list, so tapping "Delete" appeared to do nothing (no crash, no visible error
— the confirmation dialog just never appeared, so the confirm action was never reached). Added
`utils/confirm.ts` (`confirmAction()`), which uses the real `Alert.alert` on native and
`window.confirm` on web. Replaced all three prior `Alert.alert` call sites (budget delete,
transaction delete, logout).

## Fixed alongside this: budgets "add category" form UX

The category picker in the budgets add-form was an always-expanded horizontal chip strip
(`CategoryPicker`, fine elsewhere where it has more room — manual add, transaction edit,
share-intent confirm) that felt cluttered stacked above the period toggle, limit input, and submit
button all in one card. Replaced with `components/CategoryDropdown.tsx` — a compact "tap to open a
bottom-sheet list" selector (plain RN `Modal`, no new dependency) — scoped to just this form. Also
added a close (×) button to the add-form header, since there was previously no way to cancel out of
it once opened short of submitting.

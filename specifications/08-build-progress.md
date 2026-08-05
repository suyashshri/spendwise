# Build Progress Log

Living log, updated as work lands. Newest entries at the top.

---

## Phase 1 — Backend Core

Status: **complete**, verified end-to-end against a local MongoDB (Docker) and no live Gemini key
(exercised the AI-fallback path — see notes below).

- [x] Test `POST /api/parse/text` end-to-end with sample UPI string
- [x] Seed default categories script
- [x] Transaction CRUD routes
- [x] AI categorizer service + parse routes (core feature)
- [x] Auth routes + JWT middleware
- [x] Middleware: auth, validation (Zod), errorHandler
- [x] Mongoose models: User, Transaction, Budget, Category
- [x] `packages/shared`: types, categories, constants
- [x] `packages/server` project scaffold (package.json, tsconfig, index.ts, DB connection)
- [x] Monorepo skeleton: npm workspaces root, folder structure, `.env.example`, `.gitignore`
- [x] Specification files written (this folder)

Not built in Phase 1 (intentionally deferred per the brief's phase plan):
- `POST /api/parse/image` — route exists and is auth-protected, but returns a `400 NOT_IMPLEMENTED`
  until OCR lands in Phase 3.
- `/api/budgets/*` and `/api/analytics/*` routes — `Budget` model and `services/budgetChecker.ts`
  exist and are called from the parse flow, but the CRUD/analytics HTTP routes themselves are Phase 3.

## Phase 2 — Mobile App (MVP)

Status: **complete** for what's buildable/verifiable without a physical device or simulator (none
available in this environment — see verification log below).

- [x] Expo project scaffold (SDK 57, Expo Router, TypeScript) restructured to match the spec's
      folder layout (`app/`, `components/`, `hooks/`, `services/`, `store/`, `utils/` at project root)
- [x] `services/api.ts` (axios + auth interceptors with refresh-on-401), `store/authStore.ts`
      (SecureStore-persisted), `store/transactionStore.ts`, currency/date utils
- [x] Auth screens (login/register) + `Stack.Protected`-based auth gating in `app/_layout.tsx`
- [x] Tab navigation (`(tabs)`: Home, Transactions, Budgets, Profile) + Home screen (monthly summary,
      category breakdown chart, recent transactions)
- [x] Full transaction list with category filters, manual add form, detail/edit screen
- [x] Share-intent handler — `app/+native-intent.ts`, `ShareIntentProvider` wiring, confirmation
      screen with duplicate/error/empty states (see [09-mobile-app.md](09-mobile-app.md))
- [x] Budgets tab (overall monthly budget vs. spend, editable) + Profile tab (account info, logout)
- [x] `PATCH /api/auth/me` added to the backend so the Budgets tab is genuinely functional (see
      [03-api-endpoints.md](03-api-endpoints.md))
- [x] `getCategoryMeta()` helper added to `packages/shared/categories.ts` for icon/color lookups
      shared by `CategoryPill`/`CategoryPicker`/`SpendingChart`

Not built in Phase 2 (intentionally deferred): Google OAuth on mobile (`expo-auth-session`) — email/
password only for now; offline queue/sync (Phase 5); push notifications (Phase 5).

## Phase 3 — Intelligence Layer

Status: **complete**, verified end-to-end against the local dev server (see verification log below).

- [x] OCR screenshot parsing (`services/ocrParser.ts`, Tesseract.js) — `POST /api/parse/image` now
      fully implemented instead of `400 NOT_IMPLEMENTED`; multer memory-storage upload, 8MB cap
- [x] Budgets CRUD (`routes/budgets.ts`) — spent/remaining computed live from `Transaction`, not
      denormalized onto `Budget`
- [x] Analytics (`routes/analytics.ts`) — summary, trends, compare, top-merchants
- [x] Recurring transaction detection (`services/recurringDetector.ts`) — runs incrementally after
      every transaction save, no cron needed
- [x] Mobile: Budgets tab now has a real "Category budgets" section (add/list/delete) wired to
      `GET/POST/DELETE /api/budgets` via a new `store/budgetStore.ts` + `hooks/useBudgets.ts`
- [x] `specifications/11-phase3-intelligence-layer.md` documents all of the above in detail

See [11-phase3-intelligence-layer.md](11-phase3-intelligence-layer.md) for the recurring-detection
algorithm and its known limitation (exact-string merchant matching — "Netflix" vs "NETFLIX.COM"
wouldn't be linked).

## Post-Phase-3 additions (user-requested, outside the phase numbering)

Status: **complete**, verified end-to-end.

- [x] Mobile UI redesign — real icons, elevation, gradients, motion (see
      [10-mobile-design-system.md](10-mobile-design-system.md))
- [x] In-app screenshot upload (`expo-image-picker`) — the OCR path from Phase 3 was share-intent-only
      before, which needs a custom dev client to even test; added a reachable in-app entry point
      (Home + Transactions tab) hitting the same `POST /api/parse/image` pipeline
- [x] Multi-currency support — per-transaction currency, account-currency conversion via Frankfurter,
      re-conversion on account-currency change (see [12-multi-currency.md](12-multi-currency.md))
- [x] Custom categories — users can create their own categories beyond the 11 defaults; fixed an
      AI-prompt category-leakage bug this surfaced (see
      [13-custom-categories.md](13-custom-categories.md))
- [x] Cross-platform confirm dialogs (`utils/confirm.ts`) — `Alert.alert` doesn't render on React
      Native Web, so delete/logout confirmations silently did nothing on web

## Phase 4 — Web Dashboard

Status: **not started**

## Phase 5 — Polish

Status: **not started**

---

## Verification log (Phase 1)

Ran locally against a throwaway `mongo:7` Docker container (`spendwise-mongo-test`, port 27018) with
no `GEMINI_API_KEY` set, to prove both the happy path plumbing and the AI-down fallback path:

1. `npm run seed:categories` — seeded all 11 default categories.
2. `npm run dev:server` — booted clean, connected to MongoDB, listening on :4000.
3. `POST /api/auth/register` + `/login` — issued a valid access/refresh token pair; response
   correctly stripped `passwordHash`.
4. `POST /api/parse/text` with `"Paid ₹450 to Swiggy via PhonePe. UPI Ref: 423876234523"` — with no
   Gemini key configured, this exercised `aiCategorizer.ts`'s degraded fallback: regex-extracted
   `amount: 450`, `merchant: "Swiggy"`, saved with `category: "Miscellaneous"`, `confidence: 0`,
   `needsReview: true`. Confirms a parse never fails outright even when the AI is unreachable.
5. `POST /api/transactions` (manual entry) and `GET /api/transactions` — manual add and paginated
   listing both work and coexist with AI-parsed transactions in the same collection.
6. Re-sent the same UPI text twice — second call correctly returned `duplicate: true` against the
   existing document instead of creating a second one (see fix below).
7. `GET /api/nope` → `404 ROUTE_NOT_FOUND`; `GET /api/transactions` with no token → `401`. Confirms
   `errorHandler`/`requireAuth` wiring.

**Fix made during verification**: the AI fallback path originally left `upiRefId: null`, silently
disabling dedup whenever Gemini was down — even though the raw share text almost always contains an
explicit `UPI Ref: ...` / `Ref No. ...` string. Added `fallbackUpiRefId()` (regex) to
`aiCategorizer.ts` so dedup keeps working in the degraded path too. Re-verified: identical re-shared
text now returns `duplicate: true` on the second call.

**Not verified**: the real Gemini happy path (no `GEMINI_API_KEY` was available in this environment).
The code path (`callGemini` → JSON parse → `isValidParseResult` shape check → one retry → fallback)
should be exercised with a real key before shipping — this is the highest-risk untested piece of
Phase 1.

## Verification log (Phase 2)

No iOS Simulator, Android emulator, or physical device was available in this environment (no Xcode,
no Android SDK — confirmed via `xcrun simctl` / `which emulator adb` all failing), and
`expo-share-intent` specifically requires a custom dev client rather than Expo Go, so on-device
verification of the share-intent flow (the most important untested piece) was not possible here. What
was verified:

1. `npx tsc --noEmit` — clean, zero errors across the whole app.
2. `npx expo export --platform web` — full static export succeeded and pre-rendered all 15 routes
   (`/`, `/auth/login`, `/auth/register`, `/(tabs)`, `/(tabs)/transactions`, `/(tabs)/budgets`,
   `/(tabs)/profile`, `/transaction/new`, `/transaction/[id]`, `/share-intent`, etc.) without import
   or render-time crashes — this exercises every screen's component tree, hook usage, and the
   `Stack.Protected` auth-gating logic, just not on a real device and not the native share-intent
   module itself (which no-ops outside a custom dev client).
3. `npx expo install --check` — dependency versions confirmed compatible with Expo SDK 57.

**Before shipping**, this needs real-device verification of: the share-intent flow end-to-end
(cold-launch via `+native-intent.ts` redirect, and foreground-receive via the `hasShareIntent` effect
in `app/_layout.tsx`), SecureStore token persistence across app restarts, and the iOS App Group /
Android intent filter configuration actually registering SpendWise in each platform's native share
sheet.

---

## Verification log (Phase 3)

Ran against the same local dev setup as Phase 1/2 (Docker MongoDB, dev server on :4000, no live
`GEMINI_API_KEY` — so text/image parsing again exercised the AI-fallback path, not real Gemini):

1. `npm run typecheck:server` and `npx tsc --noEmit` (mobile) — both clean.
2. OCR: generated a synthetic UPI-confirmation screenshot (Pillow, rendered "Paid Rs.680 to Dominos
   Pizza via PhonePe UPI, UPI Ref No: 887766554433") and sent it to `POST /api/parse/image` for real
   — Tesseract.js OCR'd it correctly, and the extracted text flowed through the exact same
   fallback-regex parse path as `/text`, correctly pulling `amount: 680`, `merchant: "Dominos
   Pizza"`, `upiRefId: "887766554433"`.
3. Budgets: created a Food & Dining monthly budget via `POST /api/budgets`, confirmed `GET
   /api/budgets` returns correct `spent`/`remaining` scoped to the current month (correctly excluded
   an older transaction from a prior month), and confirmed a duplicate `{category, period}` create
   returns `409`.
4. Analytics: `summary`, `trends`, `compare`, and `top-merchants` all hit against real seeded
   transaction data and returned correctly-aggregated, correctly-scoped results (verified `compare`'s
   `delta` sign and `byCategory` percentages summed sensibly).
5. Recurring detection: created three ₹499 "Netflix" transactions one calendar month apart via
   manual add — the 1st and 2nd stayed `isRecurring: false`, and the 3rd correctly flipped all three
   to `true` in one call, confirming both the "needs 3 occurrences" threshold and the "back-fill
   earlier months once the pattern is confirmed" behavior.
6. `npx expo export --platform web` — all 15 routes still export cleanly after the Budgets tab's new
   category-budgets UI.

**Not verified**: the real Gemini happy path (same caveat as Phase 1 — no live API key in this
environment) and Tesseract.js OCR against an actual phone screenshot (only a synthetic rendered test
image was available here — real screenshots have compression artifacts, variable fonts/DPI, and UI
chrome around the text that could behave differently). Both are worth a real-key/real-screenshot pass
before shipping.

---

## Notes / decisions made along the way

- `packages/server` is a workspace member even though it lives under `packages/` not `apps/` — kept
  to match the folder structure given in the brief exactly.
- `Budget.category` uses the sentinel `"Overall"` for a whole-month budget not tied to a specific
  category, avoiding a separate schema/endpoint just for the overall-budget case.
- Category keyword list is defined once in `packages/shared/categories.ts` and consumed by both the
  DB seed script and the AI prompt builder, so they can't drift.
- `packages/shared` compiles to `dist/` (own `tsconfig.json` + `build` script) rather than being
  consumed as raw `.ts` — needed so `packages/server`'s `rootDir: "src"` TypeScript config doesn't
  choke on cross-package imports (TS6059). `npm run build:shared` runs automatically before
  `dev:server`/`build:server`/`typecheck:server`/`seed:categories` at the root `package.json` level.
- `config.ts` (not `env.ts`) eagerly validates all required env vars once at import time and throws
  a single combined error listing everything missing, rather than failing lazily/one-at-a-time the
  first time each var happens to be read — per explicit user direction, so misconfiguration is caught
  before the server does anything else. It resolves `.env` relative to its own file location
  (4 levels up to repo root), not `process.cwd()`, since workspace scripts run with cwd set to the
  workspace package dir.
- `multer` was added to `package.json` speculatively for the image-parse route, then removed —
  unused until the OCR path is actually implemented in Phase 3; will be re-added then.
- Mobile app's routing/component folders were moved from `create-expo-app`'s default `src/app`,
  `src/components`, `src/hooks` layout to the project root, to match the folder structure in
  [01-monorepo-structure.md](01-monorepo-structure.md). Demo-only scaffold files (animated splash,
  glass-effect tab bar) were deleted; the theming primitives (`ThemedText`, `ThemedView`, `useTheme`,
  `constants/theme.ts`) were kept and extended.
- Share-intent's Expo Router wiring (`+native-intent.ts`, `ShareIntentProvider` placement,
  `hasShareIntent` redirect effect) was verified against the package's own
  `example/expo-router` reference on GitHub rather than guessed, since getting this wrong would
  silently break the app's core interaction. Full details in [09-mobile-app.md](09-mobile-app.md).
- Budgets tab needed `User.monthlyBudget` to actually be settable, so `PATCH /api/auth/me` was added
  (small, in-scope addition to the already-existing auth route family) rather than either faking the
  UI or pulling the whole Phase 3 `Budget` CRUD forward.
- `multer` was re-added at `^2.2.0` (not the vulnerable `1.x` line originally removed in Phase 1)
  now that `/api/parse/image` is actually implemented; `@types/multer@^2.2.0` alongside it since
  multer 2.x doesn't bundle its own type declarations.
- OCR went with Tesseract.js over Google Cloud Vision (the spec listed both as options) specifically
  to avoid requiring a GCP project/billing/credentials to get screenshot parsing working at all — see
  [11-phase3-intelligence-layer.md](11-phase3-intelligence-layer.md) for the tradeoff in detail.
- `Budget`'s `spent`/`remaining` are computed live from `Transaction` on every read rather than
  stored on the `Budget` document, so editing/deleting a transaction is instantly reflected without
  any denormalization to keep in sync — same pattern the Phase 1 `budgetChecker.ts` already used,
  now shared via an exported `periodStart()` so the two can't compute "current period" differently.

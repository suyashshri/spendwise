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

Status: **not started**

## Phase 3 — Intelligence Layer

Status: **not started**

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

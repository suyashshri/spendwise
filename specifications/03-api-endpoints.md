# API Endpoints

Base path: `/api`. All routes except `/api/auth/*` require `Authorization: Bearer <accessToken>`.
See [04-auth-flow.md](04-auth-flow.md) for token details.

## Auth

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{ email, password, name }` | `{ user, accessToken, refreshToken }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| POST | `/api/auth/google` | `{ idToken }` | `{ user, accessToken, refreshToken }` |
| POST | `/api/auth/refresh` | `{ refreshToken }` | `{ accessToken }` |
| GET | `/api/auth/me` | — (protected) | `{ user }` |
| PATCH | `/api/auth/me` | `{ name?, currency?, monthlyBudget? }` | `{ user }` — added in Phase 2 so the mobile Budgets/Profile tabs can set `User.monthlyBudget` (the field existed on the model since Phase 1 but nothing wrote to it) |

## Parser — core feature (protected)

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/parse/text` | `{ text: "Paid ₹450 to Swiggy..." }` | parsed & saved `{ transaction }` |
| POST | `/api/parse/image` | multipart/form-data, field `screenshot` | OCR -> parsed & saved `{ transaction }` |
| POST | `/api/parse/categorize` | `{ transactionId, category }` | `{ transaction }` (re-categorized, treated as a correction signal) |

### `POST /api/parse/text` logic

1. Receive raw shared text (`rawInput`).
2. Send to Gemini with the prompt in [05-ai-categorization.md](05-ai-categorization.md).
3. Parse the AI's JSON response: `amount`, `merchant`, `date`, `upiRefId`, `suggestedCategory`, `confidence`.
4. If `upiRefId` is present, check for an existing `Transaction` with the same `upiRefId` for this
   user — if found, return the existing transaction with `duplicate: true` instead of creating a new one.
5. Save to `Transaction` (`inputType: "share_text"`, `needsReview: confidence < 0.7`).
6. Check budget limits for the assigned category (and overall budget) via `budgetChecker.ts`; if a
   threshold configured in `Budget.alertAt` is crossed, trigger a push notification.
7. Return the saved transaction to the client.

## Transactions (protected)

| Method | Path | Query / Body | Notes |
|---|---|---|---|
| GET | `/api/transactions` | `?month=7&year=2026&category=Food&page=1&limit=20` | Paginated, filterable list |
| GET | `/api/transactions/:id` | — | Single transaction |
| POST | `/api/transactions` | `{ amount, merchant, category, date, note? }` | Manual add (`inputType: "manual"`, `confidence: 1`) |
| PATCH | `/api/transactions/:id` | `{ category?, note?, amount?, merchant? }` | Partial edit |
| DELETE | `/api/transactions/:id` | — | Delete |

## Budgets (protected)

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/budgets` | — | All budgets for current user, each annotated with `spent` (computed from `Transaction` for the current period) and `remaining` |
| POST | `/api/budgets` | `{ category, limit, period, alertAt }` | `category: "Overall"` for a whole-month budget |
| PATCH | `/api/budgets/:id` | `{ limit?, alertAt?, isActive? }` | |
| DELETE | `/api/budgets/:id` | — | |

## Analytics (protected)

| Method | Path | Query | Response shape |
|---|---|---|---|
| GET | `/api/analytics/summary` | `?month=7&year=2026` | `{ totalSpent, byCategory: [{category, amount, percent}], transactionCount }` |
| GET | `/api/analytics/trends` | `?months=6` | `[{ month, year, totalSpent }]` |
| GET | `/api/analytics/compare` | `?month1=6&month2=7&year=2026` | `{ month1: {...summary}, month2: {...summary}, delta }` |
| GET | `/api/analytics/top-merchants` | `?month=7&year=2026&limit=10` | `[{ merchant, totalSpent, count }]` |

## Error shape

All errors return `{ error: { message, code } }` with an appropriate HTTP status. See
`middleware/errorHandler.ts` and the `AppError` class — internal errors (e.g. raw Mongoose/Gemini
error text) are never sent to the client.

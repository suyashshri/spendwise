# Database Schema (MongoDB + Mongoose)

Defined in `packages/server/src/models/`. TypeScript interfaces for these mirror in
`packages/shared/types.ts` so clients get the same shape without duplicating field definitions.

## User (`models/User.ts`)

```ts
{
  _id: ObjectId,
  email: string,              // required, unique, indexed
  name: string,               // required
  passwordHash?: string,      // null for OAuth users
  authProvider: "email" | "google",
  googleId?: string,          // set when authProvider === "google"
  currency: string,           // default "INR"
  categories: string[],       // user's custom categories (beyond defaults)
  monthlyBudget?: number,     // overall monthly budget (separate from per-category Budget docs)
  refreshTokenVersion: number,// bumped to invalidate all outstanding refresh tokens (logout-all)
  createdAt: Date,
  updatedAt: Date
}
```

Indexes: `{ email: 1 }` unique.

## Transaction (`models/Transaction.ts`)

```ts
{
  _id: ObjectId,
  userId: ObjectId,            // ref -> User, indexed
  amount: number,               // required, in `currency` (NOT necessarily the user's account currency)
  currency: string,             // ISO 4217, default "INR" — see specifications/12-multi-currency.md
  amountInBaseCurrency: number, // `amount` converted to the user's account currency AT SAVE TIME (never recomputed)
  exchangeRate: number,         // the currency -> account-currency rate used, default 1
  merchant: string,             // required, extracted by AI (e.g., "Swiggy")
  category: string,             // AI-assigned or user-chosen, indexed (e.g., "Food & Dining")
  rawInput: string,             // original shared text or OCR output (debugging/reprocessing)
  inputType: "share_text" | "screenshot" | "manual",
  upiRefId?: string,            // UPI reference number - DEDUP KEY, unique sparse index
  date: Date,                   // transaction date (extracted or inferred), indexed
  note?: string,                // optional user note
  confidence: number,           // AI categorization confidence (0-1); 1.0 for manual entries
  isRecurring: boolean,         // flagged if similar transactions repeat monthly
  needsReview: boolean,         // true when confidence < 0.7 - surfaced in UI for user confirmation
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:
- Compound: `{ userId: 1, date: -1 }` — primary listing/filter query
- Compound: `{ userId: 1, category: 1 }` — category filters, analytics rollups
- Unique sparse: `{ upiRefId: 1 }` — prevents duplicate transactions when a user shares the same
  payment confirmation twice. Sparse because manual entries and some UPI messages have no ref id.

## Budget (`models/Budget.ts`)

```ts
{
  _id: ObjectId,
  userId: ObjectId,            // ref -> User
  category: string,            // which category this budget applies to. Use the sentinel value
                                // "Overall" for a whole-month budget not tied to one category.
  limit: number,                // spending limit amount
  period: "monthly" | "weekly",
  alertAt: number,              // percentage threshold to send alert (e.g., 80 = notify at 80%)
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes: compound unique `{ userId: 1, category: 1, period: 1 }` — one budget per
category+period per user (prevents duplicate/conflicting budgets for the same scope).

`spent-so-far` is **not** stored on the Budget document — it's computed on read by aggregating
`Transaction` for the current period, so it's always accurate against edits/deletes. See
`GET /api/budgets` in [03-api-endpoints.md](03-api-endpoints.md).

## Category (`models/Category.ts`, seed data + user-created)

```ts
{
  _id: ObjectId,
  name: string,                 // required (e.g., "Food & Dining")
  icon: string,                 // emoji (e.g., "🍔")
  color: string,                // hex color for charts (e.g., "#FF6B6B")
  keywords: string[],           // AI hint keywords (e.g., ["swiggy", "zomato", "restaurant"]); empty for user-created
  isDefault: boolean,           // true for system categories, false for user-created
  userId?: ObjectId             // absent for defaults; set to the owner for user-created categories
}
```

Indexes: compound unique `{ userId: 1, name: 1 }` (not a bare unique on `name`) — lets different
users each have a category of the same name without colliding, while defaults (all `userId`-absent)
stay mutually unique among themselves. See [13-custom-categories.md](13-custom-categories.md).

### Default categories (seeded by `packages/server/src/utils/seedCategories.ts`)

Source of truth for this list is `packages/shared/categories.ts` — the seed script imports it
rather than hardcoding, so the server seed and the AI prompt (which also needs the category names)
never drift apart.

| Name | Icon | Color | Keywords |
|---|---|---|---|
| Food & Dining | 🍔 | #FF6B6B | swiggy, zomato, restaurant, cafe, dominos |
| Groceries | 🛒 | #4ECDC4 | bigbasket, blinkit, dmart, zepto, supermarket |
| Transport | 🚗 | #45B7D1 | uber, ola, rapido, metro, fuel, petrol |
| Shopping | 🛍️ | #F7B731 | amazon, flipkart, myntra, ajio |
| Bills & Utilities | 💡 | #5F27CD | electricity, water, gas, broadband, jio, airtel |
| Rent & Housing | 🏠 | #EE5A6F | rent, maintenance, society |
| Entertainment | 🎬 | #A29BFE | netflix, spotify, hotstar, pvr, inox |
| Health & Medical | 💊 | #26DE81 | pharmacy, hospital, doctor, apollo |
| Investment | 📈 | #FD79A8 | mutual fund, stocks, sip, groww, zerodha |
| Education | 📚 | #54A0FF | course, udemy, books, tuition |
| Miscellaneous | 📦 | #95A5A6 | (none — catch-all) |

## "Track every penny" — how budgets + spend tracking tie together

- Users can set an **overall monthly budget** (`User.monthlyBudget`) and/or **per-category budgets**
  (`Budget` docs with `period: "monthly"` or `"weekly"`).
- Every transaction — regardless of `inputType` (share_text / screenshot / manual) — lands in the
  same `Transaction` collection, so budget math and analytics never need to special-case how an
  expense was entered.
- `GET /api/analytics/summary` and `GET /api/budgets` are the two read paths dashboards use: the
  former for "where did my money go" breakdowns, the latter for "how close am I to my limit" bars.

# Custom Categories

Before this: `User.categories: string[]` existed in the schema since Phase 1 ("user's custom
categories, beyond defaults") but nothing ever wrote to it, no API exposed it, and every category
picker in the mobile app (`CategoryPicker`, `CategoryDropdown`, `CategoryAvatar`) rendered the 11
hardcoded defaults from `packages/shared/categories.ts` — a static import, not a fetch. Users were
stuck with exactly those 11 (or "Miscellaneous" as a catch-all). Found and fixed in this pass.

## Design: `Category` documents, not `User.categories` strings

Went with full `Category` documents (icon + color + `userId`) rather than the vestigial
`User.categories: string[]` field, since a usable category needs an icon/color to render anywhere
in the UI — a bare name wouldn't. `User.categories` is now unused; not removed from the schema in
this pass (removing a field is a separate, lower-priority cleanup), but nothing reads or writes it.

- `userId` absent → default/system category, seeded once via `seedCategories.ts`, shared by everyone.
- `userId` set → belongs to that one user.
- Compound unique index `{ userId: 1, name: 1 }` instead of a bare unique on `name` — see
  [02-database-schema.md](02-database-schema.md) for why. Route-level validation
  (`routes/categories.ts`) additionally blocks a user from creating a custom category whose name
  collides (case-insensitive) with a *default* category — the index alone wouldn't catch that,
  since `(userId, name)` and `(undefined, name)` are different keys.

## API (`routes/categories.ts`)

- `GET /api/categories` → `Category.find({ $or: [{ isDefault: true }, { userId } ] })` — one unified
  list, defaults plus this user's own.
- `POST /api/categories` → `{ name, icon, color }`. `keywords` always starts empty for user-created
  categories (AI keyword-grounding is a nice-to-have here, not required — see below).
- `DELETE /api/categories/:id` → scoped to `{ _id, userId: req.user.id }`, so a default (no
  `userId`) can never match and always 404s for a delete attempt — verified directly (attempted
  deleting a default, got `404`; deleting an owned custom category, got `204`).

## The bug this would have caused if shipped without a fix: category leakage into the AI prompt

`aiCategorizer.ts`'s `Category.find({}, "name keywords")` — **no filter** — was fetching every
category in the whole collection, including *other users'* custom ones, and passing all of them
into the Gemini prompt as valid `suggestedCategory` options for whoever happened to be sharing a
UPI payment at that moment. Once custom per-user categories existed, this would have let the AI
suggest one user's private category name for another user's transaction. Fixed by threading `userId`
through `categorizeTransactionText(rawText, userId)` (called from `parseAndSaveTransaction` in
`routes/parse.ts`) and scoping the query the same way as `GET /api/categories`:
`{ $or: [{ isDefault: true }, { userId } ] }`.

## Mobile: from static import to fetched store

- `store/categoryStore.ts` + `hooks/useCategories.ts` — fetched once, kicked off in
  `app/(tabs)/_layout.tsx` (mounted once per authenticated session) so the store is warm before any
  screen's category UI needs it. Falls back to the static `DEFAULT_CATEGORIES` (mapped into the
  `Category` shape) before the first fetch resolves or if it fails, so pickers never show a blank
  state.
- `CategoryAvatar` subscribes directly to `useCategoryStore` (not through `useCategories()`) so
  every icon-in-circle anywhere in the app (`TransactionCard`, `SpendingChart` rows, transaction
  detail, `ShareIntentPreview`) is reactive to newly-created categories without prop drilling.
- `CategoryPicker` (chip strip) and `CategoryDropdown` (bottom-sheet select) both render the fetched
  list plus a trailing/footer "+ New" entry that opens `CreateCategoryModal`.
- Transactions tab's filter chips and the Budgets add-form's `availableCategories` check both switched
  from `DEFAULT_CATEGORY_NAMES` to the fetched list, so a custom category is filterable and
  budget-able just like a default one.

## `CreateCategoryModal`

Minimal, bounded creation form — name (text), icon (16 curated emoji choices), color (8 curated hex
swatches) — rather than a full emoji picker or freeform color input, to keep the form small and the
result visually consistent with the existing default categories' style. Reused from both
`CategoryPicker` and `CategoryDropdown` (each manages its own open/close state and calls
`useCategories().addCategory`, then auto-selects the newly created category via the picker's
`onChange`).

## Verified end-to-end

Created a custom "Side Hustle" category (💼, `#00B894`), used it as the category on a manual
transaction, confirmed a duplicate-of-default name attempt 409s, confirmed deleting a default 404s
and deleting the owned custom category 204s and the list returns to 11 afterward.

## Known gaps / not done in this pass

- No **edit** endpoint for a custom category (rename/re-icon/re-color) — only create and delete.
- `keywords` on user-created categories always starts empty, so the AI has no grounding hint for a
  custom category the way it does for defaults (e.g. "swiggy" → Food & Dining). A custom category
  can still be *manually* selected/edited onto any transaction; it just won't be
  auto-suggested by the AI parser with the same keyword confidence defaults get.
- No usage check on delete — deleting a custom category that's already applied to existing
  transactions doesn't touch those transactions (they store the category as a plain string, not a
  foreign key), so they keep showing that category name/label correctly, but the category won't
  reappear in pickers to be re-selected once deleted.

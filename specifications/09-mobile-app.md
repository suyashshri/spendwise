# Mobile App (`apps/mobile`)

Expo SDK 57, Expo Router (file-based, typed routes), Zustand, TypeScript. Scaffolded from
`create-expo-app`'s `default` template then adapted: routing/component folders were moved from the
template's `src/` convention to the repo root (`app/`, `components/`, `hooks/`) to match the folder
structure in [01-monorepo-structure.md](01-monorepo-structure.md); demo-only files (animated splash
icon, glass-effect tab bar, example screens) were removed. `ThemedText`/`ThemedView`/`useTheme` and
`constants/theme.ts` (light/dark color tokens) were kept from the template as the app's theming
primitives and extended with `border`/`primary`/`danger`/`warning`/`success` tokens.

## Auth

- `store/authStore.ts` — Zustand store for `user`/`accessToken`/`refreshToken`, persisted via
  `store/secureStorage.ts`, a `zustand/middleware` `StateStorage` adapter backed by
  **`expo-secure-store`** (iOS Keychain / Android Keystore) rather than AsyncStorage, since this store
  holds JWTs — see [04-auth-flow.md](04-auth-flow.md).
- `services/api.ts` — shared axios instance. Request interceptor attaches the access token. Response
  interceptor catches `401`s, exchanges the refresh token via `POST /auth/refresh` (deduplicated with
  an in-flight `refreshPromise` so concurrent 401s don't fire multiple refreshes), retries the
  original request once, and logs the user out if the refresh itself fails.
- `hooks/useAuth.ts` — thin wrapper exposing `login`/`register`/`logout`/`updateProfile` plus
  `isAuthenticated`/`hasHydrated`.
- Routing is auth-gated with Expo Router's `Stack.Protected` (`app/_layout.tsx`): one protected group
  for `(tabs)` + `transaction/*` + `share-intent` guarded by `isAuthenticated`, another for
  `auth/login` + `auth/register` guarded by `!isAuthenticated`. No manual redirect logic needed — the
  guard flipping after login/logout is enough for Expo Router to swap the active group.
- `hasHydrated` (from the persist middleware's `onRehydrateStorage`) gates the initial render so the
  app doesn't flash the login screen before SecureStore has been read.

### `PATCH /api/auth/me` (added in Phase 2)

The `User` model has had `monthlyBudget`/`currency` fields since Phase 1, but no endpoint wrote to
them. Added a small profile-update endpoint (`packages/server/src/routes/auth.ts`) so the mobile
Budgets tab can actually set a monthly budget rather than the screen being a non-functional stub.
See [03-api-endpoints.md](03-api-endpoints.md).

## Screens (`app/`)

| Route | Purpose |
|---|---|
| `auth/login.tsx`, `auth/register.tsx` | Email/password auth forms |
| `(tabs)/index.tsx` | Home — this month's total spend, category breakdown chart, 5 most recent transactions |
| `(tabs)/transactions.tsx` | Full list with category filter chips, pull-to-refresh, "+ Add" |
| `(tabs)/budgets.tsx` | Overall monthly budget vs. spend-to-date (editable), category breakdown chart |
| `(tabs)/profile.tsx` | Account info, currency, sign-in method, log out |
| `transaction/new.tsx` | Manual expense entry (modal) — amount, merchant, category picker, note |
| `transaction/[id].tsx` | Detail/edit — category, note, delete; falls back to `GET /transactions/:id` if the transaction isn't already in the store (e.g. a cold start landing directly on this route) |
| `share-intent.tsx` | Share-intent confirmation screen — see below |

State/data comes from `store/transactionStore.ts` (Zustand; fetch/add/update/delete against the
API — no offline persistence yet, that's Phase 5) via `hooks/useTransactions.ts`, which also derives
the monthly total and category breakdown client-side from the fetched month's transactions (no
dependency on the Phase 3 `/api/analytics/*` routes).

### Why budgets are client-computed for now

`/api/budgets/*` CRUD routes are Phase 3. The Budgets tab is still fully functional today because it
only needs two things that already exist: `User.monthlyBudget` (settable via the new `PATCH
/auth/me`) and this month's transactions (already fetched for Home). Per-category budgets with
alert thresholds will replace/extend this once the Phase 3 routes land.

## Components

`TransactionCard`, `CategoryPill`, `CategoryPicker` (horizontal scroll of the 11 default categories,
shared by manual-add, edit, and share-intent confirm), `SpendingChart` (dependency-free horizontal
bar chart — no charting library added for this), `BudgetProgressBar`, `ShareIntentPreview`.

## In-app screenshot upload (`expo-image-picker`)

The share-intent flow below is the primary path, but it only works via the OS share sheet — a
custom dev client is required to test it at all (Expo Go can't), which makes it hard to reach.
`hooks/useScreenshotUpload.ts` adds a second, in-app entry point to the exact same OCR pipeline:
pick an image from the photo library (`expo-image-picker`) → `POST /api/parse/image` (the same
`services/shareIntent.ts` → `parseSharedImage()` the share-intent screen uses) → navigate to
`/transaction/:id` to review/edit the result. No new confirmation UI needed — it reuses the existing
transaction detail screen instead of duplicating `ShareIntentPreview`.

Exposed from two places for discoverability: a "Scan screenshot" button next to "Add manually" on
Home, and an icon button in the Transactions tab header next to "+ Add". Requires
`expo-image-picker`'s config plugin in `app.json` (`photosPermission`/`cameraPermission` — iOS
requires a usage-description string for the permission prompt to show at all).

## Share intent (`expo-share-intent`)

This is the app's core interaction and needed care to get the Expo Router wiring right — verified
against the package's own `example/expo-router` reference (fetched from
`github.com/achorein/expo-share-intent`) rather than guessed:

1. **`app/+native-intent.ts`** — Expo Router's special "intercept before routing" file. When a share
   extension launches the app via a deep link containing the share payload
   (`<scheme>://dataUrl=<key>...`), this redirects straight to `/share-intent` before the router does
   its normal route resolution. This is what makes a **cold launch from the share sheet** land on the
   confirmation screen instead of the last-open tab.
2. **`app/_layout.tsx`** — wraps the whole app in `<ShareIntentProvider>` (outermost, per the
   package's own guidance, before `SafeAreaProvider`/`ThemeProvider`). A nested `AppNavigator`
   component reads `useShareIntentContext().hasShareIntent` and calls `router.replace('/share-intent')`
   whenever it flips true — this is the belt-and-suspenders path for when the app is **already running
   in the foreground** and receives a new share (no fresh deep-link navigation happens in that case,
   so `+native-intent.ts` alone wouldn't catch it).
3. **`app/share-intent.tsx`** — reads `shareIntent.text` or `shareIntent.files[0]` from
   `useShareIntentContext()`, sends it to the backend once (`services/shareIntent.ts` →
   `POST /parse/text` or `POST /parse/image`), and renders `ShareIntentPreview` with the already-saved
   transaction for the user to confirm or correct the category/note before dismissing
   (`resetShareIntent()` + navigate home). Handles three non-happy paths explicitly: no shared content
   (`empty`), a `duplicate: true` response (shows the existing transaction with a banner instead of
   pretending a new one was created), and a parse error (shows the message with an "Add manually" CTA
   into `transaction/new.tsx` rather than a dead end).
4. **`app.json`** — `expo-share-intent` config plugin: `androidIntentFilters: ["text/*", "image/*"]`,
   `iosActivationRules` enabling both text and (single) image sharing, and
   `iosAppGroupIdentifier: "group.com.spendwise.app.shareextension"` for the iOS share extension's
   App Group, matching [06-share-intent-flow.md](06-share-intent-flow.md).

**Important constraint carried over from the package itself**: share intent needs native code, so it
cannot run in Expo Go — it requires a custom dev client (`expo prebuild` + `expo run:ios` /
`expo run:android`, or an EAS dev build). This wasn't buildable/testable in the sandboxed environment
this was developed in (no Xcode/Android SDK, no simulator/emulator) — see the verification log in
[08-build-progress.md](08-build-progress.md) for exactly what was and wasn't verified.

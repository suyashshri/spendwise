# CSV / PDF Export

Lets a user download their transaction history — filtered the same way the list they're looking at
is filtered — as a CSV (for spreadsheets) or a formatted PDF report.

## Why server-side generation

Both formats are generated once, on the backend, and both clients (mobile, web) just download
bytes from the same endpoint. The alternative — generating CSV/PDF client-side in each app — would
mean maintaining two independent implementations of "what a SpendWise export looks like" that could
drift out of sync, plus a much heavier mobile bundle (a PDF-layout library running on-device) for no
real benefit, since the device doesn't have anything the server doesn't already have. Same
philosophy as the currency-conversion design in [12-multi-currency.md](12-multi-currency.md):
compute once on the backend, both clients just render/display the result.

## Backend (`packages/server`)

- `GET /api/transactions/export?format=csv|pdf&month=&year=&category=` (`routes/transactions.ts`) —
  reuses the exact same filter logic as `GET /api/transactions` (month/year/category), but with no
  pagination: an export is the whole matching set, sorted chronologically (ascending — reads like a
  statement) rather than the list view's newest-first. Registered *before* the existing `GET /:id`
  route, since Express would otherwise match the literal path segment `export` as an `:id`.
- `services/csvExportService.ts` — `transactionsToCsv()`. Hand-rolled RFC 4180 escaping (quote
  fields containing a comma/quote/newline, double embedded quotes) rather than pulling in a CSV
  library — the format is small and static enough that a dependency would be pure overhead.
- `services/pdfExportService.ts` — `generateTransactionsPdf()`, built with `pdfkit` (pure JS, no
  headless-browser dependency like Puppeteer would need). Header + a total/count summary line +
  a manually laid-out table (fixed column x-offsets, `doc.addPage()` triggered once `y` crosses the
  bottom margin) — no table plugin, since the layout is one simple repeating row shape. Amounts are
  formatted with `Intl.NumberFormat` against the *user's* account currency and locale (reusing
  `getCurrencyInfo` from `@spendwise/shared`, the same helper `pushNotificationService.ts` uses),
  with the original transaction currency appended in parens when it differs from the account
  currency (multi-currency transactions aren't silently re-labelled as the account currency).
- Both formats stream the response with `Content-Disposition: attachment` so a direct browser
  navigation would trigger a download — though in practice both clients fetch this with an
  `Authorization` header rather than navigating directly, since the route is authenticated
  (`requireAuth`) and a raw navigation can't attach a bearer token.

## Mobile (`apps/mobile`)

- `expo-file-system` (the SDK 57 "next" API — `File`/`Directory`/`Paths`, not the older
  `FileSystem.writeAsStringAsync` style) + `expo-sharing`.
- `services/exportTransactions.ts` — `File.downloadFileAsync(url, destination, { headers: {
  Authorization }, idempotent: true })` streams straight to `Paths.cache` with the auth header
  attached to the request, rather than fetching as an arraybuffer/base64 string and writing it out
  in JS — avoids holding a whole export in memory as a JS string for what could be a large history.
  Then `Sharing.shareAsync()` opens the platform share sheet (save to Files, AirDrop, email, etc.).
- `components/ExportSheet.tsx` — a bottom-sheet modal (same pattern as `CategoryDropdown.tsx`) with
  two options, CSV and PDF, launched from a new download icon in the Transactions tab header.
  Honors the tab's active category filter (no month/year filter exists in the mobile UI today, so
  the export isn't scoped by date on mobile — see gap below).

## Web (`apps/web`)

- No new backend-facing code needed — the existing `lib/api.ts` axios instance (BFF-lite auth,
  bearer token attached by an interceptor) already talks to the Express backend directly from the
  browser. `responseType: "blob"` on the export request, then a `URL.createObjectURL` +ephemeral
  `<a download>` click to trigger the browser's native save dialog.
- Export dropdown (shadcn/ui `DropdownMenu`, Base UI-backed) next to "Add expense" on the
  Transactions page, honoring the page's already-selected month/year/category filters — so
  "export" always matches exactly what's on screen.
- Errors surface via `sonner` (`toast.error`) — the `<Toaster />` was already mounted in
  `app/layout.tsx` from scaffolding but nothing had used it yet; this is the first caller.

## Known gaps

- **Mobile export isn't scoped by month/year** — the Transactions tab only filters by category, so
  the mobile export always covers full transaction history (optionally category-filtered). The web
  export, on a page that already has a month picker, is date-scoped. Bringing month/year filtering
  to the mobile Transactions tab would fix this but is a separate, larger UI change.
- **No pagination/streaming for very large histories.** `Transaction.find(filter)` (no `.limit()`)
  loads the whole matching set into memory before generating the file. Fine at the scale a personal
  expense tracker's history reaches; would need a streaming CSV writer and paginated PDF generation
  before it'd hold up for a much larger export.

## Verified

`npm run typecheck` clean on `packages/server` and `apps/mobile`; `npx next build` clean on
`apps/web`. Ran `csvExportService`/`pdfExportService` directly against fixture transaction data
(via `tsx`, not through the DB) and confirmed: CSV output correctly quotes a merchant name
containing a comma and embedded quotes, and the generated PDF starts with the `%PDF` magic bytes at
a non-trivial byte size. **Not verified**: an actual download completing end-to-end on a real
device/browser (share sheet appearing on iOS/Android, the browser's save dialog on web) — no
device/simulator/browser available in this environment, the same gap noted throughout every other
UI-facing feature in these specs.

# Web Dashboard (`apps/web`) — Phase 4

Next.js 16.3.0 (App Router, Turbopack by default), TypeScript, Tailwind CSS v4, shadcn/ui
(`base-nova` style, Base UI primitives rather than Radix — shadcn's current default). Scaffolded via
`create-next-app` + `shadcn init`, theme swapped to the same violet/indigo brand as the mobile app
(`oklch(0.541 0.281 293.009)` ≈ the mobile app's `#6C5CE7`).

## Next.js 16 is not the Next.js in most training data

The scaffold ships its own `AGENTS.md`/`CLAUDE.md` warning about this explicitly, and it's correct
to take seriously — `node_modules/next/dist/docs/` was read directly before writing any routing or
auth code, not assumed from memory. The one that would have silently broken auth if missed:

- **`middleware.ts` is deprecated in favor of `proxy.ts`**, and the exported function is `proxy()`,
  not `middleware()`. Route protection (`apps/web/proxy.ts`) uses the new name from the start.
- **`params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` are fully async** — Next 15's
  synchronous compatibility shim is gone in 16. `lib/session.ts` awaits `cookies()` throughout.

## Auth: custom Route Handlers, not NextAuth

The original spec said "NextAuth on web," but the backend already fully implements JWT auth
(access + refresh, email/password + Google) — pulling in NextAuth would mean either fighting it to
delegate to our own token issuance, or duplicating auth logic Express already owns. Went with a
lighter BFF-style pattern instead, reusing the Express endpoints as-is:

- **Refresh token → httpOnly cookie**, set/read/cleared only by three Next.js Route Handlers
  (`app/api/auth/{login,register,refresh,logout}/route.ts`) via `lib/session.ts`. Browser JS never
  touches it.
- **Access token → in-memory only** (`store/authStore.ts`, no persist middleware) — same reasoning
  as the mobile app's SecureStore choice: don't put a JWT somewhere a script (or, here, anything
  that can read `localStorage`) could exfiltrate it. Lost on a hard refresh by design; recovered
  silently via `POST /api/auth/refresh` on mount (`components/auth-provider.tsx`).
- **`proxy.ts`** only checks whether the refresh cookie *exists* — it can't validate it (that needs
  a network call), so it's a coarse "don't render the protected shell for a fully logged-out
  visitor" gate. The real check is client-side: `app/(dashboard)/layout.tsx` redirects to `/login`
  if hydration finishes with no user.
- **All other API calls go straight from the browser to the Express backend** (`lib/api.ts`, an
  axios instance identical in shape to the mobile app's), not proxied through Next.js — only auth
  needed a server-side hop, since only auth touches the httpOnly cookie. Verified this doesn't need
  any backend CORS changes: cross-origin `Authorization: Bearer` requests (no cookies) already work
  under Express's default permissive `cors()` — confirmed directly with `curl -H "Origin: ..."`
  against a running server, not assumed.

## Data layer

`store/{transaction,budget,category}Store.ts` — Zustand, same shape as the mobile app's stores,
same endpoints, same multi-currency (`amountInBaseCurrency`) and custom-category handling. No
Server Components fetch data (the access token only exists client-side by design), so every
dashboard page is a client component (`"use client"`) fetching on mount — a deliberate trade-off:
loses Next's server-rendering/streaming benefits for this data, in exchange for one auth
architecture shared cleanly across every page instead of a server-side and a client-side path.

## Charts (`dataviz` skill applied)

Loaded the dataviz skill before writing any chart code, per its own trigger condition. Concretely:

- **Category breakdown is a labeled horizontal bar list, not a pie/donut**
  (`components/spending-breakdown.tsx`) — with 11 possible categories, that's past the skill's
  ~7-class ceiling where color alone stops being a safe identity channel. Ran the palette validator
  (`scripts/validate_palette.js`) against the category hex colors originally hand-picked for the
  mobile app (`packages/shared/categories.ts`) and they **fail** CVD-separation and contrast checks
  (worst adjacent pair `#45B7D1`↔`#4ECDC4` at ΔE 7.2, below the 15 normal-vision floor). Not
  re-picking the whole category palette now — that ripples into the already-shipped mobile app — but
  every category-colored chart here carries a direct icon + text label per row specifically *because*
  color alone can't be trusted to distinguish them, which is the validator's own prescribed mitigation
  ("6-8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture").
- **Trends** (`components/trends-chart.tsx`) — single series → one hue (the brand violet), no
  legend needed, 2px line, ~10% area wash, no dual axis.
- **Compare** (`components/compare-chart.tsx`) — "before → after per item," which the skill's form
  table maps to **1 hue, 2 shades**, not two categorical colors (these are the same categories at
  two points in time, not two different identities).
- **Top merchants** (`components/top-merchants-chart.tsx`) — magnitude comparison across merchants
  (not identity), so single-hue horizontal bars, sorted, no legend.

## Verified

No browser was available in this environment to visually inspect rendering (same constraint noted
for the mobile app's earlier phases) — verification here is server-side/protocol-level, not visual:

1. `npx tsc --noEmit` and `npx next build` — both clean; build correctly registers `proxy.ts` as
   Middleware and all 4 dashboard routes + 4 auth Route Handlers.
2. Full auth flow against the live dev server: unauthenticated `/dashboard` → `307` to `/login`;
   register → httpOnly `sw_refresh` cookie set; with cookie, `/dashboard` → `200` and `/login` →
   `307` to `/dashboard` (both proxy.ts branches exercised); `POST /api/auth/refresh` with the
   cookie → fresh access token + user.
3. Direct browser-pattern calls to Express (`Origin: http://localhost:3000` + Bearer token) —
   categories list and manual transaction creation both succeeded, confirming the no-BFF-proxy
   design for non-auth endpoints actually works against the real CORS config, not just in theory.
4. All 6 pages (`/dashboard`, `/transactions`, `/budgets`, `/analytics`, `/login`, `/register`)
   return the expected status when authenticated vs not, with no error-boundary strings in the
   dashboard HTML.

**Not verified**: actual in-browser rendering (React hydration, chart drawing, form interaction,
dialog open/close, dark mode). This is the equivalent gap to the mobile app's "no simulator
available" caveat — worth a real click-through pass before shipping.

## Known gaps

- `GET /api/analytics/compare` takes one `year` shared by both months (see
  [03-api-endpoints.md](03-api-endpoints.md)) — doesn't support comparing across a year boundary
  (e.g. December vs. January). Not fixed here since it's a backend API shape issue, not a web-app
  bug; noted in `app/(dashboard)/analytics/page.tsx` with a comment rather than silently working
  around it.
- No Google OAuth on web (email/password only), matching the same gap already noted for mobile.
- No dark-mode *toggle* — the CSS variables support it (`.dark` class swaps every token, including
  chart colors), but nothing in the UI flips the class yet. Phase 5 item.

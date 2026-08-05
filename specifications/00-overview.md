# SpendWise — Project Overview

## What it is

SpendWise is a full-stack expense tracker that automatically categorizes UPI payments using AI.

**Core UX**: after making a UPI payment (PhonePe, GPay, Paytm, etc.), the user taps "Share" on the
payment success screen, selects SpendWise, and the app automatically extracts the amount, merchant,
date, and assigns a spending category using AI. No manual data entry required for the primary flow.

Two secondary entry paths exist so the product covers *every* expense, not just UPI ones:

1. **Manual entry** — a traditional form (amount, payee/merchant, category, date, note) for cash,
   card, or any non-UPI expense. See [03-api-endpoints](03-api-endpoints.md) `POST /api/transactions`.
2. **Screenshot share** — OCR fallback when a UPI app shares an image instead of text.

Users can also set a **monthly budget** (overall and/or per-category) and see spend-to-date against
it from a dashboard — available on both the mobile app (primary) and the web app (secondary,
better suited to deeper analytics on a larger screen). See [02-database-schema](02-database-schema.md)
`Budget` model and [03-api-endpoints](03-api-endpoints.md) Analytics section.

## Tech stack

| Layer | Choice |
|---|---|
| Mobile app | Expo (React Native) + TypeScript + Expo Router + Zustand |
| Web dashboard | Next.js 14+ (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Express.js + TypeScript + Mongoose |
| Database | MongoDB Atlas |
| AI | Google Gemini API (parsing & categorizing transactions) |
| OCR | Google Cloud Vision API or Tesseract.js (screenshot parsing) |
| Auth | JWT (access + refresh) + Google OAuth |
| File storage | Cloudinary or AWS S3 (uploaded screenshots) |
| Caching | Redis (optional, analytics queries) |
| Push notifications | Expo Notifications (budget alerts) |
| Monorepo | npm workspaces |

## Repo layout

See [01-monorepo-structure.md](01-monorepo-structure.md) for the full tree.

- `apps/mobile` — Expo React Native app (primary client)
- `apps/web` — Next.js dashboard (secondary client, where "every penny" tracking + budgets get a
  full analytics treatment)
- `packages/server` — Express + TypeScript API
- `packages/shared` — types, default categories, constants shared across all three apps

## Specification index

| File | Contents |
|---|---|
| [01-monorepo-structure.md](01-monorepo-structure.md) | Full folder tree and workspace wiring |
| [02-database-schema.md](02-database-schema.md) | Mongoose models, indexes, default categories |
| [03-api-endpoints.md](03-api-endpoints.md) | Every REST route, request/response shape |
| [04-auth-flow.md](04-auth-flow.md) | JWT + Google OAuth flow, token lifetimes |
| [05-ai-categorization.md](05-ai-categorization.md) | Gemini prompt design, confidence handling, fallback |
| [06-share-intent-flow.md](06-share-intent-flow.md) | End-to-end share-intent → parse → confirm flow |
| [07-environment-variables.md](07-environment-variables.md) | All env vars, per app |
| [08-build-progress.md](08-build-progress.md) | Living log of what's built, phase by phase |
| [09-mobile-app.md](09-mobile-app.md) | Mobile app architecture — screens, stores, share-intent wiring |
| [10-mobile-design-system.md](10-mobile-design-system.md) | Mobile design tokens, primitives, and two layout bugs caught during the UI pass |
| [11-phase3-intelligence-layer.md](11-phase3-intelligence-layer.md) | OCR, budgets CRUD, analytics, recurring detection |
| [12-multi-currency.md](12-multi-currency.md) | Per-transaction currency, conversion, exchange rate service |
| [13-custom-categories.md](13-custom-categories.md) | User-created categories, AI prompt scoping fix |

## Build phases (from the original brief)

1. **Backend core** — Express+TS setup, Mongoose models, auth, parse/text, transaction CRUD, seed categories
2. **Mobile app (MVP)** — Expo Router, auth screens, share-intent handler, home + transaction list, manual add
3. **Intelligence layer** — OCR screenshot parsing, budgets + alerts, analytics endpoints, recurring detection
4. **Web dashboard** — Next.js auth, charts, transaction/budget management, analytics views
5. **Polish** — push notifications, offline sync, CSV/PDF export, dark mode, onboarding

Current status is tracked live in [08-build-progress.md](08-build-progress.md).

# Monorepo Structure

npm workspaces, three deployables (`apps/mobile`, `apps/web`, `packages/server`) plus one shared
library (`packages/shared`). `packages/server` lives under `packages/` rather than `apps/` per the
original brief, even though it's a deployable — treat it as a workspace member either way since npm
workspaces doesn't care which parent folder a member lives in.

```
spendwise/
├── apps/
│   ├── mobile/                    # Expo React Native app
│   │   ├── app/                   # Expo Router (file-based routing)
│   │   │   ├── (tabs)/
│   │   │   │   ├── index.tsx      # Home - monthly summary, recent transactions
│   │   │   │   ├── transactions.tsx
│   │   │   │   ├── budgets.tsx
│   │   │   │   └── profile.tsx
│   │   │   ├── share-intent.tsx   # Share extension handler (CRITICAL)
│   │   │   ├── transaction/[id].tsx
│   │   │   ├── auth/
│   │   │   │   ├── login.tsx
│   │   │   │   └── register.tsx
│   │   │   └── _layout.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── app.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── web/                       # Next.js dashboard
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── dashboard/page.tsx
│       │   ├── transactions/page.tsx
│       │   ├── budgets/page.tsx
│       │   └── analytics/page.tsx
│       ├── components/
│       ├── lib/
│       ├── tailwind.config.ts
│       └── package.json
│
├── packages/
│   ├── server/                    # Express + TypeScript backend
│   │   ├── src/
│   │   │   ├── routes/            # auth, transactions, budgets, analytics, parse
│   │   │   ├── models/            # User, Transaction, Budget, Category
│   │   │   ├── services/          # aiCategorizer, ocrParser, budgetChecker
│   │   │   ├── middleware/        # auth, validation, errorHandler
│   │   │   ├── utils/             # aiPrompts, seed script
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── shared/                    # Shared types & constants
│       ├── types.ts
│       ├── categories.ts
│       └── constants.ts
│
├── specifications/                 # this folder — living design docs
├── package.json                    # monorepo root (npm workspaces)
├── tsconfig.base.json
├── .env.example
└── .gitignore
```

## Workspace package names

- `@spendwise/server` → `packages/server`
- `@spendwise/shared` → `packages/shared`
- `@spendwise/mobile` → `apps/mobile`
- `@spendwise/web` → `apps/web`

`server`, `mobile`, and `web` all depend on `@spendwise/shared` via the workspace protocol
(`"@spendwise/shared": "*"`), so type definitions, the default category list, and shared constants
are defined once and consumed everywhere — no drift between what the backend validates and what the
clients render.

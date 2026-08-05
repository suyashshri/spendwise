# Environment Variables

Canonical list lives in `.env.example` at the repo root. Each app/package reads from its own `.env`
at runtime; during local dev the simplest setup is one root `.env` with all of these, loaded by
whichever process needs it.

## `packages/server`

| Var | Purpose |
|---|---|
| `PORT` | Express listen port (default 4000) |
| `NODE_ENV` | `development` \| `production` \| `test` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Signs access tokens |
| `JWT_REFRESH_SECRET` | Signs refresh tokens (must differ from `JWT_SECRET`) |
| `JWT_ACCESS_EXPIRES_IN` | e.g. `15m` |
| `JWT_REFRESH_EXPIRES_IN` | e.g. `7d` |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth verification |
| `CLOUDINARY_URL` (or `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_S3_BUCKET`) | Screenshot storage — pick one provider |
| `REDIS_URL` | Optional, analytics query caching |

## `apps/web`

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the API, e.g. `http://localhost:4000/api` — read both server-side (Route Handlers) and client-side (browser calls straight to Express, see [14-web-dashboard.md](14-web-dashboard.md)) |

No `NEXTAUTH_SECRET`/`NEXTAUTH_URL` — the web app doesn't use NextAuth (see
[14-web-dashboard.md](14-web-dashboard.md) for why).

**Exception to the "one root `.env`" setup above**: Next.js only reads `.env`/`.env.local` from its
own package directory, never the monorepo root — `packages/server` and `apps/mobile` resolve the
root `.env` explicitly in code (`config.ts`'s `path.resolve`, respectively Expo's own convention),
but Next.js doesn't support that. So `apps/web` needs its own `apps/web/.env.local` (gitignored by
the app's own `.gitignore`, not the root one) with `NEXT_PUBLIC_API_URL` set.

## `apps/mobile`

| Var | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the API the app talks to |

`EXPO_PUBLIC_*` vars are inlined at build time by Expo and are visible in the client bundle — never
put secrets here, only public config like the API base URL.

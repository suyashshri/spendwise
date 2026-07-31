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
| `NEXT_PUBLIC_API_URL` | Base URL of the API, e.g. `http://localhost:4000/api` |
| `NEXTAUTH_SECRET` | NextAuth session encryption |
| `NEXTAUTH_URL` | Canonical app URL for NextAuth callbacks |

## `apps/mobile`

| Var | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the API the app talks to |

`EXPO_PUBLIC_*` vars are inlined at build time by Expo and are visible in the client bundle — never
put secrets here, only public config like the API base URL.

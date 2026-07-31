# Auth Flow

## Strategy

JWT-based, two tokens:

- **Access token** — 15 minute expiry, sent as `Authorization: Bearer <token>` on every protected request.
- **Refresh token** — 7 day expiry. Storage differs by client:
  - Web: httpOnly cookie (via NextAuth)
  - Mobile: Expo SecureStore

`POST /api/auth/refresh` exchanges a valid refresh token for a new access token. Refresh tokens are
signed with a separate secret (`JWT_REFRESH_SECRET`) from access tokens (`JWT_SECRET`) so leaking
one key doesn't compromise the other token type.

`User.refreshTokenVersion` is embedded as a claim in refresh tokens; bumping it (e.g. on
"log out everywhere" or password change) invalidates all previously issued refresh tokens without
needing a token blocklist.

## Providers

- **Email/password** — `passwordHash` via bcrypt, `authProvider: "email"`.
- **Google OAuth** — mobile uses `expo-auth-session`, web uses NextAuth's Google provider. Both end
  up calling `POST /api/auth/google` with a Google `idToken`, which the server verifies server-side
  (via `google-auth-library`) before issuing SpendWise's own JWT pair. `authProvider: "google"`,
  `passwordHash` is unset.

## Middleware (`middleware/auth.ts`)

- Reads `Authorization: Bearer <token>`, verifies against `JWT_SECRET`.
- On success, attaches `req.user = { id, email }` (decoded from token claims — no DB round trip on
  every request; handlers that need the full user doc fetch it explicitly).
- On failure (missing/expired/invalid), responds `401` via the shared `AppError` path — never a raw
  stack trace.
- All `/api/*` routes go through this middleware except `/api/auth/register`, `/api/auth/login`,
  `/api/auth/google`, `/api/auth/refresh`.

## Password handling

- Registration hashes with bcrypt (cost factor 12).
- Login compares with `bcrypt.compare`; timing-safe by construction, no additional care needed.
- Passwords are never logged or included in any API response (`User` model's `toJSON` strips
  `passwordHash`).

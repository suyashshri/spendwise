# Push Notifications (Budget Alerts)

When a transaction pushes a budget over its `alertAt` threshold, every registered device for that
user gets a push notification — "you've used 82% of your Dining budget" — instead of only finding
out next time they open the app.

## Backend (`packages/server`)

- `User.pushTokens: string[]` — Expo push tokens for every device the user is logged in on
  (default `[]`, stripped from `toJSON()` like `passwordHash`). A user can have several — one per
  device.
- `POST /api/auth/push-token` / `DELETE /api/auth/push-token` (`{ token }`, Zod-validated via
  `pushTokenSchema`) — register/unregister a device. Registration uses `$addToSet` (not `$push`)
  since the same device re-registers its token on every app launch; this keeps the array a set
  instead of accumulating duplicates.
- `Budget.lastAlertSentAt?: Date` — dedup marker. `services/budgetChecker.ts`'s
  `checkBudgetsForTransaction()` is a pure, idempotent computation — it returns *every* budget
  currently over threshold on *every* call, by design (so anything reading budget state gets a
  consistent answer regardless of push notifications existing at all). Without a separate dedup
  step, a user 10 transactions past their 80% mark would get 10 identical pushes. `lastAlertSentAt`
  is compared against the current period's start (the same `periodStart()` helper
  `budgetChecker.ts` already used) — a user gets exactly one alert per period, not one per
  transaction.
- `services/pushNotificationService.ts` — `sendBudgetAlertPushes(userId, alerts)` is the one place
  with side effects (reads `User.pushTokens`, writes `Budget.lastAlertSentAt`, calls Expo's push
  API), kept separate from `budgetChecker.ts` so that computation stays pure. Uses `expo-server-sdk`:
  validates tokens with `Expo.isExpoPushToken()`, batches via `chunkPushNotifications()`, and prunes
  any token Expo's ticket response flags `DeviceNotRegistered` (the app was uninstalled) from
  `User.pushTokens`. **Never throws** — a failed push send must not fail the transaction save that
  triggered it; send errors are caught per-chunk and logged.
- Wired into both places a transaction can be created: `routes/parse.ts`'s shared
  `parseAndSaveTransaction()` (covers `/text` and `/image`, i.e. share-intent and OCR) and
  `routes/transactions.ts`'s manual `POST /` handler — right after the existing
  `checkBudgetsForTransaction()` call in each.

## Mobile (`apps/mobile`)

- `expo-notifications` + `expo-device` (via `npx expo install`, SDK-matched versions), plugin
  entry added to `app.json` (`extra: { color: "#208AEF" }` for the Android notification icon tint).
- `services/pushNotifications.ts`:
  - `registerForPushNotifications()` — no-op on simulators (`Device.isDevice`) and when no EAS
    `projectId` is configured (see **Known gap** below); otherwise requests permission if not
    already granted, sets up the Android `default` notification channel, fetches an Expo push
    token via `getExpoPushTokenAsync({ projectId })`, and registers it with the backend. Never
    throws — registration failures are logged and swallowed, since they shouldn't block login.
  - `unregisterPushNotifications()` — fetches the current device's token and calls
    `DELETE /auth/push-token`, so a device that just signed out stops getting alerts for the
    account it left.
  - `Notifications.setNotificationHandler` is set at module load so foreground notifications
    actually show a banner (the SDK default is to suppress them).
- Wiring (`hooks/useAuth.ts`, `app/_layout.tsx`):
  - `login()`/`register()` call `registerForPushNotifications()` right after `setSession()`.
  - `logout()` now awaits `unregisterPushNotifications()` **before** `clearSession()` — it needs
    the still-live access token to authenticate the `DELETE` call.
  - A mount-time effect in `app/_layout.tsx` re-registers once `hasHydrated && isAuthenticated`,
    covering app reopen with a session restored from `SecureStore` (not just fresh login) —
    harmless to repeat since the backend's `$addToSet` makes it idempotent.
  - `Notifications.addNotificationResponseReceivedListener` routes a tapped budget-alert
    notification (`data.type === 'budget_alert'`) straight to the Budgets tab.

## Known gap: no EAS project configured

Real Expo push tokens require an EAS project (`eas init` / `eas login`, populating
`app.json`'s `extra.eas.projectId`) — none exists yet in this repo. Until that's set up,
`registerForPushNotifications()` logs a warning and returns early (`getProjectId()` returns
`undefined`), so the rest of the app functions normally but no device ever actually registers a
token and no pushes are sent. This is a deliberate "wire it all up now, provision the project when
ready to test on a real device" choice rather than blocking this feature on an infra step outside
this codebase.

## Other known gaps

- **No receipt polling.** Expo's push flow is two-step: a *ticket* comes back immediately from
  `sendPushNotificationsAsync()`, and a *receipt* is available ~15–30 minutes later with delivery
  errors that aren't knowable up front (e.g. `MessageTooBig`, `MessageRateExceeded`). Only the
  ticket-level `DeviceNotRegistered` case is handled today; a follow-up would poll
  `getPushNotificationReceiptsAsync()` and prune/retry based on receipt errors too.
- **No notification preferences.** Every registered device gets every budget alert for the account
  — there's no per-budget or per-device mute.

## Verified

`npm run typecheck` clean on both `packages/server` and `apps/mobile` after all the wiring above.
**Not verified**: an actual push notification arriving on a device — blocked on both the EAS
project gap above and this environment having no physical device/simulator available, consistent
with every other on-device verification gap noted elsewhere in these specs.

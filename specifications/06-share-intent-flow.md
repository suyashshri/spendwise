# Share Intent Flow (Primary UX)

1. User makes a UPI payment in any UPI app (PhonePe, GPay, Paytm, ...).
2. On the payment success screen, user taps **Share** → selects **SpendWise**.
3. The UPI app shares either:
   - **Text** (most common) — e.g. `"Paid ₹450 to Swiggy via UPI. Ref: 423876234523"`, or
   - **A screenshot** of the confirmation screen.
4. `apps/mobile` receives the shared content via `expo-share-intent`, routed to
   `app/share-intent.tsx`.
5. The screen sends the content to the backend:
   - text → `POST /api/parse/text`
   - image → `POST /api/parse/image` (multipart)
6. Backend runs the AI parse (text) or OCR-then-AI parse (image) — see
   [05-ai-categorization.md](05-ai-categorization.md) — and saves the transaction.
7. `share-intent.tsx` shows a confirmation screen (`ShareIntentPreview` component) with the parsed
   amount / merchant / category / date. If `needsReview` is true, the category field is pre-focused
   for the user to confirm or correct before it's considered final.
8. User taps confirm (or edits category first) → done. No further manual entry needed for the
   common case.

## Registering as a share target

Configured in `apps/mobile/app.json` via the `expo-share-intent` config plugin:

- **iOS**: requires an App Group (e.g. `group.com.spendwise.shareextension`) shared between the main
  app and a Share Extension target, plus `NSExtensionActivationRule` allowing both
  `public.plain-text` and `public.image` content types.
- **Android**: intent filters for `ACTION_SEND` with MIME types `text/*` and `image/*` on the main
  activity (or a dedicated share activity), so SpendWise appears in the Android share sheet for both
  text and image shares.

Both platforms funnel into the same `share-intent.tsx` route regardless of which MIME type was
shared — the screen branches on whether it received `text` or `files` from the
`useShareIntentContext()` hook.

## Manual entry (tertiary path)

Not everything is a UPI payment — cash, cards, and non-UPI digital payments need a way in too.
`app/(tabs)/transactions.tsx` and the home screen both expose a manual "+ Add expense" action that
opens a plain form (amount, merchant/payee, category picker, date, optional note) posting to
`POST /api/transactions`. This is the same endpoint and `Transaction` document shape as the
AI-parsed path (`inputType: "manual"`, `confidence: 1`, no `rawInput`/`upiRefId`), so it appears
identically in transaction lists, budgets, and analytics — "track every penny" doesn't depend on the
expense having come through UPI.

## Deduplication

`upiRefId` is a unique sparse index on `Transaction` — see [02-database-schema.md](02-database-schema.md).
If a user shares the same payment confirmation twice (easy to do by accident), the parse endpoint
detects the existing document by `upiRefId` and returns it with `duplicate: true` rather than
creating a second transaction.

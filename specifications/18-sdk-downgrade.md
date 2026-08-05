# Expo SDK 57 → 54 downgrade

The mobile app targeted Expo SDK 57. On the user's iPhone, Expo Go reported the app as
incompatible — almost certainly Apple's App Store review lagging behind Expo's SDK 57 release (the
same thing happened earlier in this project and was fixed with a direct SDK-57-compatible Expo Go
install link, no code change needed). That simpler fix was offered first; the user explicitly chose
to downgrade to SDK 54 instead, accepting the larger effort. This file documents what changed and
why, so nobody re-introduces an SDK-57-only API without realizing this app now targets 54.

## Dependency versions

`apps/mobile/package.json`'s `expo` and every `expo-*`/`react-native-*` companion package were
repinned to their SDK-54-compatible versions, sourced from Expo's own compatibility table
(`https://api.expo.dev/v2/sdks/54.0.0/native-modules` — the same data `npx expo install --fix`
reads) rather than guessed. Notably `react` 19.2.3→19.1.0, `react-native` 0.86.2→0.81.5,
`expo-router` ~57→~6.0.24 (expo-router's own version numbers aren't SDK-aligned).

`expo-share-intent` (a third-party package, not covered by Expo's compatibility table) needed a
different major version entirely: `8.0.1` declares a peer dependency on `expo: ^57` and won't
resolve against SDK 54. Walked back through its version history to `~5.1.1`, the newest version
whose peer dependency is `expo: ^54`. Verified its exported API (`ShareIntentProvider`,
`useShareIntentContext`, `getShareExtensionKey`, the `resetOnBackground`/`onResetShareIntent`
options, the `iosActivationRules`/`androidIntentFilters`/`iosAppGroupIdentifier` config-plugin
options) is unchanged at this version — no code changes needed for share-intent itself.

## Code changes forced by the downgrade

- **`apps/mobile/services/exportTransactions.ts`** — `expo-file-system`'s newer `File`/`Directory`/
  `Paths` class API (used for the CSV/PDF export download) only gained a `File.downloadFileAsync()`
  network method after SDK 54; at `expo-file-system@19.0.23` (SDK 54's paired version) those classes
  exist but have no network methods at all. Rewritten to use the legacy function-based API instead:
  `import * as FileSystem from 'expo-file-system/legacy'` → `FileSystem.downloadAsync(url, fileUri,
  { headers })`, writing into `FileSystem.cacheDirectory`. One behavioral difference: the legacy
  function *resolves* even on a non-2xx response (unlike the newer API, which rejects) — the code
  now explicitly checks `result.status`.
- **`apps/mobile/app.json`** — removed the bare `"expo-sharing"` plugins entry. At its SDK-54-paired
  version (`~14.0.8`), `expo-sharing` has no `app.plugin.js` at all (nothing to configure natively at
  this version); the SDK-57 version apparently did. Its JS API (`shareAsync`, `isAvailableAsync`) is
  unaffected.
- **`apps/mobile/app/_layout.tsx`** — `DarkTheme`, `DefaultTheme`, `ThemeProvider` are no longer
  re-exported from `expo-router` at this version. Import them from `@react-navigation/native`
  directly instead (added as an explicit dependency — see below).
- **`apps/mobile/components/TabBar.tsx`** — the `expo-router/tabs` subpath (used only for the
  `BottomTabBarProps` type) doesn't exist at this `expo-router` version. Import the type from
  `@react-navigation/bottom-tabs` directly instead (also newly added as an explicit dependency).
  `Stack.Protected`'s `guard` prop — the other Expo-Router-specific API this app leans on for
  auth-gating — is unchanged at this version; no code change needed there.

## Two duplicate-React bugs, found the hard way

Adding `@react-navigation/native`/`@react-navigation/bottom-tabs` as direct dependencies triggered a
static-export crash isolated to exactly one route (`/share-intent`) — `TypeError: Cannot read
properties of null (reading 'useEffect')` inside `@react-navigation/native`'s `ServerContainer`.
Every other route uses the exact same `useShareIntentContext()` hook via `_layout.tsx` and rendered
fine, which ruled out share-intent itself; bisecting down to a two-line repro (`useLinkingURL()`
alone, no share-intent code at all) confirmed it. Root cause: npm hoisted a *second*, separate copy
of `react` to the workspace root once `@react-navigation/native` became a directly-declared
dependency of `apps/mobile` — `@react-navigation/native`'s own `import ... from 'react'` resolved to
that root copy, while `react-dom` (doing the actual static-render) resolved to `apps/mobile`'s own
nested copy. Two React instances in one render tree means a null hook dispatcher the moment a
component from the "wrong" copy calls a hook.

Fixed with a root-level `overrides` entry pinning what `react` version `@react-navigation/native`
and `@react-navigation/bottom-tabs` resolve to, matching `apps/mobile`'s actual React version — this
is the standard npm-workspaces technique for forcing a would-be-hoisted package back onto the
correct React singleton without touching every other package's declared range.

That same fix, applied via a full lockfile-and-`node_modules` regeneration (needed for the override
to actually take effect), had a side effect on `apps/web`: root's *general* hoisted `react` copy
shifted to `apps/mobile`'s 19.1.0 as a consequence of the new override, and `@base-ui/react`
(web-only, previously hoisted to root and fine there) started resolving its own `import type * as
React from 'react'` against that same wrong root copy instead of `apps/web`'s own nested 19.2.8 —
the identical class of bug, just on the web side, surfacing as a TypeScript structural mismatch
(`components/ui/input.tsx`, `ChangeEventHandler` vs `BaseUIEvent`-wrapped equivalents) rather than a
runtime crash, since this one was type-only. Same fix: a second `overrides` entry pinning
`@base-ui/react`'s `react` to `19.2.8`.

Both are now in the root `package.json`:

```json
"overrides": {
  "@react-navigation/native": { "react": "19.1.0" },
  "@react-navigation/bottom-tabs": { "react": "19.1.0" },
  "@base-ui/react": { "react": "19.2.8" }
}
```

**Takeaway for future dependency changes in this monorepo**: adding any new direct dependency to one
workspace that itself depends on `react` is worth checking for this exact failure mode, since
`apps/mobile` (React 19.1.0) and `apps/web` (React 19.2.8) intentionally run different React
versions side by side in the same npm workspaces tree.

## What wasn't affected

- `Stack.Protected` (auth gating), `expo-notifications` (permissions, `AndroidImportance`,
  `getExpoPushTokenAsync`, foreground handler, response listener), and the `reactCompiler`
  experimental flag in `app.json` — all confirmed working unchanged at SDK 54 (React Compiler is
  explicitly logged as enabled in `expo export` output).
- `packages/server`, `packages/shared` — untouched, this was a mobile-app-only change.

## Verified

`npm run typecheck` (server, via `typecheck:server`), `npx tsc --noEmit` (mobile), `npx expo export
--platform web` (mobile — all 15 routes, including `/share-intent`, export cleanly), and `npx next
build` (web) all clean after every change in this doc, including both override fixes.

**Not verified**: the actual motivating problem — Expo Go on the user's iPhone reporting the app as
incompatible — can only be confirmed fixed once they reload the app on their real device. If their
installed Expo Go is *also* too old for SDK 54 (unlikely but possible), they may additionally need
an App Store update.

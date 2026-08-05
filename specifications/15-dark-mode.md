# Dark Mode Toggle

Both apps already had complete light/dark color tokens since early on (mobile: `constants/theme.ts`
`Colors.light`/`Colors.dark`; web: `app/globals.css` CSS variables + `.dark` class) — mobile always
*followed* the OS setting automatically via `useColorScheme()`, but neither app let the user
override it manually. This adds that: a three-way **Light / Dark / System** choice, persisted, in
both apps.

## Mobile (`apps/mobile`)

- `store/themeStore.ts` — Zustand, persisted to AsyncStorage (not SecureStore — a theme preference
  isn't sensitive like the auth tokens). Default `'system'`.
- `hooks/use-color-scheme.ts` (native) and `use-color-scheme.web.ts` (web-hydration-safe variant,
  pre-existing) both now resolve the *effective* scheme: system preference when `mode === 'system'`,
  otherwise the stored override. Both still export a function named `useColorScheme`, matching Expo
  Router's platform-file convention (`.web.ts` picked automatically on web builds), so every
  existing caller of `@/hooks/use-color-scheme` (`useTheme()`, chiefly) picked up the override for
  free with no changes elsewhere.
- **The actual fix was finding every screen that imported `useColorScheme` directly from
  `'react-native'`** instead of the app's own hook (`app/_layout.tsx`, both auth screens, Home,
  Profile) — those bypassed the override entirely and would have kept following the OS setting no
  matter what the user picked in Profile. Switched all five to the app's hook.
- `app/_layout.tsx`'s `<StatusBar style="auto" />` had the same bypass problem one level deeper:
  `style="auto"` resolves the icon color from the OS setting directly, not from Expo Router's
  `ThemeProvider` context or our override. Changed to an explicit
  `style={colorScheme === 'dark' ? 'light' : 'dark'}` driven by the same resolved value everything
  else uses.
- Toggle UI: a 3-option segmented control in Profile → Appearance (`app/(tabs)/profile.tsx`).

## Web (`apps/web`)

- `store/themeStore.ts` — Zustand, persisted to `localStorage` under the key `"spendwise-theme"`.
- **No-flash-of-wrong-theme script** (`app/layout.tsx`) — a raw inline `<script>` in `<head>`,
  synchronous, runs before React hydrates: reads the same localStorage key Zustand's persist writes
  to and adds the `dark` class to `<html>` immediately if needed. Without this, a returning user
  with a stored `dark` preference would see a flash of the light theme on every load, since
  Zustand's persisted state only becomes available after a `useEffect` runs post-hydration. `<html>`
  has `suppressHydrationWarning` because of this — the script intentionally mutates `<html>`'s
  class before React's hydration check runs, which React would otherwise (correctly, but
  unhelpfully here) flag as a mismatch.
- `components/theme-provider.tsx` — takes over after that first paint: applies the `dark` class on
  every store change, and listens for live OS-level `prefers-color-scheme` changes via
  `matchMedia(...).addEventListener('change', ...)` while `mode === 'system'`, so the app updates
  immediately if the user flips their OS theme without needing a reload.
- Toggle UI: `components/theme-toggle.tsx`, a compact 3-icon control (Sun/Moon/Monitor from
  `lucide-react`) in the sidebar footer.

## Verified

`npx tsc --noEmit` and `npx next build` (web) / `npx tsc --noEmit` + `npx expo export --platform
web` (mobile) all clean. Confirmed via `curl` that the inline no-flash script is actually present in
the served HTML for `/login`. **Not verified**: the actual visual behavior (does the class really
toggle, does system-preference live-switching work, does the mobile segmented control look right) —
no browser or device/simulator available in this environment, consistent with every other UI-only
verification gap noted elsewhere in these specs.

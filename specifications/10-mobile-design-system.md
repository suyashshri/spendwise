# Mobile Design System

The initial mobile build (Phase 2) used stock React Native styling — flat blocks, no shadows, emoji
tab icons — and read as plain/dated. This pass replaces it with an actual design system: real icons,
elevation, gradients, and motion, kept dependency-light (no `reanimated`, so Expo Go compatibility for
everything except the share-intent native module is preserved — see
[09-mobile-app.md](09-mobile-app.md)).

## Tokens (`constants/theme.ts`)

- **`Colors.light` / `Colors.dark`** — expanded from the original 8 keys to include `surface`/
  `surfaceElevated` (card backgrounds), `textTertiary` (least-emphasis text), `primaryMuted`/
  `dangerMuted`/`warningMuted`/`successMuted` (tinted backgrounds for badges/banners), and `shadow`.
  Primary shifted from flat blue (`#208AEF`) to a violet (`#6C5CE7` light / `#8B7CF6` dark) — reads
  more like a modern fintech app and pairs better with the gradient.
- **`Gradients`** — `hero`/`success`/`danger` gradient pairs per theme, consumed via
  `expo-linear-gradient`.
- **`Radii`** — `sm`(10) `md`(14) `lg`(20) `xl`(28) `pill`(999). Every rounded corner in the app
  pulls from this scale rather than a one-off number.
- **`Elevation`** — `card`/`raised`/`floating` shadow presets (shadow* props for iOS, `elevation`
  for Android). `shadowColor` is passed separately per-usage from `theme.shadow` (or a brand color
  for colored glow shadows, e.g. the primary button and the hero card).
- **`FloatingTabBarSpace`** — bottom padding constant for scrollable tab screens, since the tab bar
  (below) is absolutely positioned over content rather than docked inline.

## Primitives (`components/`)

- **`AnimatedPressable`** — `Pressable` wrapped with `Animated.spring` scale-down on press
  (`react-native`'s built-in `Animated`, not `reanimated`). Every tappable surface in the app uses
  this instead of a bare `Pressable`/`TouchableOpacity`, so touch feedback is consistent.
- **`Button`** — variants `primary` (gradient-adjacent solid + colored glow shadow) / `secondary` /
  `ghost` / `danger` / `danger-ghost` (tinted background, for destructive-but-not-scary actions like
  "Delete transaction"). Handles loading/disabled state.
- **`Card`** — elevated surface (`theme.surfaceElevated` + `Elevation.card`), optionally interactive
  (`onPress` makes it an `AnimatedPressable` internally — never nest a `Card` with `onPress` around
  content that has its own interactive children, that double-nests Pressables).
- **`FadeInView`** — opacity + translateY entrance animation on mount, with a `delay` prop for
  staggering a screen's sections (used on Home, Budgets, Profile, auth screens).
- **`TextField`** — labeled input with a leading icon and a focus-state border color transition.
  Replaces one-off `TextInput` + manual label styling that existed per-screen before.
- **`CategoryAvatar`** — circular icon badge (category color at ~15% opacity background) — the
  leading visual on `TransactionCard`, transaction detail, and the share-intent preview. Replaces
  the old `CategoryPill` (a flat text+emoji pill), which is now only used inline in
  `CategoryPicker`'s chip design.
- **`TabBar`** — custom floating tab bar (`components/TabBar.tsx`) passed to `<Tabs tabBar={...}>`,
  replacing the default docked tab bar + emoji icons. Uses `@expo/vector-icons` (`Ionicons`), icon-only
  (no label): a filled/outline glyph swap plus a tinted pill background mark the active tab. Started
  as icon+label, but with 4 evenly-split tabs "Transactions" had no room and truncated to "Trans…" —
  icon-only reads cleaner at this width and is a common enough mobile pattern that the active state
  (fill + tint) is unambiguous on its own.

  Its prop type is imported from **`expo-router/tabs`**, not `@react-navigation/bottom-tabs` directly
  — expo-router vendors its own fork of the bottom-tabs types (`expo-router/build/react-navigation/
  bottom-tabs/types`), and the standalone `@react-navigation/bottom-tabs` package's `BottomTabBarProps`
  is a structurally different (and incompatible) type even at a matching version. Importing from the
  wrong place produces a wall of `HeaderOptions`/`ColorValue` mismatch errors that look unrelated to
  the actual problem.

## New dependencies

`expo-linear-gradient`, `@expo/vector-icons` (icons), `expo-blur` (installed for future use, not yet
consumed by anything). All are first-party Expo SDK modules — no third-party UI kit was pulled in, to
keep the bundle and the API surface small.

## Where this shows up

- **Home** — gradient hero card (month total + inline budget progress bar), category breakdown
  redesigned with `CategoryAvatar` rows instead of bare emoji, staggered `FadeInView` entrance.
- **Transactions** — `TabBar`-style pill filter chips, `TransactionCard` redesigned with a leading
  `CategoryAvatar`, amount/date right-aligned.
- **Budgets** — `Card`-wrapped budget editor with an icon badge, animated progress fill
  (`BudgetProgressBar` now animates its width in on mount).
- **Profile** — gradient avatar circle (first-initial), icon rows for currency/sign-in method.
- **Auth (login/register)** — gradient logo mark, `TextField` inputs, full-bleed primary `Button`.
- **Manual add / transaction detail / share-intent confirm** — all rebuilt on the same
  `TextField`/`CategoryPicker`/`Button`/`Card` primitives instead of ad hoc per-screen styling, so a
  future visual tweak (e.g. changing `Radii.lg`) propagates everywhere instead of needing a
  screen-by-screen sweep again.

## Bug caught during this pass: `AnimatedPressable` and `flex: 1`

The first version of `AnimatedPressable` put the caller's `style` on an *inner* `Animated.View`,
wrapping a plain `Pressable` with no style of its own:
```tsx
<Pressable onPressIn={...} onPressOut={...}>
  <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
</Pressable>
```
This looked fine everywhere it was tried in isolation, but broke `TabBar`: each tab's `flex: 1`
(meant to split the bar into 4 even-width slots) was applied to the *Animated.View*, not the
*Pressable* — and flex only affects how an element sizes within its own direct parent. The
Animated.View sized itself within the Pressable (which had no competing constraint, so no visible
effect there), while the actual row children (the four unstyled Pressables) fell back to shrink-wrap
sizing. Result: tabs bunched up at their natural content width instead of spreading across the bar.

Fixed by switching to `Animated.createAnimatedComponent(Pressable)` and applying `style` directly to
that single animated element — no inner wrapper, so there's no parent/child mismatch for any
layout-affecting style (`flex`, `alignSelf`, explicit width, etc.) passed to `AnimatedPressable`
anywhere in the app, not just in the tab bar.

## Known gap

No animation library beyond RN's built-in `Animated` was added, so there's no shared-element
transition between the transaction list and its detail screen, and list reordering isn't animated.
Revisit with `react-native-reanimated` if that polish is wanted later — it was deliberately left out
here to avoid the extra native dependency (config plugin, potential Expo Go friction) for a first
visual pass.

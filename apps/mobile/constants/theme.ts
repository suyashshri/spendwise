/**
 * Design tokens: colors, gradients, elevation, radii, spacing. Everything visual in the app
 * should pull from here rather than hardcoding hex values, so the light/dark themes and the
 * overall look stay consistent as new screens get added.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#12131A',
    textSecondary: '#6B7080',
    textTertiary: '#9AA0B0',
    background: '#F5F6FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EDEEF7',
    border: '#E7E8F0',
    primary: '#6C5CE7',
    primaryMuted: '#EFECFD',
    danger: '#E5484D',
    dangerMuted: '#FCE8E8',
    warning: '#F5A623',
    warningMuted: '#FDF1DC',
    success: '#1FB27A',
    successMuted: '#E3F7EF',
    shadow: '#2B2D6B',
  },
  dark: {
    text: '#F5F6FA',
    textSecondary: '#9BA0B4',
    textTertiary: '#6D7186',
    background: '#0B0C14',
    surface: '#16171F',
    surfaceElevated: '#1D1F2B',
    backgroundElement: '#16171F',
    backgroundSelected: '#242637',
    border: '#26283A',
    primary: '#8B7CF6',
    primaryMuted: '#241F45',
    danger: '#FF6B6E',
    dangerMuted: '#3A2020',
    warning: '#F5B94D',
    warningMuted: '#3A3018',
    success: '#3FD79B',
    successMuted: '#153229',
    shadow: '#000000',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Gradient pairs (used with expo-linear-gradient) — kept separate from Colors since a gradient
// isn't a single token consumers look up by name the way a solid color is.
export const Gradients = {
  light: {
    hero: ['#7C6AF2', '#4834D4'] as const,
    success: ['#1FB27A', '#0E8F5E'] as const,
    danger: ['#F0656A', '#D63A3F'] as const,
  },
  dark: {
    hero: ['#8B7CF6', '#5A3FD9'] as const,
    success: ['#3FD79B', '#1FB27A'] as const,
    danger: ['#FF6B6E', '#E5484D'] as const,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Elevation presets — pass `theme.shadow` as shadowColor. iOS reads the shadow* props, Android
 * reads `elevation` (and ignores color, hence the surfaceElevated background doing the work there). */
export const Elevation = {
  card: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  raised: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  floating: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/** The floating tab bar (components/TabBar.tsx) is absolutely positioned over content, so
 * scrollable tab screens need this much bottom padding to keep their last item from being
 * hidden behind it. */
export const FloatingTabBarSpace = 110;

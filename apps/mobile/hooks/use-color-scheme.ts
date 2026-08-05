import { useColorScheme as useRNColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';

/** The *effective* scheme — system preference, overridden by the user's stored choice (Profile ->
 * Appearance) when it isn't 'system'. Every screen should import this, not react-native's raw
 * useColorScheme, or a manual light/dark override silently won't apply to it. */
export function useColorScheme(): 'light' | 'dark' {
  const systemScheme = useRNColorScheme();
  const mode = useThemeStore((s) => s.mode);

  if (mode === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return mode;
}

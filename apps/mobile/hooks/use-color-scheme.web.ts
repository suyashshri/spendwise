import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * Also resolves the *effective* scheme — system preference, overridden by the user's stored
 * choice (Profile -> Appearance) when it isn't 'system' — same as the native hook.
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const systemScheme = useRNColorScheme();
  const mode = useThemeStore((s) => s.mode);

  if (!hasHydrated) {
    return 'light';
  }

  if (mode === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return mode;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

// Persisted to AsyncStorage (not SecureStore — a theme preference isn't sensitive, unlike the
// auth tokens in store/authStore.ts). 'system' is the default so the app matches the OS setting
// until the user explicitly overrides it via the Profile screen.
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'spendwise-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

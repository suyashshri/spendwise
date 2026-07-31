import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { User } from '@spendwise/shared';
import { secureStorage } from './secureStorage';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hasHydrated: boolean;
  setSession: (session: { user: User; accessToken: string; refreshToken: string }) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hasHydrated: false,
      setSession: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    }),
    {
      name: 'spendwise-auth',
      storage: createJSONStorage(() => secureStorage),
      // Always flip hasHydrated, even if rehydration itself errored (`state` is undefined in that
      // case) — the UI should fall back to a logged-out state rather than hang forever on a blank
      // screen waiting for a hydration that already failed.
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        } else {
          useAuthStore.setState({ hasHydrated: true });
        }
      },
    }
  )
);

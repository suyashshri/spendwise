import { create } from "zustand";
import type { User } from "@spendwise/shared";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isHydrated: boolean;
  isHydrating: boolean;
  setSession: (session: { user: User; accessToken: string }) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearSession: () => void;
  hydrate: () => Promise<void>;
}

// No persist middleware here on purpose — the access token lives in memory only (never
// localStorage), the same "don't put the JWT somewhere a script could read it" reasoning as the
// mobile app's SecureStore choice. Losing it on a hard refresh is fine: hydrate() silently gets a
// new one from the httpOnly refresh cookie via POST /api/auth/refresh.
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isHydrated: false,
  isHydrating: false,

  setSession: (session) => set({ user: session.user, accessToken: session.accessToken, isHydrated: true }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  clearSession: () => set({ user: null, accessToken: null, isHydrated: true }),

  hydrate: async () => {
    if (get().isHydrating || get().isHydrated) return;
    set({ isHydrating: true });
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, accessToken: data.accessToken, isHydrated: true, isHydrating: false });
      } else {
        set({ user: null, accessToken: null, isHydrated: true, isHydrating: false });
      }
    } catch {
      set({ user: null, accessToken: null, isHydrated: true, isHydrating: false });
    }
  },
}));

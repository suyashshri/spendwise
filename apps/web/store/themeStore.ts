import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

// Persists to localStorage under the key "spendwise-theme" — the inline script in app/layout.tsx
// reads this exact key/shape (Zustand's persist wraps state as {state: {...}, version: 0}) to set
// the `dark` class before first paint, avoiding a flash of the wrong theme. If this key name or
// shape changes, that script needs updating too.
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      setMode: (mode) => set({ mode }),
    }),
    { name: "spendwise-theme" }
  )
);

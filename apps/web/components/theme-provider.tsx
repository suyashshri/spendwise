"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";

function applyThemeClass(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
}

/** Keeps the `dark` class on <html> in sync with the theme store, including live system-preference
 * changes while mode is 'system'. The inline script in app/layout.tsx handles the very first paint
 * (before React hydrates) — this takes over for every change after that. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const resolve = () => (mode === "system" ? media.matches : mode === "dark");

    applyThemeClass(resolve());

    if (mode !== "system") return;

    const listener = () => applyThemeClass(resolve());
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [mode]);

  return <>{children}</>;
}

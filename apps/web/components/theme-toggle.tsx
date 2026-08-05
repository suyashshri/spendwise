"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore, type ThemeMode } from "@/store/themeStore";

const OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Light", icon: Sun },
  { mode: "dark", label: "Dark", icon: Moon },
  { mode: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-sidebar-accent/40 p-0.5">
      {OPTIONS.map(({ mode: optionMode, label, icon: Icon }) => {
        const selected = optionMode === mode;
        return (
          <button
            key={optionMode}
            type="button"
            title={label}
            onClick={() => setMode(optionMode)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              selected
                ? "bg-sidebar text-sidebar-primary shadow-sm"
                : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
            )}
          >
            <Icon className="size-3.5" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

/** Triggers the client-side session hydration (POST /api/auth/refresh) once on mount. Renders
 * nothing itself — callers gate their own UI on useAuthStore().isHydrated. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}

"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { User } from "@spendwise/shared";
import { api, extractApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type ProfileResult = { success: true } | { success: false; message: string };

export function useAuth() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setUser = useAuthStore((s) => s.setUser);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    clearSession();
    router.push("/login");
  }, [clearSession, router]);

  const updateProfile = useCallback(
    async (updates: { name?: string; currency?: string; monthlyBudget?: number | null }): Promise<ProfileResult> => {
      try {
        const { data } = await api.patch<{ user: User }>("/auth/me", updates);
        setUser(data.user);
        return { success: true };
      } catch (error) {
        return { success: false, message: extractApiErrorMessage(error) };
      }
    },
    [setUser]
  );

  return { user, isAuthenticated: Boolean(user), isHydrated, logout, updateProfile };
}

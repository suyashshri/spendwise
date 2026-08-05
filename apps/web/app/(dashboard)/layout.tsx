"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { useAuthStore } from "@/store/authStore";
import { useCategoryStore } from "@/store/categoryStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const user = useAuthStore((s) => s.user);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);

  useEffect(() => {
    // proxy.ts already checked the refresh cookie's *presence* before this shell ever rendered —
    // this covers the case where it exists but is no longer valid (expired/revoked), which only a
    // network call (the hydrate() this triggers, via AuthProvider) can determine.
    if (isHydrated && !user) {
      router.replace("/login");
    }
  }, [isHydrated, user, router]);

  // Fetched once here (defaults + this user's custom categories), same reasoning as the mobile
  // app's tabs layout — warm before any page's category picker/breakdown needs it.
  useEffect(() => {
    if (user) fetchCategories();
  }, [user, fetchCategories]);

  if (!isHydrated || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-y-auto bg-muted/30">
        <div className="mx-auto max-w-6xl p-8">{children}</div>
      </main>
    </div>
  );
}

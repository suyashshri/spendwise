import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { REFRESH_COOKIE_NAME } from "@/lib/session";

// Next.js 16 renamed `middleware.ts`/`middleware()` to `proxy.ts`/`proxy()` — see
// specifications/14-web-dashboard.md. This only gates on whether a session *might* exist (the
// refresh cookie is present) — it can't validate the cookie itself (that needs a network call to
// the backend), so it's a coarse "don't even render the protected shell for a fully logged-out
// visitor" check. The actual auth-or-not determination happens client-side via
// POST /api/auth/refresh on mount (store/authStore.ts).
const PROTECTED_PREFIXES = ["/dashboard", "/transactions", "/budgets", "/analytics"];
const AUTH_PAGES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(REFRESH_COOKIE_NAME);
  const { pathname } = request.nextUrl;

  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (AUTH_PAGES.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/transactions/:path*", "/budgets/:path*", "/analytics/:path*", "/login", "/register"],
};

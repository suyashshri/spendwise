import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/backend";
import { clearRefreshCookie, getRefreshCookie } from "@/lib/session";

/**
 * Called on every protected-page load (client-side, on mount — see store/authStore.ts) to trade
 * the httpOnly refresh cookie for a fresh access token, and fetch the current user in the same
 * round trip. This is the "am I logged in" check from the client's perspective; proxy.ts only
 * checks whether the cookie exists at all, not whether it's still valid.
 */
export async function POST() {
  const refreshToken = await getRefreshCookie();
  if (!refreshToken) {
    return NextResponse.json({ error: { message: "No session" } }, { status: 401 });
  }

  const refreshRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!refreshRes.ok) {
    await clearRefreshCookie();
    return NextResponse.json({ error: { message: "Session expired" } }, { status: 401 });
  }

  const { accessToken } = (await refreshRes.json()) as { accessToken: string };

  const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meRes.ok) {
    return NextResponse.json({ error: { message: "Could not load user" } }, { status: 401 });
  }
  const { user } = await meRes.json();

  return NextResponse.json({ accessToken, user });
}

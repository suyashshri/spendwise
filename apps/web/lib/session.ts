import { cookies } from "next/headers";

// The refresh token is the only thing that needs to be httpOnly (browser JS must never read it) —
// see specifications/14-web-dashboard.md for the full auth design. The access token lives only in
// client-side memory (store/authStore.ts), the same way the mobile app keeps it in memory/SecureStore
// rather than something a script could exfiltrate.
const REFRESH_COOKIE = "sw_refresh";
const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // matches the backend's refresh token lifetime

export async function setRefreshCookie(refreshToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}

export async function getRefreshCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE)?.value;
}

export async function clearRefreshCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(REFRESH_COOKIE);
}

export const REFRESH_COOKIE_NAME = REFRESH_COOKIE;

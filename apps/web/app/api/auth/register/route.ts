import { NextResponse } from "next/server";
import { BACKEND_URL, type BackendErrorBody } from "@/lib/backend";
import { setRefreshCookie } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${BACKEND_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => ({}))) as BackendErrorBody;
    return NextResponse.json(
      { error: { message: errorBody.error?.message ?? "Registration failed" } },
      { status: res.status }
    );
  }

  const data = (await res.json()) as { user: unknown; accessToken: string; refreshToken: string };
  await setRefreshCookie(data.refreshToken);

  return NextResponse.json({ user: data.user, accessToken: data.accessToken });
}

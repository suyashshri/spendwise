import { NextResponse } from "next/server";
import { clearRefreshCookie } from "@/lib/session";

export async function POST() {
  await clearRefreshCookie();
  return NextResponse.json({ ok: true });
}

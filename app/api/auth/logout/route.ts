import { NextResponse } from "next/server";
import { clearedCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", clearedCookie());
  return res;
}

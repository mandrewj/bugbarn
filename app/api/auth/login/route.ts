import { NextResponse } from "next/server";
import { checkAccessCode, makeToken, sessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let code: string | undefined;
  let trap: string | undefined; // honeypot
  try {
    const body = await req.json();
    code = body?.code;
    trap = body?.website; // bots fill hidden field
  } catch {
    return new NextResponse("bad request", { status: 400 });
  }

  if (trap) return new NextResponse("nope", { status: 401 });
  if (!checkAccessCode(code)) return new NextResponse("nope", { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", sessionCookie(await makeToken()));
  return res;
}

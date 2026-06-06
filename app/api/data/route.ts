import { NextResponse } from "next/server";
import { readStore, writeStore, reseedStore, clearStore } from "@/lib/store";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";
import type { Dataset } from "@/lib/types";

// Reads/writes hit the network (Blob) — never statically cache.
export const dynamic = "force-dynamic";

async function authed(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifyToken(token);
}

export async function GET() {
  if (!(await authed())) return new NextResponse("unauthorized", { status: 401 });
  const data = await readStore();
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  if (!(await authed())) return new NextResponse("unauthorized", { status: 401 });
  let body: Dataset;
  try {
    body = (await req.json()) as Dataset;
  } catch {
    return new NextResponse("bad request", { status: 400 });
  }
  if (!body || !Array.isArray(body.collections)) {
    return new NextResponse("invalid dataset", { status: 400 });
  }
  await writeStore(body);
  return NextResponse.json({ ok: true });
}

/** Actions that must regenerate data server-side. Body: { action }. */
export async function POST(req: Request) {
  if (!(await authed())) return new NextResponse("unauthorized", { status: 401 });
  let action: string | undefined;
  try {
    action = (await req.json())?.action;
  } catch {
    /* noop */
  }
  if (action === "reseed") return NextResponse.json(await reseedStore());
  if (action === "clear") return NextResponse.json(await clearStore());
  return new NextResponse("unknown action", { status: 400 });
}

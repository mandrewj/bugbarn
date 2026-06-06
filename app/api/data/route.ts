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

// Turn a thrown store error into a clean JSON 500 so the client shows a toast
// instead of Vercel's full-page crash screen.
function storeError(e: unknown) {
  const message = e instanceof Error ? e.message : "Storage error";
  console.error("[api/data]", message);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET() {
  if (!(await authed())) return new NextResponse("unauthorized", { status: 401 });
  try {
    return NextResponse.json(await readStore());
  } catch (e) {
    return storeError(e);
  }
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
  try {
    await writeStore(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return storeError(e);
  }
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
  try {
    if (action === "reseed") return NextResponse.json(await reseedStore());
    if (action === "clear") return NextResponse.json(await clearStore());
  } catch (e) {
    return storeError(e);
  }
  return new NextResponse("unknown action", { status: 400 });
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth";

// Gate every non-public route behind the session cookie and stamp a
// noindex header on everything so the portal never gets crawled.
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");

  const { pathname } = req.nextUrl;
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron") || // protected by CRON_SECRET, not the session cookie
    pathname === "/robots.txt";
  if (isPublic) return res;

  const ok = await verifyToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return res;

  if (pathname.startsWith("/api")) return new NextResponse("unauthorized", { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

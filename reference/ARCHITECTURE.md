# Architecture — Bug Barn Portal (Next.js + Vercel + GitHub JSON + simple auth)

This document specifies how to turn the `reference/Bug Barn Dashboard.html` prototype into a real, deployable web app. Read `README.md` first for the design + data model.

---

## 1. Stack & rationale
| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | First-class Vercel support, serverless API routes for the GitHub writes, easy middleware auth. |
| Hosting | **Vercel**, GitHub-connected | Push to `main` → auto-deploy. Preview deploys per PR. |
| Data store | **JSON via GitHub Contents API** (`data/bugbarn.json`) | "Data on the app/GH in JSON" as requested; version-controlled, free, human-readable, trivially backed up. |
| Photos | **Vercel Blob** (store URL in JSON) | Keeps the JSON document small and commits clean; images already downscaled client-side. |
| Auth | **Shared access code → signed httpOnly cookie**, enforced in `middleware.ts` | "Simple, keep bots out," no per-user accounts needed. |
| Crawlers | `X-Robots-Tag: noindex` + `robots.txt` disallow + meta robots | "Not published to web crawlers." |

> The app is **single-writer in practice** (a handful of lab staff, rarely simultaneous). That makes GitHub-as-database perfectly adequate. If concurrent editing ever becomes real, migrate the same JSON shape to **Vercel KV** (Redis) — see §7.

---

## 2. Suggested project structure
```
bugbarn-portal/
├─ app/
│  ├─ layout.tsx                 # <html>, fonts (next/font/google), global CSS, sidebar shell
│  ├─ page.tsx                   # Dashboard (default view)
│  ├─ collections/
│  │  ├─ page.tsx                # Collections list
│  │  └─ [id]/page.tsx           # Collection detail
│  ├─ schedule/page.tsx          # Care schedule (monthly/weekly)
│  ├─ sops/page.tsx              # SOP library
│  ├─ settings/page.tsx          # Export/import/reset/clear
│  ├─ login/page.tsx             # Access-code gate (public)
│  └─ api/
│     ├─ data/route.ts           # GET (read) + PUT (write) the JSON store
│     ├─ upload/route.ts         # POST image → Vercel Blob → returns URL
│     └─ auth/
│        ├─ login/route.ts       # POST access code → set session cookie
│        └─ logout/route.ts      # clear cookie
├─ components/                   # Dashboard, SpeciesCard, DetailView, modals, Toasts, Calendar…
├─ lib/
│  ├─ types.ts                   # CollectionEntry, Sop, CareLog, CareTask (from README)
│  ├─ store.ts                   # GitHub read/write client (server-only)
│  ├─ care.ts                    # PORTED: intervalDays, taskStatus, careStatus, stats, exhibit*
│  ├─ seed.ts                    # PORTED: seedData()
│  └─ auth.ts                    # cookie sign/verify helpers
├─ data/
│  └─ bugbarn.json               # the dataset (committed; seed it on first run)
├─ middleware.ts                 # auth gate + noindex header for all non-public routes
├─ public/robots.txt             # Disallow: /
├─ .env.local                    # secrets (NOT committed)
└─ next.config.js
```

> **State model:** the prototype is a client SPA driven by a `state` object + re-render. Two valid ports: (a) **route-per-view** (shown above) with data fetched in a client provider, or (b) keep a single client app with tab state. Route-per-view is recommended for shareable URLs (e.g. link straight to a species). Either way, load the whole dataset once into a client context (`SWR`/`React Query` or a simple provider) and mutate via the API.

---

## 3. Data persistence — GitHub Contents API

### Read
On the server, read `data/bugbarn.json`. Two options:
- **Simple:** fetch the raw file through the GitHub API each request (cache with Next's `revalidate`), or
- **Fastest:** import the committed file at build + revalidate on write.

```ts
// lib/store.ts (server only)
import { Octokit } from "@octokit/rest";
const octo = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = process.env.GITHUB_OWNER!;     // e.g. "purdue-bugbarn"
const REPO  = process.env.GITHUB_REPO!;      // e.g. "bugbarn-portal"
const BRANCH= process.env.GITHUB_BRANCH ?? "main";
const PATH  = "data/bugbarn.json";

export async function readStore() {
  const res = await octo.repos.getContent({ owner: OWNER, repo: REPO, path: PATH, ref: BRANCH });
  const file = res.data as { content: string; sha: string };
  const json = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
  return { data: json, sha: file.sha };       // keep sha for optimistic concurrency
}

export async function writeStore(data: unknown, sha: string, message: string) {
  await octo.repos.createOrUpdateFileContents({
    owner: OWNER, repo: REPO, path: PATH, branch: BRANCH, message, sha,
    content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
  });
}
```

### Write (API route)
```ts
// app/api/data/route.ts
import { readStore, writeStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const { data } = await readStore();
  return Response.json(data);
}

export async function PUT(req: Request) {
  const denied = requireAuth(req); if (denied) return denied;     // 401 if no valid cookie
  const body = await req.json();                                  // full updated dataset
  const { sha } = await readStore();                              // current sha (concurrency guard)
  await writeStore(body, sha, `data: update via portal ${new Date().toISOString()}`);
  return Response.json({ ok: true });
}
```

**Concurrency:** the `sha` makes writes optimistic — if two writes race, the second 409s; surface a "data changed, reload" toast and re-fetch. For this app that's rare. To reduce commit churn, **debounce writes** (e.g. flush 1–2s after the last mutation) rather than committing on every keystroke.

**Seeding:** if `data/bugbarn.json` is absent/empty on first deploy, write the ported `seedData()` output once (or commit a pre-seeded file). Keep the Settings "Reload sample data" action wired to the same seed.

### Photos — Vercel Blob
The prototype inlines downscaled JPEG dataURLs. That bloats JSON + every commit. In production:
```ts
// app/api/upload/route.ts
import { put } from "@vercel/blob";
export async function POST(req: Request) {
  // ...auth check...
  const form = await req.formData();
  const file = form.get("file") as File;            // already downscaled client-side
  const blob = await put(`specimens/${crypto.randomUUID()}.jpg`, file, { access: "public" });
  return Response.json({ url: blob.url });           // store this in entry.photo
}
```
Keep the client-side downscale (`fileToDataURL` → swap to produce a Blob) so uploads stay small. Set `entry.photo` to the returned Blob URL.

---

## 4. Auth — simple shared access code

**Goal:** keep bots/randoms from writing; no real user accounts. One shared code, rotated occasionally.

### Flow
1. `app/login/page.tsx` — a single password field ("Access code") → POST `/api/auth/login`.
2. Route compares to `process.env.BARN_ACCESS_CODE` (constant-time compare). On match, set a **signed, httpOnly, Secure, SameSite=Lax** cookie:
   ```ts
   // lib/auth.ts
   import { createHmac, timingSafeEqual } from "crypto";
   const SECRET = process.env.AUTH_SECRET!;
   export function makeToken() {
     const payload = `v1.${Date.now()}`;
     const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
     return `${payload}.${sig}`;
   }
   export function verifyToken(token?: string) {
     if (!token) return false;
     const [v, ts, sig] = token.split(".");
     const expect = createHmac("sha256", SECRET).update(`${v}.${ts}`).digest("hex");
     try { if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return false; } catch { return false; }
     return Date.now() - Number(ts) < 1000*60*60*24*30;     // 30-day session
   }
   ```
   ```ts
   // app/api/auth/login/route.ts
   export async function POST(req: Request) {
     const { code } = await req.json();
     const ok = code && process.env.BARN_ACCESS_CODE &&
       code.length === process.env.BARN_ACCESS_CODE.length &&
       timingSafeEqual(Buffer.from(code), Buffer.from(process.env.BARN_ACCESS_CODE));
     if (!ok) return new Response("nope", { status: 401 });
     const res = Response.json({ ok: true });
     res.headers.append("Set-Cookie",
       `barn_session=${makeToken()}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60*60*24*30}`);
     return res;
   }
   ```
3. `middleware.ts` enforces it on every route except `/login`, `/api/auth/*`, and static assets — and stamps the noindex header:
   ```ts
   // middleware.ts
   import { NextResponse } from "next/server";
   import { verifyToken } from "@/lib/auth";       // edge-compatible HMAC (use Web Crypto if needed)
   export function middleware(req) {
     const res = NextResponse.next();
     res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
     const { pathname } = req.nextUrl;
     const isPublic = pathname.startsWith("/login") || pathname.startsWith("/api/auth")
                    || pathname.startsWith("/_next") || pathname === "/robots.txt";
     if (isPublic) return res;
     const ok = verifyToken(req.cookies.get("barn_session")?.value);
     if (!ok) {
       if (pathname.startsWith("/api")) return new NextResponse("unauthorized", { status: 401 });
       const url = req.nextUrl.clone(); url.pathname = "/login"; return NextResponse.redirect(url);
     }
     return res;
   }
   export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
   ```
   > Note: `crypto` HMAC runs in Node runtime. If using Edge middleware, implement `verifyToken` with the Web Crypto API (`crypto.subtle`), or set `export const runtime = "nodejs"` where supported.

### Hardening (cheap, optional)
- **Rate-limit** `/api/auth/login` (e.g. a few attempts/min/IP via Vercel KV or `@upstash/ratelimit`) to blunt brute force.
- **Honeypot** field on the login form (bots fill it → reject).
- **Even simpler alternative:** Vercel's built-in **Deployment Protection → Password Protection** (Pro plan) gates the whole deployment at the platform level with zero code — but it's all-or-nothing and not per-route, so the cookie approach above is preferred if you want the app reachable but write-protected, or want a branded login.

### Anti-crawler
- `public/robots.txt`:
  ```
  User-agent: *
  Disallow: /
  ```
- `X-Robots-Tag: noindex, nofollow` header (set in middleware above) — stronger than robots.txt since it prevents indexing even if linked.
- Add `<meta name="robots" content="noindex, nofollow" />` in `app/layout.tsx` as belt-and-suspenders.

---

## 5. Environment variables (Vercel → Project → Settings → Environment Variables)
| Var | Example | Notes |
|---|---|---|
| `GITHUB_TOKEN` | `github_pat_…` | Fine-grained PAT with **Contents: Read/Write** on the data repo only. |
| `GITHUB_OWNER` | `purdue-bugbarn` | repo owner/org |
| `GITHUB_REPO` | `bugbarn-portal` | repo name (can be the app repo itself or a separate `bugbarn-data` repo) |
| `GITHUB_BRANCH` | `main` | branch to commit to (consider a dedicated `data` branch to avoid triggering redeploys on every save — see §6) |
| `BARN_ACCESS_CODE` | `long-random-passphrase` | the shared login code |
| `AUTH_SECRET` | `openssl rand -hex 32` | HMAC key for session cookie |
| `BLOB_READ_WRITE_TOKEN` | (auto when you add Vercel Blob) | for photo uploads |

---

## 6. GitHub → Vercel deployment (step by step)
1. **Create the repo** on GitHub (`bugbarn-portal`). Push the Next.js app. Commit an initial `data/bugbarn.json` (seeded or `{"collections":[],"sops":[],"carelogs":[]}`).
2. **Mint a fine-grained PAT** (GitHub → Settings → Developer settings → Fine-grained tokens): scope to this repo, **Contents: Read and write**. Copy it.
3. **Import to Vercel:** vercel.com → Add New → Project → pick the GitHub repo → Framework auto-detected (Next.js).
4. **Add env vars** (table §5) for Production (and Preview if desired). Generate `AUTH_SECRET` with `openssl rand -hex 32`; choose a strong `BARN_ACCESS_CODE`.
5. **(Optional) Add Vercel Blob:** Project → Storage → Blob → connect (injects `BLOB_READ_WRITE_TOKEN`).
6. **Deploy.** Visit the URL → you're redirected to `/login` → enter the access code → app loads.
7. **Data-commit loop caveat:** committing to `main` triggers a redeploy on every save. To avoid that, either commit data to a **separate `data` branch** (or separate `bugbarn-data` repo) that Vercel doesn't build from, or add **Ignored Build Step** in Vercel to skip builds when only `data/*.json` changed (e.g. `git diff --quiet HEAD^ HEAD -- . ':(exclude)data'`). **Recommended:** a separate data branch/repo — cleanest separation of code vs. data.

---

## 7. Future-proofing notes
- **Concurrent edits / higher write volume:** swap `lib/store.ts` to **Vercel KV** (`@vercel/kv`) using the identical JSON shape; keep a periodic export-to-GitHub job if you still want versioned JSON snapshots.
- **Per-user attribution:** the data already records `performedBy` on logs; if you later want real accounts, replace the shared code with NextAuth (GitHub/Google provider) — the cookie middleware pattern stays.
- **Backups:** the Settings Export already produces the canonical JSON; with GitHub storage you also get full git history of `bugbarn.json` for free.
- **Migrations:** include a top-level `version` in the JSON document; write a tiny `migrate(data)` in `lib/store.ts` that upgrades older shapes on read (e.g. backfill `careTasks`/`exhibit` defaults onto pre-existing entries).

---

## 8. Acceptance checklist (port is "done" when…)
- [ ] All 6 views + all modals match the prototype visually (tokens in README) and in copy.
- [ ] `careStatus`/`stats` ported verbatim; dashboard counts + due/overdue badges match the prototype for the same data.
- [ ] Add/Edit/Duplicate/Delete species; per-entry **enclosure label**; multiple same-species entries coexist.
- [ ] **Routine care task** editor changes drive due/overdue everywhere.
- [ ] **Exhibit check-out / return** with custodian, sent, due-back; overdue surfaces on dashboard.
- [ ] SOP generate/edit/print; care-log CRUD; monthly+weekly schedule.
- [ ] Reads/writes persist to `data/bugbarn.json` on GitHub; photos to Blob.
- [ ] Unauthenticated users are redirected to `/login`; API writes 401 without the cookie.
- [ ] `noindex` header + `robots.txt` present; site not indexable.
- [ ] Existing JSON backups (export shape) import cleanly into the server store.

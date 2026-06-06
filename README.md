# Bug Barn — Living Collections Portal

A husbandry-management web app for the **Purdue Entomology Bug Barn**. Lab staff
track living insect/arthropod colonies: housing, environment, diet, and risk;
generate a care **SOP** per species; log **care tasks** (feeding/cleaning/census/
observation); schedule **routine recurring care** that drives due/overdue alerts;
and track **exhibit check-outs** when an animal is loaned out for display or outreach.

Built with **Next.js (App Router) + TypeScript**, deployed on **Vercel**.

> The original design spec + prototype live in [`reference/`](reference/):
> `Bug Barn Dashboard.html` (visual/behavioral source of truth), `HANDOFF.md`
> (design + data model), and `ARCHITECTURE.md` (original architecture notes).

---

## How it works

| Concern | Implementation |
|---|---|
| **UI** | The prototype's design ported faithfully — CSS in `app/globals.css`, four Google fonts via `next/font`, icons in `components/Icon.tsx`. |
| **Data** | One JSON document. **Production:** Vercel Blob (`bugbarn.json` + specimen photos). **Local dev:** `./data/bugbarn.json` on disk (no setup needed). Seeds the demo dataset automatically on first run. |
| **State** | A client `DataProvider` loads the dataset once and persists mutations back to `/api/data` (debounced). Care logic is in `lib/care.ts` as pure functions. |
| **Auth** | One shared access code → signed httpOnly cookie, enforced in `middleware.ts`. Plus `noindex` headers + `robots.txt` so it's never crawled. |
| **Backups** | A Vercel Cron job (`/api/cron/backup`, every ~2 days) commits a snapshot of the dataset to a GitHub backup repo. Staff can also Export/Import JSON from Settings. |

Key paths: `app/(app)/` (the five views), `app/api/` (data/upload/auth/cron),
`components/modals/` (forms), `lib/` (types, care logic, seed, store).

---

## Local development

```bash
npm install
cp .env.example .env.local      # then edit BARN_ACCESS_CODE
npm run dev
```

Open http://localhost:3000 → you'll be redirected to `/login`. Enter the
`BARN_ACCESS_CODE` you set. With no Blob token configured, data is read/written
to `./data/bugbarn.json` (git-ignored) and uploaded photos are inlined as data
URLs, so the whole app works offline.

Only `BARN_ACCESS_CODE` is required locally. See [`.env.example`](.env.example) for the rest.

---

## Deploy to Vercel (greenfield)

1. **Create a GitHub repo** and push this project.
2. **Import to Vercel:** vercel.com → Add New → Project → pick the repo
   (Next.js is auto-detected).
3. **Add Vercel Blob:** Project → Storage → Blob → Connect. This injects
   `BLOB_READ_WRITE_TOKEN` and is where `bugbarn.json` + photos will live.
4. **Set environment variables** (Project → Settings → Environment Variables):
   - `BARN_ACCESS_CODE` — the shared login code for staff.
   - `AUTH_SECRET` — `openssl rand -hex 32`.
5. **Deploy.** Visit the URL → `/login` → enter the code → the demo data seeds
   itself on first load. Use **Settings → Clear all data** to start empty.

### Optional: automatic GitHub backups (recommended)

1. Create a **separate** GitHub repo, e.g. `bugbarn-backup` (can be private).
2. Mint a **fine-grained PAT** (GitHub → Settings → Developer settings →
   Fine-grained tokens) scoped to that repo with **Contents: Read and write**.
3. Add env vars in Vercel: `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`
   (`bugbarn-backup`), `GITHUB_BRANCH` (`main`), and `CRON_SECRET`
   (`openssl rand -hex 32`).
4. The cron in [`vercel.json`](vercel.json) runs `/api/cron/backup` every 2 days
   and commits `bugbarn.json` to that repo (full version history for free).

> Cron jobs need a Vercel plan that supports them. Without the GitHub vars the
> cron simply no-ops, and Settings → Export still gives manual backups.

---

## Notes

- **Security is intentionally light** (one shared code, low-friction). The blob
  storing `bugbarn.json` is public-read at an unguessable URL; the data
  (invertebrate husbandry) is low-sensitivity. Rotate `BARN_ACCESS_CODE`
  occasionally. To rotate, change the env var and redeploy.
- **Photos** are downscaled client-side (≤900px JPEG) before upload to keep
  storage small.
- `npm run lint` / `npx tsc --noEmit` to check; `npm run build` to build.

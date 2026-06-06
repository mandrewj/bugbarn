# Handoff: Bug Barn Living Collections Portal

## Overview
The **Bug Barn Portal** is a husbandry-management web app for the Purdue Entomology Bug Barn. Lab staff use it to track living insect/arthropod collections: each species/colony entry records housing, environment, diet, and risk; generates a care **SOP** (Standard Operating Procedure); logs **care tasks** (feeding/cleaning/census/observation); schedules **routine recurring care** that drives due/overdue alerts; and tracks **exhibit check-outs** when an animal is loaned out for display or outreach.

The deliverable in this conversation is a **fully working single-file HTML prototype** (`reference/Bug Barn Dashboard.html`). This README + `ARCHITECTURE.md` describe how to rebuild it as a **deployable Next.js app on Vercel**, sourced from GitHub, with data persisted as **JSON** and a **simple auth gate**.

---

## About the Design Files
`reference/Bug Barn Dashboard.html` is a **design reference and behavioral spec**, not production code to ship as-is. It is a self-contained vanilla-JS prototype (data in `localStorage`) that demonstrates the intended **look, layout, copy, and every interaction** in full working detail. Open it in a browser to explore real behavior — it ships with seed data (8 species, 6 SOPs, ~3 weeks of care history, 2 exhibit loans).

**Your task:** recreate this design in a **real Next.js codebase** (see `ARCHITECTURE.md`) using a proper component structure, server-side JSON persistence, and an auth layer — while preserving the exact visual design, copy, and interaction model. The prototype's inline CSS and JS are the source of truth for *styling and behavior*; the architecture doc is the source of truth for *how to structure and deploy it*.

Because the prototype's logic (scheduling math, status derivation, seed data, form validation) is already correct and battle-tested, **port it rather than reinvent it** — the functions are small and self-contained (see "Logic to Port" below).

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy, and interactions are all specified. Recreate the UI pixel-faithfully. All design tokens are listed below and defined as CSS variables in the prototype's `:root`.

---

## Recommended Stack (see ARCHITECTURE.md for full detail)
- **Framework:** Next.js (App Router) + TypeScript — best fit for Vercel + GitHub.
- **Styling:** Port the prototype's CSS as-is. It's plain CSS with custom properties; drop it into a global stylesheet (or CSS Modules per component). No Tailwind needed, though Tailwind tokens are provided below if the team prefers it.
- **Hosting:** Vercel, auto-deployed from a GitHub repo.
- **Persistence:** JSON, stored via the **GitHub Contents API** (`data/bugbarn.json` committed to the repo) — version-controlled and free. Photos via **Vercel Blob** (URLs in JSON) to keep the JSON small. Alternative: Vercel KV/Blob for the whole dataset.
- **Auth:** Single shared **access code** → signed httpOnly session cookie, enforced in `middleware.ts`. Plus `noindex` headers + `robots.txt` disallow so crawlers never index it.

---

## Data Model
Three collections, persisted together in one JSON document:
```jsonc
{
  "collections": [ /* CollectionEntry[] */ ],
  "sops":        [ /* Sop[] */ ],
  "carelogs":    [ /* CareLog[] */ ]
}
```

### CollectionEntry (a species *in a specific enclosure*)
> Note: the app supports **multiple entries of the same species** in separate enclosures. `enclosureLabel` distinguishes duplicates. The "Duplicate" action clones an entry (new id, SOP + exhibit reset, care tasks copied) for fast multi-colony setup.
```ts
interface CollectionEntry {
  id: string;                 // uuid
  commonName: string;         // required
  scientificName: string;     // required — always rendered italic
  dateAdded: string;          // ISO date
  colonySize: number;
  lifeStages: string[];       // any of: egg, larva, nymph, pupa, juvenile, adult
  enclosureType: string;      // Terrarium, Deli cup, Mesh cage, Custom… (free text + datalist)
  enclosureSize: string;      // e.g. "24×18×18 in"
  enclosureLabel: string;     // NEW — distinguishes duplicate colonies, e.g. "Rack B · Tank 2"
  substrate: string;
  temperature: string;        // range string, e.g. "72-78°F"
  humidity: string;           // range string, e.g. "50-70%"
  diet: string;
  feedingFrequency: string;   // free text, e.g. "Every 3 days"
  notes: string;
  photo: string | null;       // prototype: downscaled JPEG dataURL. PROD: Vercel Blob URL.
  sopId: string | null;
  exhibit: {                  // NEW — exhibit check-out state
    onExhibit: boolean;
    sentOut: string | null;   // ISO date loaned out
    dueBack: string | null;   // ISO date expected back (optional)
    custodian: string;        // who/where has it, e.g. "Ms. Carter · Klondike Elementary"
  };
  careTasks: CareTask[];      // NEW — routine recurring care (drives due/overdue)
  createdAt: string;          // ISO timestamp
  updatedAt: string;          // ISO timestamp
}

interface CareTask {
  id: string;
  label: string;              // "Feeding", "Spot-clean & water", "UV headcount"…
  taskType: "feeding" | "cleaning" | "census" | "observation" | "other";
  frequency: "daily" | "weekly" | "monthly";
}
```

### Sop
```ts
interface Sop {
  id: string;
  collectionId: string;
  speciesName: string;
  biologyOverview: string;
  housingEnvironment: string;
  feedingProtocol: string;
  cleaningSchedule: string;
  populationCensus: string;
  healthSafetyNotes: string;
  ppeRequired: string;        // comma-joined subset of: gloves, eye protection, long sleeves, respirator
  biteStingRisk: "low" | "medium" | "high";
  notes: string;
  createdAt: string;
  updatedAt: string;
}
```

### CareLog
```ts
interface CareLog {
  id: string;
  collectionId: string;
  date: string;               // ISO date
  frequency: "daily" | "weekly" | "monthly";
  taskType: "feeding" | "cleaning" | "census" | "observation" | "other";
  performedBy: string;
  notes: string;
  colonyCountRecorded: number | null;  // if set, also updates the entry's colonySize
  createdAt: string;
}
```

> **Prototype localStorage keys** (for reference / migration): `bugbarn_collections`, `bugbarn_sops`, `bugbarn_carelogs`, plus `bugbarn_seeded` (flag) and `bugbarn_lastkeeper` (remembers last "performed by" name). The existing JSON export/import (Settings view) already emits `{ exportedAt, app, version, bugbarn_collections, bugbarn_sops, bugbarn_carelogs }` — reuse that shape for the server JSON document so existing backups import cleanly.

---

## Logic to Port (already correct in the prototype — copy, don't rewrite)
These live in the prototype's `<script>` and should move into `lib/` as pure functions, unit-testable and framework-agnostic:

- **`intervalDays(freqStr)`** — parses free-text feeding frequency → day count.
- **`taskFreqDays(freq)`** — maps `daily/weekly/monthly` → 1/7/30.
- **`taskStatus(colId, task)`** — for one recurring task: finds the last log of its `taskType`, returns `{status: 'overdue'|'due'|'ok', daysSince, nextDays}`.
- **`careStatus(entry)`** — aggregates all of an entry's `careTasks` → worst-case status + due/overdue counts. **This drives every due/overdue badge and the dashboard counters.** A task is **overdue** if days-since-last-log-of-that-type > its interval; **due** if exactly equal; else **ok**.
- **`exhibitReturnOverdue(entry)`** — true when `onExhibit && dueBack` is in the past.
- **`stats()`** — dashboard rollups: species count, total individuals, tasks due today, overdue, stale (no care in 7+ days), on-exhibit count, exhibit-overdue list.
- **`fileToDataURL(file)`** — downscales an uploaded image to ≤900px JPEG @0.82 quality. In production, send the resulting blob to Vercel Blob instead of inlining.
- **`seedData()`** — the full demo dataset. Keep it as a one-time seed for an empty store / "Reload sample data" Settings action.

---

## Screens / Views
The app is a sidebar-nav SPA. Sidebar (236px, deep green `#2D5016`, 3px darker right border) is persistent; the right pane swaps views. Five nav items: **Dashboard, Collections, Care Schedule, SOP Library, Settings** (Collections & SOP show live counts). Brand lockup at top (amber circular bug glyph + "Bug Barn / LIVING COLLECTIONS"); field-station footer at bottom.

### 1. Dashboard
- **Header:** kicker "DAILY LOGBOOK", serif H1 "Good {morning/afternoon/evening}, keeper." (time-based), sub line "{weekday, month day} · N species under care · N on exhibit", **Add New Species** primary button (amber).
- **Alert banners** (amber left-border cards), shown when applicable: (a) exhibit loans past due for return, (b) species with no care logged in 7+ days.
- **4 stat cards** (dashed amber border, pinned dot top-right): Species housed · Individuals across colonies · Care tasks due today (amber) · Overdue (red when >0).
- **Two-column panels:** *Needs attention* (entries that are due/overdue, sorted soonest-first, max 4, each a clickable species row with thumbnail, italic sci name, colony/enclosure chips, risk badge, overdue/due flag) and *Recent activity* (last 8 care logs as a dotted feed, color-coded dot by task type, "{verb} {species} — {notes}" + relative time + performer).

### 2. Collections (main list)
- Header "All Species" + count sub. **Add New Species** button.
- **Toolbar:** search input (by common or scientific name) + life-stage filter pills (All + each stage).
- **Card grid** (`repeat(auto-fill, minmax(248px, 1fr))`, 18px gap). Each **species card**: 148px photo area (user photo or dashed placeholder), risk badge top-right, "On exhibit" amber ribbon along bottom of photo when loaned out; body has serif common name, italic sci name, mono enclosure label (green), colony/enclosure chips, overdue/due chip, "added {date}". Hover: lifts 3px + shadow. Click → Detail.
- Empty state with bug icon when no matches / no data.

### 3. Collection Detail
- Back link, header with kicker "{enclosureType} · {enclosureLabel} · added {date}", serif H1 common name, italic sci name. Action buttons: **Duplicate**, **Edit**, **Delete** (danger).
- **Left column:** large photo (or placeholder), risk + schedule-status badges, **Location/Exhibit card** (see Interactions), **Log Care Task** green button.
- **Right column:**
  - **Spec grid** (2-col, hairline-divided cells): colony size, life stages (pills), enclosure, enclosure size, substrate, temperature, humidity, diet, feeding frequency, notes (full-width).
  - **Routine care tasks** section + **Manage tasks** button → table of each task (label, type tag, frequency, last-done date, live status: "in Nd" / "due today" / "Nd overdue").
  - **SOP section:** if exists → risk badge + PPE chip + Print/PDF + View/Edit buttons, then each filled SOP section. If not → dashed empty card + **Generate SOP from Template**.
  - **Care Log:** frequency filter pills (All/daily/weekly/monthly) + total count; table (Date/time, Task tag, Freq, By, Count, Notes, delete-row). Empty state when none.

### 4. Care Schedule
- Header + **Monthly / Weekly** segmented toggle + **Log Care Task** button. Overdue strip alert when applicable. Legend of task-type colors.
- **Monthly:** month nav (‹ label › + Today), 7-col calendar; green header row; each day cell min-height 96px; today highlighted amber; up to 3 event chips (color-tinted by task type, species short-name) + "+N more"; click a day → day modal listing its logs.
- **Weekly:** week nav (‹ range › + This week), 7 stacked day cards (today outlined amber), each listing its tasks (dot + type tag + species + notes + performer) or "No tasks logged."

### 5. SOP Library
- Header "{N of M} species documented". Card grid of documented species (common name, risk badge, italic sci name, 3-line overview clamp, PDF + Edit buttons). Then an "Awaiting an SOP" section: cards with **Generate SOP** buttons. Empty state when none.

### 6. Settings
- Cards: **Export data** (download `bugbarn_backup_YYYY-MM-DD.json`), **Import data** (file picker → merge **or** replace, via confirm dialog), **Reset sample data** (reload demo set), **Clear all data** (danger, confirm). In production, "Export/Import" still make sense as manual backup on top of the GitHub store.

### Modals (centered, cream, sticky header + footer, Esc/backdrop to close)
- **Add/Edit species** — full form incl. image dropzone (drag-drop/browse), required common+scientific (inline validation), date, colony size, life-stage checkboxes, enclosure type (datalist), size, **enclosure label**, substrate, temp, humidity, feeding freq, diet, notes. On new-save → prompts "Create a care SOP now?".
- **Care log** — species (locked if opened from detail), date (defaults today), task type, frequency (radio), performed by (remembers last), colony count (optional → updates colonySize), notes.
- **SOP editor** — pre-fills housing/feeding from the entry; textareas per section, risk dropdown, PPE checkboxes.
- **Exhibit check-out** — custodian/where, date sent (defaults today), due back (optional). When already on exhibit, the button becomes "Return to barn" (confirm).
- **Manage care tasks** — editable rows (label / type / frequency) + add/remove.
- **Confirm dialog** — generic, danger styling for destructive actions.
- **Toasts** — bottom-right, green (or amber-red for errors), auto-dismiss ~2.6s.

---

## Interactions & Behavior
- **Exhibit check-out:** Detail location card toggles between *In the Bug Barn* (green, "Check out to exhibit" button) and *On exhibit* (amber, shows custodian / sent / due-back, "Return to barn" button). Past-due returns turn the card red + show an "overdue" badge and surface on the dashboard alert + header count.
- **Duplicate:** clones the entry into a new enclosure (new id, SOP/exhibit reset, careTasks copied with new ids), then opens Edit so the user sets the new enclosure label.
- **Routine care drives status:** editing an entry's `careTasks` changes its due/overdue computation everywhere (dashboard counts, list badges, schedule flags). A care log of a given `taskType` "satisfies" all tasks of that type for the interval.
- **Validation:** common + scientific names required (inline "Required" + red field). Care log requires a "performed by" name.
- **Confirmations** before every destructive action (delete entry/log, clear data, replace-on-import, return-from-exhibit).
- **Photo handling:** drag-drop or browse, downscaled client-side before store. Scientific names always italic (Spectral).
- **Responsive:** sidebar + content collapse gracefully; stat grid → 2-col under 760px; detail → single column under 880px; designed to work on a lab tablet.
- **Print:** SOP Print/PDF swaps to a print stylesheet (clean typographic SOP, double-rule title, species + risk header) and calls `window.print()`.

---

## Design Tokens
**Colors**
| Token | Hex | Use |
|---|---|---|
| green | `#2D5016` | sidebar, primary green buttons, headings accents |
| green-d | `#24400f` | sidebar border, button shadow |
| green-l | `#3c6b1f` | links, low-risk fg, enclosure label |
| amber | `#C8860A` | primary buttons, pins, accent bars, census color |
| amber-d | `#9a6708` | amber button shadow, kicker hover, med-risk fg |
| cream | `#F5F0E8` | app background, modal bg |
| paper | `#FFFDF8` | cards, inputs |
| paper2 | `#FBF6EC` | dimmed/hover rows, calendar dim cells |
| ink | `#3B2007` | primary text |
| ink2 | `#6f6244` | secondary text |
| ink3 | `#998a6b` | tertiary/mono labels |
| sage | `#7A9E5A` | accents, checked pill border |
| line | `#E3D7BD` | borders/dividers |
| line2 | `#EFE7D3` | chips, subtle fills |
| dash | `#C9B894` | dashed borders, placeholders |
| low-bg / low-fg | `#DCEBC8` / `#3c6b1f` | low risk badge |
| med-bg / med-fg | `#F6E2BC` / `#946008` | medium risk / exhibit |
| high-bg / high-fg | `#F3CDBE` / `#9a3210` | high risk / overdue / danger |

**Task-type colors:** feeding `#5a8a32` · cleaning `#4a86b0` · census `#C8860A` · observation `#8a7a5e` · other `#9a8a6c`.

**Typography** (Google Fonts)
- **Merriweather** — serif headings/numerals. Weights 400/700/900. (H1 ~29px/900; panel titles ~16px/700.)
- **Source Sans 3** — body/UI sans. 400/500/600/700.
- **IBM Plex Mono** — kickers, labels, metadata, dates. 400/500/600. Used uppercase with `.16–.2em` letter-spacing for kickers.
- **Spectral** — italic scientific names only. 400/600 italic.

**Spacing / radius / shadow**
- Card padding 16–20px; grid gaps 14–22px; view padding 28–36px.
- Radii: buttons/inputs 8px; chips/badges 999px; cards 11–13px; modals 16px.
- `--shadow: 0 1px 0 rgba(59,32,7,.04)`; `--shadow2: 0 8px 30px -10px rgba(59,32,7,.28)` (modals, toasts, card hover).
- Focus ring: `border-color:#C8860A; box-shadow:0 0 0 3px rgba(200,134,10,.12)`.

**Optional Tailwind config** (if the team uses Tailwind instead of porting raw CSS):
```js
// tailwind.config — theme.extend.colors
barn: {
  green:'#2D5016', greenD:'#24400f', greenL:'#3c6b1f',
  amber:'#C8860A', amberD:'#9a6708',
  cream:'#F5F0E8', paper:'#FFFDF8', paper2:'#FBF6EC',
  ink:'#3B2007', ink2:'#6f6244', ink3:'#998a6b', sage:'#7A9E5A',
  line:'#E3D7BD', line2:'#EFE7D3', dash:'#C9B894'
}
// fontFamily: serif:['Merriweather'], sans:['"Source Sans 3"'], mono:['"IBM Plex Mono"'], sci:['Spectral']
```

---

## Assets
- **No image assets** ship with the design — all specimen imagery is user-uploaded (drag-drop). Placeholders are pure CSS diagonal-stripe patterns.
- **Icons** are inline SVG (stroke-based, ~1.8 stroke width) defined in the prototype's `ICON` map — port them as a small icon set / React components. The brand "bug" glyph is a simple inline SVG (body + head + legs) on an amber circle.
- **Fonts** load from Google Fonts; in a Next app prefer `next/font/google` for the four families.

## Files
- `reference/Bug Barn Dashboard.html` — the complete working prototype (open in a browser). Inline `<style>` = visual source of truth; inline `<script>` (sectioned with `/* ===== SECTION: ... ===== */` comments) = behavioral + logic source of truth.
- `ARCHITECTURE.md` — Next.js project structure, GitHub-JSON persistence, photo storage, the auth gate, anti-crawler setup, and step-by-step GitHub→Vercel deployment.

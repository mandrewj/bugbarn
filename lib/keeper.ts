// ============================================================
// Lightweight keeper tracking (NOT security). Lets a handful of
// rotating students tag who is on shift so care logs auto-attribute.
// Stored client-side in localStorage only — no server involvement.
// ============================================================

const LAST_KEEPER_KEY = "bugbarn_lastkeeper";
const KEEPERS_KEY = "bugbarn_keepers";
const MAX_KEEPERS = 12;

export function getLastKeeper(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(LAST_KEEPER_KEY) || "";
  } catch {
    return "";
  }
}

/** Previously-used keeper names, most recent first. */
export function getKeepers(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEEPERS_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Record the active keeper and remember the name for future sessions. */
export function rememberKeeper(name: string): void {
  if (typeof window === "undefined") return;
  const clean = name.trim();
  try {
    localStorage.setItem(LAST_KEEPER_KEY, clean);
    if (clean) {
      const list = getKeepers().filter((k) => k.toLowerCase() !== clean.toLowerCase());
      list.unshift(clean);
      localStorage.setItem(KEEPERS_KEY, JSON.stringify(list.slice(0, MAX_KEEPERS)));
    }
  } catch {
    /* ignore quota / private-mode errors */
  }
}

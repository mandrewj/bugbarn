// ============================================================
// Date / time / text formatting — ported verbatim from the prototype
// ============================================================

export const MS_DAY = 86400000;

export function startOfDay(d: Date | string | number): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function daysBetween(a: Date | string | number, b: Date | string | number): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / MS_DAY);
}

export function fmtDate(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", opts || { month: "short", day: "numeric", year: "numeric" });
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(" ", "");
}

export function relTime(iso: string): string {
  const d = daysBetween(new Date(), iso);
  if (d === 0) return "today · " + fmtTime(iso);
  if (d === 1) return "yesterday · " + fmtTime(iso);
  if (d < 7) return d + " days ago";
  return fmtDate(iso, { month: "short", day: "numeric" });
}

/** "2026-06-05" local-date key, used by the schedule grouping. */
export function dateKey(d: Date | string | number): string {
  const x = new Date(d);
  return (
    x.getFullYear() +
    "-" +
    String(x.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(x.getDate()).padStart(2, "0")
  );
}

/**
 * Timestamp to store for a care log. If the picked date is today (local),
 * record the actual submit instant; if backdated, use that local date at the
 * current local time. Avoids the "YYYY-MM-DD parsed as UTC midnight" bug that
 * shifted logs to the previous evening in negative-offset timezones.
 */
export function logTimestamp(dateStr?: string): string {
  const now = new Date();
  if (!dateStr || dateStr === dateKey(now)) return now.toISOString();
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
}

/** Trim a long common name to its last two words for calendar chips. */
export function shortName(s: string): string {
  const w = s.split(" ");
  return w.length > 2 ? w.slice(-2).join(" ") : s;
}

/** #RRGGBB → rgba() with alpha. */
export function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function greeting(date = new Date()): "morning" | "afternoon" | "evening" {
  const h = date.getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}

export const nowISO = (): string => new Date().toISOString();

export function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

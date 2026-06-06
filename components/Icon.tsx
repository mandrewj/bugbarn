// ============================================================
// Icon set — ported from the prototype's inline `ICON` map.
// Stroke-based, ~1.8 stroke width. Use <Icon name="..." />.
// ============================================================
import type { SVGProps } from "react";

export type IconName =
  | "dash" | "bug" | "cal" | "sop" | "set" | "plus" | "search" | "back"
  | "edit" | "trash" | "print" | "dl" | "up" | "x" | "alert" | "leaf"
  | "chL" | "chR" | "img" | "box" | "home" | "copy" | "check" | "menu";

type PathSpec = { sw?: number; cap?: boolean; body: React.ReactNode };

const ICONS: Record<IconName, PathSpec> = {
  dash: { body: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></> },
  bug: { body: <><rect x="8" y="6" width="8" height="14" rx="4" /><path d="M12 6V3M9 4l-2-1M15 4l2-1M8 10H4M8 14H3.5M8 18l-3 2M16 10h4M16 14h4.5M16 18l3 2" /></> },
  cal: { body: <><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></> },
  sop: { body: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6M9 9h1" /></> },
  set: { body: <><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="13" cy="18" r="2" /></> },
  plus: { sw: 2.2, cap: true, body: <path d="M12 5v14M5 12h14" /> },
  search: { sw: 2, cap: true, body: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></> },
  back: { sw: 2, cap: true, body: <path d="M15 18l-6-6 6-6" /> },
  edit: { sw: 1.9, cap: true, body: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /> },
  trash: { sw: 1.9, cap: true, body: <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" /> },
  print: { sw: 1.9, cap: true, body: <><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="7" rx="1" /></> },
  dl: { sw: 1.9, cap: true, body: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /> },
  up: { sw: 1.9, cap: true, body: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 8l5-5 5 5M12 3v12" /> },
  x: { sw: 2, cap: true, body: <path d="M18 6 6 18M6 6l12 12" /> },
  alert: { sw: 1.9, cap: true, body: <><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></> },
  leaf: { sw: 1.6, cap: true, body: <><path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 9-4 13-9 13z" /><path d="M4 20c3-4 6-6 10-7" /></> },
  chL: { sw: 2, cap: true, body: <path d="M15 18l-6-6 6-6" /> },
  chR: { sw: 2, cap: true, body: <path d="M9 18l6-6-6-6" /> },
  img: { sw: 1.6, cap: true, body: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></> },
  box: { sw: 1.8, cap: true, body: <><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></> },
  home: { sw: 1.8, cap: true, body: <path d="M3 11l9-7 9 7M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" /> },
  copy: { sw: 1.8, cap: true, body: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></> },
  check: { sw: 2.2, cap: true, body: <path d="M20 6 9 17l-5-5" /> },
  menu: { sw: 2, cap: true, body: <path d="M3 6h18M3 12h18M3 18h18" /> },
};

export function Icon({ name, ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const spec = ICONS[name];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={spec.sw ?? 1.8}
      strokeLinecap={spec.cap ? "round" : undefined}
      strokeLinejoin={spec.cap ? "round" : undefined}
      aria-hidden="true"
      {...rest}
    >
      {spec.body}
    </svg>
  );
}

/** The amber circular brand glyph (body + head + legs). */
export function BrandMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <ellipse cx="12" cy="14" rx="4.4" ry="5.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="6" r="2.5" fill="currentColor" stroke="none" />
      <path d="M9 9 L4.5 6 M15 9 L19.5 6 M8.4 13 L3.5 12 M15.6 13 L20.5 12 M8.6 17 L4.5 19 M15.4 17 L19.5 19" />
    </svg>
  );
}

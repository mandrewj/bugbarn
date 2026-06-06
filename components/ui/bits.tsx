import type { ReactNode } from "react";
import type { Risk, CollectionEntry, PermitStatus } from "@/lib/types";
import type { CareStatus } from "@/lib/care";
import { PERMIT_LABELS } from "@/lib/constants";
import { Icon, type IconName } from "@/components/Icon";

const PLACEHOLDER_BG: React.CSSProperties = {
  backgroundColor: "#ddd3bd",
  backgroundImage: "repeating-linear-gradient(45deg,rgba(0,0,0,.05) 0 7px,transparent 7px 14px)",
};

/** Risk pill matching the prototype's riskBadge(): "low risk" / "med risk" / "high risk" / "no SOP". */
export function RiskBadge({ risk }: { risk: Risk | null | undefined }) {
  if (!risk) return <span className="risk none">no SOP</span>;
  const cls = risk === "medium" ? "med" : risk;
  const label = risk === "medium" ? "med" : risk;
  return <span className={`risk ${cls}`}>{label} risk</span>;
}

/** USDA permit classification flag. Permitted = showy amber (compliance
 * reminder); unpermitted = calm green. */
export function PermitBadge({ status }: { status: PermitStatus | null | undefined }) {
  const s: PermitStatus = status === "permitted" ? "permitted" : "unpermitted";
  return <span className={`permit ${s}`}>{PERMIT_LABELS[s]}</span>;
}

export function Chip({ children, tone }: { children: ReactNode; tone?: "med" | "high" }) {
  const style =
    tone === "high"
      ? { background: "var(--high-bg)", color: "var(--high-fg)" }
      : tone === "med"
        ? { background: "var(--med-bg)", color: "var(--med-fg)" }
        : undefined;
  return (
    <span className="chip" style={style}>
      {children}
    </span>
  );
}

/** A small square thumbnail (dashboard rows). */
export function Thumb({ photo, className = "srow-thumb" }: { photo: string | null; className?: string }) {
  if (photo) return <img className={className} src={photo} alt="" />;
  return <div className={className} style={PLACEHOLDER_BG} />;
}

export function PageHeader({
  kicker,
  title,
  sub,
  action,
  style,
}: {
  kicker: string;
  title: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="phead" style={style}>
      <div>
        <p className="kicker">{kicker}</p>
        <h1 className="ptitle">{title}</h1>
        {sub != null ? <p className="psub">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <Icon name={icon} />
      <h3>{title}</h3>
      {children ? <p className="muted">{children}</p> : null}
    </div>
  );
}

export function Splash() {
  return <div className="splash">Loading the barn…</div>;
}

/** Inline due/overdue chip used on dashboard rows + cards. */
export function CareStatusChip({ st, mode }: { st: CareStatus; mode: "row" | "card" }) {
  if (st.status === "overdue") {
    const label = mode === "row" ? (st.daysSince === Infinity ? "never fed" : `${st.daysSince}d overdue`) : "overdue";
    return <Chip tone="high">{label}</Chip>;
  }
  if (st.status === "due") return <Chip tone="med">due today</Chip>;
  return null;
}

export function exhibitChip(c: CollectionEntry) {
  return c.exhibit?.onExhibit ? <Chip tone="med">on exhibit</Chip> : null;
}

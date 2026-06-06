"use client";

import type { CollectionEntry } from "@/lib/types";
import { exhibitOf, exhibitReturnOverdue } from "@/lib/care";
import { fmtDate, daysBetween } from "@/lib/format";
import { Icon } from "@/components/Icon";

export function LocationCard({ entry, onToggle }: { entry: CollectionEntry; onToggle: () => void }) {
  const e = exhibitOf(entry);

  if (e.onExhibit) {
    const over = exhibitReturnOverdue(entry);
    const dueTxt = e.dueBack
      ? over
        ? `return ${Math.abs(daysBetween(new Date(), e.dueBack))}d overdue`
        : `due back ${fmtDate(e.dueBack)}`
      : "no return date";
    return (
      <div className={`loccard exhibit ${over ? "over" : ""}`}>
        <div className="loctop">
          <span className="locpill exhibit">
            <Icon name="box" /> On exhibit
          </span>
          {over ? <span className="risk high">overdue</span> : null}
        </div>
        {e.custodian ? (
          <div className="locrow">
            <span className="lk">With</span>
            <span className="lv">{e.custodian}</span>
          </div>
        ) : null}
        <div className="locrow">
          <span className="lk">Sent</span>
          <span className="lv">{e.sentOut ? fmtDate(e.sentOut) : "—"}</span>
        </div>
        <div className="locrow">
          <span className="lk">Return</span>
          <span className={`lv ${over ? "over" : ""}`}>{dueTxt}</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onToggle} style={{ marginTop: 11, width: "100%", justifyContent: "center" }}>
          <Icon name="home" /> Return to barn
        </button>
      </div>
    );
  }

  return (
    <div className="loccard">
      <div className="loctop">
        <span className="locpill barn">
          <Icon name="home" /> In the Bug Barn
        </span>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={onToggle} style={{ marginTop: 11, width: "100%", justifyContent: "center" }}>
        <Icon name="box" /> Check out to exhibit
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";
import type { CollectionEntry } from "@/lib/types";
import { useData } from "@/components/providers/DataProvider";
import { careStatus, riskOf, exhibitOf } from "@/lib/care";
import { Thumb, RiskBadge, CareStatusChip, Chip } from "@/components/ui/bits";

export function SpeciesRow({ c, onLog }: { c: CollectionEntry; onLog?: (id: string) => void }) {
  const { sops, carelogs } = useData();
  const risk = riskOf(sops, c.id);
  const st = careStatus(carelogs, c);

  const inner = (
    <>
      <Thumb photo={c.photo} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="srow-name">{c.commonName}</div>
        <div className="sci">{c.scientificName}</div>
        <div className="metarow">
          <Chip>colony · {c.colonySize || 0}</Chip>
          <Chip>{c.enclosureType || "—"}</Chip>
          {exhibitOf(c).onExhibit ? <Chip tone="med">on exhibit</Chip> : null}
          <RiskBadge risk={risk} />
          <CareStatusChip st={st} mode="row" />
        </div>
      </div>
    </>
  );

  // On the dashboard "needs attention" list, clicking a row jumps straight to
  // logging care for that species rather than navigating to its detail page.
  if (onLog) {
    return (
      <button type="button" className="srow srow-btn" onClick={() => onLog(c.id)}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={`/collections/${c.id}`} className="srow">
      {inner}
    </Link>
  );
}

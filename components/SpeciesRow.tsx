"use client";

import Link from "next/link";
import type { CollectionEntry } from "@/lib/types";
import { useData } from "@/components/providers/DataProvider";
import { careStatus, riskOf, exhibitOf } from "@/lib/care";
import { Thumb, RiskBadge, CareStatusChip, Chip } from "@/components/ui/bits";

export function SpeciesRow({ c }: { c: CollectionEntry }) {
  const { sops, carelogs } = useData();
  const risk = riskOf(sops, c.id);
  const st = careStatus(carelogs, c);

  return (
    <Link href={`/collections/${c.id}`} className="srow">
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
    </Link>
  );
}

"use client";

import Link from "next/link";
import type { CollectionEntry } from "@/lib/types";
import { useData } from "@/components/providers/DataProvider";
import { careStatus, riskOf, exhibitOf } from "@/lib/care";
import { fmtDate } from "@/lib/format";
import { RiskBadge, CareStatusChip, Chip, PermitBadge } from "@/components/ui/bits";

export function SpeciesCard({ c }: { c: CollectionEntry }) {
  const { sops, carelogs } = useData();
  const risk = riskOf(sops, c.id);
  const st = careStatus(carelogs, c);
  const onEx = exhibitOf(c).onExhibit;

  return (
    <Link href={`/collections/${c.id}`} className={`scard ${c.retired ? "retired" : ""}`}>
      <div className="photo">
        {c.photo ? (
          <img src={c.photo} alt="" />
        ) : (
          <div className="ph">
            <span>drop specimen photo</span>
          </div>
        )}
        <div className="riskbadge">
          <RiskBadge risk={risk} />
        </div>
        {c.retired ? <div className="exhibitribbon retired-ribbon">Retired</div> : onEx ? <div className="exhibitribbon">On exhibit</div> : null}
      </div>
      <div className="bd">
        <h4>{c.commonName}</h4>
        <div className="sci">{c.scientificName}</div>
        {c.enclosureLabel ? <div className="enclabel">{c.enclosureLabel}</div> : null}
        <div className="cardmeta">
          <PermitBadge status={c.permitStatus} />
          <Chip>colony · {c.colonySize || 0}</Chip>
          <Chip>{c.enclosureType || "—"}</Chip>
          {c.retired ? null : <CareStatusChip st={st} mode="card" />}
        </div>
        <div className="added">added {fmtDate(c.dateAdded)}</div>
      </div>
    </Link>
  );
}

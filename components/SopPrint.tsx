"use client";

import { useCallback } from "react";
import type { CollectionEntry, Sop } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { usePrint } from "@/components/ui/Print";
import { useToast } from "@/components/ui/Toasts";

const PRINT_SECTIONS: { label: string; key: keyof Sop }[] = [
  { label: "Biology Overview", key: "biologyOverview" },
  { label: "Housing & Environment", key: "housingEnvironment" },
  { label: "Feeding Protocol", key: "feedingProtocol" },
  { label: "Cleaning Schedule & Protocol", key: "cleaningSchedule" },
  { label: "Population Census", key: "populationCensus" },
  { label: "Health & Safety Notes", key: "healthSafetyNotes" },
  { label: "General Notes", key: "notes" },
];

export function SopPrint({ entry, sop }: { entry: CollectionEntry; sop: Sop }) {
  return (
    <>
      <div className="p-title">{entry.commonName} — Care SOP</div>
      <div className="p-sci">{entry.scientificName}</div>
      <div className="p-meta">
        PURDUE ENTOMOLOGY · BUG BARN LIVING COLLECTIONS · Enclosure: {entry.enclosureType || "—"} · Colony size:{" "}
        {entry.colonySize || 0} · Generated {new Date().toLocaleDateString()} · Risk:{" "}
        <span className="p-risk">{(sop.biteStingRisk || "low").toUpperCase()} BITE/STING</span>
        {sop.ppeRequired ? ` · PPE: ${sop.ppeRequired}` : ""}
      </div>
      {PRINT_SECTIONS.filter(({ key }) => sop[key]).map(({ label, key }) => (
        <div className="p-sec" key={key}>
          <h3>{label}</h3>
          <p>{String(sop[key])}</p>
        </div>
      ))}
      <div className="p-foot">
        Bug Barn Living Collections — printed from the husbandry dashboard. SOP last updated {fmtDate(sop.updatedAt)}.
      </div>
    </>
  );
}

/** Returns printSop(entry, sop?) that renders the SOP and opens the print dialog. */
export function usePrintSop() {
  const print = usePrint();
  const toast = useToast();
  return useCallback(
    (entry: CollectionEntry, sop: Sop | undefined) => {
      if (!sop) {
        toast("No SOP to print", "err");
        return;
      }
      print(<SopPrint entry={entry} sop={sop} />);
    },
    [print, toast],
  );
}

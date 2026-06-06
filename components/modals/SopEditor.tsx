"use client";

import { useCallback, useState } from "react";
import type { CollectionEntry, Sop, Risk } from "@/lib/types";
import { uuid, nowISO } from "@/lib/format";
import { PPE_OPTIONS, RISKS } from "@/lib/constants";
import { sopForCollection } from "@/lib/care";
import { useData } from "@/components/providers/DataProvider";
import { useModal, ModalShell } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toasts";
import { usePrintSop } from "@/components/SopPrint";
import { Icon } from "@/components/Icon";

function prefillSop(c: CollectionEntry): Sop {
  const housing = [
    c.enclosureType && `Enclosure: ${c.enclosureType}${c.enclosureSize ? ` (${c.enclosureSize})` : ""}`,
    c.temperature && `Temperature: ${c.temperature}`,
    c.humidity && `Humidity: ${c.humidity}`,
    c.substrate && `Substrate: ${c.substrate}`,
  ]
    .filter(Boolean)
    .join(". ");
  const feeding = [c.diet && `Diet: ${c.diet}`, c.feedingFrequency && `Frequency: ${c.feedingFrequency}`]
    .filter(Boolean)
    .join(". ");
  return {
    id: uuid(),
    collectionId: c.id,
    speciesName: c.commonName,
    biologyOverview: "",
    housingEnvironment: housing,
    feedingProtocol: feeding,
    cleaningSchedule: "",
    populationCensus: "",
    healthSafetyNotes: "",
    ppeRequired: "",
    biteStingRisk: "low",
    notes: c.notes || "",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
}

type SopTextKey =
  | "biologyOverview"
  | "housingEnvironment"
  | "feedingProtocol"
  | "cleaningSchedule"
  | "populationCensus"
  | "healthSafetyNotes"
  | "notes";

const TEXT_FIELDS: { label: string; key: SopTextKey; hint: string }[] = [
  { label: "Biology Overview", key: "biologyOverview", hint: "Life cycle summary, natural history, notable behaviors" },
  { label: "Housing & Environment", key: "housingEnvironment", hint: "Enclosure specs, temperature, humidity, substrate, lighting" },
  { label: "Feeding Protocol", key: "feedingProtocol", hint: "Diet items, frequency, amounts, food prep" },
  { label: "Cleaning Schedule & Protocol", key: "cleaningSchedule", hint: "Spot-clean & full-clean frequency, safe steps while animals are present" },
  { label: "Population Census", key: "populationCensus", hint: "How & how often to count/estimate colony size, what to record" },
];

function SopEditor({ entry, existing }: { entry: CollectionEntry; existing?: Sop }) {
  const { close } = useModal();
  const { saveSop } = useData();
  const toast = useToast();
  const printSop = usePrintSop();
  const isNew = !existing;

  const [sop, setSop] = useState<Sop>(existing ?? prefillSop(entry));
  const [ppe, setPpe] = useState<string[]>(
    (existing?.ppeRequired || "")
      .toLowerCase()
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  const set = (k: SopTextKey) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setSop((s) => ({ ...s, [k]: e.target.value }));

  const togglePpe = (p: string) => setPpe((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  function save() {
    const next: Sop = {
      ...sop,
      speciesName: entry.commonName,
      ppeRequired: ppe.join(", "),
      biologyOverview: sop.biologyOverview.trim(),
      housingEnvironment: sop.housingEnvironment.trim(),
      feedingProtocol: sop.feedingProtocol.trim(),
      cleaningSchedule: sop.cleaningSchedule.trim(),
      populationCensus: sop.populationCensus.trim(),
      healthSafetyNotes: sop.healthSafetyNotes.trim(),
      notes: sop.notes.trim(),
    };
    saveSop(next);
    close();
    toast(isNew ? `SOP created for ${entry.commonName}` : "SOP updated");
  }

  return (
    <ModalShell
      kicker={isNew ? "Generate SOP" : "Edit SOP"}
      title={`${entry.commonName} — Care SOP`}
      footer={
        <>
          <button className="btn btn-ghost left" onClick={close}>
            Cancel
          </button>
          {!isNew ? (
            <button className="btn btn-ghost" onClick={() => printSop(entry, sop)}>
              <Icon name="print" /> Print / PDF
            </button>
          ) : null}
          <button className="btn btn-primary" onClick={save}>
            {isNew ? "Create SOP" : "Save SOP"}
          </button>
        </>
      }
    >
      <div className="formgrid">
        {TEXT_FIELDS.map((f) => (
          <div className="field full" key={f.key}>
            <label>{f.label}</label>
            <div className="hint">{f.hint}</div>
            <textarea style={{ minHeight: 80 }} value={String(sop[f.key])} onChange={set(f.key)} />
          </div>
        ))}

        <div className="field">
          <label>Bite / sting risk</label>
          <select value={sop.biteStingRisk} onChange={(e) => setSop((s) => ({ ...s, biteStingRisk: e.target.value as Risk }))}>
            {RISKS.map((r) => (
              <option key={r} value={r}>
                {r[0].toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="field" />

        <div className="field full">
          <label>PPE required</label>
          <div className="checkrow">
            {PPE_OPTIONS.map((p) => (
              <label key={p} className={`checkpill ${ppe.includes(p) ? "on" : ""}`}>
                <input type="checkbox" checked={ppe.includes(p)} onChange={() => togglePpe(p)} />
                {p}
              </label>
            ))}
          </div>
        </div>

        <div className="field full">
          <label>Health &amp; Safety Notes</label>
          <div className="hint">Zoonosis concerns, escape risk level, first-aid notes</div>
          <textarea style={{ minHeight: 80 }} value={sop.healthSafetyNotes} onChange={set("healthSafetyNotes")} />
        </div>
        <div className="field full">
          <label>General Notes</label>
          <div className="hint">Anything else</div>
          <textarea style={{ minHeight: 80 }} value={sop.notes} onChange={set("notes")} />
        </div>
      </div>
    </ModalShell>
  );
}

/** Returns openSopEditor(collectionId) — opens the SOP editor for that species. */
export function useSopEditor() {
  const { open } = useModal();
  const { collections, sops } = useData();
  return useCallback(
    (colId: string) => {
      const entry = collections.find((c) => c.id === colId);
      if (!entry) return;
      open(<SopEditor entry={entry} existing={sopForCollection(sops, colId)} />, { wide: true });
    },
    [open, collections, sops],
  );
}

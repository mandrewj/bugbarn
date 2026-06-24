"use client";

import { useCallback, useState } from "react";
import type { CollectionEntry, RetireReason } from "@/lib/types";
import { dateKey, localDateISO, nowISO } from "@/lib/format";
import { RETIRE_REASONS } from "@/lib/constants";
import { useData } from "@/components/providers/DataProvider";
import { useModal, ModalShell } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toasts";

function RetireForm({ entry }: { entry: CollectionEntry }) {
  const { close } = useModal();
  const { saveCollection } = useData();
  const toast = useToast();

  const [reason, setReason] = useState<RetireReason>("deceased");
  const [date, setDate] = useState(dateKey(new Date()));
  const [note, setNote] = useState("");

  function save() {
    saveCollection({
      ...entry,
      retired: true,
      retiredReason: reason,
      retiredDate: date ? localDateISO(date) : nowISO(),
      retiredNote: note.trim(),
    });
    close();
    toast(`${entry.commonName} retired to the archive`);
  }

  return (
    <ModalShell
      kicker="Retire colony"
      title={`Retire ${entry.commonName}`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            Retire colony
          </button>
        </>
      }
    >
      <p className="muted" style={{ margin: "0 0 14px", fontSize: 13.5, lineHeight: 1.55 }}>
        Retiring keeps the full record, SOP, and all care history intact — it just removes{" "}
        <b>{entry.commonName}</b> from active dashboards, the care schedule, and due/overdue tracking. You can restore it
        anytime from its detail page.
      </p>
      <div className="formgrid">
        <div className="field full">
          <label>Reason</label>
          <div className="radiorow">
            {RETIRE_REASONS.map((r) => (
              <label key={r.value} className={`radiopill ${reason === r.value ? "on" : ""}`}>
                <input
                  type="radio"
                  name="retireReason"
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  style={{ display: "none" }}
                />
                {r.label}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field full">
          <label>
            Note <span className="hint">optional</span>
          </label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Cause, where it went, who handled it…" />
        </div>
      </div>
    </ModalShell>
  );
}

/** Returns openRetireForm(entry) — opens the retire-colony modal. */
export function useRetireForm() {
  const { open } = useModal();
  return useCallback((entry: CollectionEntry) => open(<RetireForm entry={entry} />), [open]);
}

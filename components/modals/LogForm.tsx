"use client";

import { useCallback, useState } from "react";
import type { CareLog, Frequency, TaskType } from "@/lib/types";
import { uuid, nowISO } from "@/lib/format";
import { TASK_TYPES, FREQUENCIES, FREQUENCY_LABELS } from "@/lib/constants";
import { useData } from "@/components/providers/DataProvider";
import { useModal, ModalShell } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toasts";

function LogForm({ colId }: { colId: string | null }) {
  const { close } = useModal();
  const { collections, saveLog, lastKeeper, setLastKeeper, keepers } = useData();
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);

  const [collectionId, setCollectionId] = useState(colId || collections[0]?.id || "");
  const [date, setDate] = useState(today);
  const [taskType, setTaskType] = useState<TaskType>("feeding");
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [performedBy, setPerformedBy] = useState(lastKeeper);
  const [colonyCount, setColonyCount] = useState("");
  const [notes, setNotes] = useState("");

  const locked = collections.find((c) => c.id === (colId || ""));

  function save() {
    if (!performedBy.trim()) {
      toast("Add who performed the task", "err");
      return;
    }
    const cid = colId || collectionId;
    const log: CareLog = {
      id: uuid(),
      collectionId: cid,
      date: new Date(date || today).toISOString(),
      frequency,
      taskType,
      performedBy: performedBy.trim(),
      colonyCountRecorded: colonyCount === "" ? null : Number(colonyCount),
      notes: notes.trim(),
      createdAt: nowISO(),
    };
    saveLog(log);
    setLastKeeper(log.performedBy);
    close();
    toast("Care task logged");
  }

  return (
    <ModalShell
      kicker="Care log"
      title={locked ? `Log care · ${locked.commonName}` : "Log a care task"}
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn btn-green" onClick={save}>
            Save log entry
          </button>
        </>
      }
    >
      <div className="formgrid">
        <div className="field full">
          <label>Species</label>
          <select value={collectionId} disabled={!!colId} onChange={(e) => setCollectionId(e.target.value)}>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.commonName}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Task type</label>
          <select value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)}>
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label>Frequency</label>
          <div className="radiorow">
            {FREQUENCIES.map((fr) => (
              <label key={fr} className={`radiopill ${frequency === fr ? "on" : ""}`}>
                <input type="radio" name="frequency" checked={frequency === fr} onChange={() => setFrequency(fr)} style={{ display: "none" }} />
                {FREQUENCY_LABELS[fr]}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Performed by</label>
          <input
            value={performedBy}
            onChange={(e) => setPerformedBy(e.target.value)}
            placeholder="Your name"
            list="keeperList"
          />
          <datalist id="keeperList">
            {keepers.map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label>
            Colony count recorded <span className="hint">optional</span>
          </label>
          <input type="number" min={0} value={colonyCount} onChange={(e) => setColonyCount(e.target.value)} placeholder="—" />
        </div>
        <div className="field full">
          <label>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was done, observations…" />
        </div>
      </div>
    </ModalShell>
  );
}

/** Returns openLogForm(colId?) — opens the care-log modal (species locked when colId given). */
export function useLogForm() {
  const { open } = useModal();
  return useCallback((colId?: string | null) => open(<LogForm colId={colId ?? null} />), [open]);
}

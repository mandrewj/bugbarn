"use client";

import { useCallback, useEffect, useState } from "react";
import type { CareLog } from "@/lib/types";
import { uuid, nowISO, dateKey, logTimestamp } from "@/lib/format";
import { LIFE_EVENTS } from "@/lib/constants";
import { useData } from "@/components/providers/DataProvider";
import { useModal, ModalShell } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toasts";

function LifeEventForm({ colId }: { colId: string | null }) {
  const { close } = useModal();
  const { collections, saveLog, lastKeeper, setLastKeeper, keepers } = useData();
  const toast = useToast();
  const today = dateKey(new Date());

  const [collectionId, setCollectionId] = useState(colId || collections[0]?.id || "");
  const [event, setEvent] = useState(LIFE_EVENTS[0]);
  const [date, setDate] = useState(today);
  const [performedBy, setPerformedBy] = useState(lastKeeper);
  const [note, setNote] = useState("");
  const [colonyCount, setColonyCount] = useState("");

  const entry = collections.find((c) => c.id === collectionId);

  useEffect(() => {
    setNote("");
    setColonyCount("");
  }, [collectionId]);

  function save() {
    if (!entry) {
      toast("Pick a species first", "err");
      return;
    }
    if (!performedBy.trim()) {
      toast("Add who observed it", "err");
      return;
    }
    const count = colonyCount === "" ? null : Number(colonyCount);
    const log: CareLog = {
      id: uuid(),
      collectionId: entry.id,
      date: logTimestamp(date),
      taskType: "life-event",
      taskLabel: event,
      performedBy: performedBy.trim(),
      colonyCountRecorded: count,
      notes: note.trim(),
      createdAt: nowISO(),
    };
    saveLog(log);
    setLastKeeper(performedBy.trim());
    close();
    toast(`Logged: ${event} · ${entry.commonName}`);
  }

  return (
    <ModalShell
      kicker="Life event"
      title={entry ? `Log life event · ${entry.commonName}` : "Log a life event"}
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn btn-green" onClick={save}>
            Save event
          </button>
        </>
      }
    >
      <p className="muted" style={{ margin: "0 0 12px", fontSize: 13 }}>
        Record a milestone — molting, egg-laying, hatching, a loss, and so on. It appears in the colony&apos;s log and
        recent activity (it doesn&apos;t affect care due dates).
      </p>
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
        <div className="field full">
          <label>Event</label>
          <select value={event} onChange={(e) => setEvent(e.target.value)}>
            {LIFE_EVENTS.map((ev) => (
              <option key={ev} value={ev}>
                {ev}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Observed by</label>
          <input value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} placeholder="Your name" list="keeperList" />
          <datalist id="keeperList">
            {keepers.map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
        </div>
        <div className="field full">
          <label>
            Notes <span className="hint">optional</span>
          </label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Details — count of eggs, which individual, conditions…" />
        </div>
        <div className="field full">
          <label>
            Colony count recorded <span className="hint">optional — updates colony size</span>
          </label>
          <input type="number" min={0} value={colonyCount} onChange={(e) => setColonyCount(e.target.value)} placeholder="—" />
        </div>
      </div>
    </ModalShell>
  );
}

/** Returns openLifeEventForm(colId?) — opens the life-event modal (species locked when colId given). */
export function useLifeEventForm() {
  const { open } = useModal();
  return useCallback((colId?: string | null) => open(<LifeEventForm colId={colId ?? null} />), [open]);
}

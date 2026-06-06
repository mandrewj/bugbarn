"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CareLog } from "@/lib/types";
import { uuid, nowISO } from "@/lib/format";
import { FREQUENCY_LABELS } from "@/lib/constants";
import { getCareTasks, taskStatus } from "@/lib/care";
import { useData } from "@/components/providers/DataProvider";
import { useModal, ModalShell } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toasts";

function LogForm({ colId }: { colId: string | null }) {
  const { close } = useModal();
  const { collections, carelogs, saveLog, lastKeeper, setLastKeeper, keepers } = useData();
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);

  const [collectionId, setCollectionId] = useState(colId || collections[0]?.id || "");
  const [date, setDate] = useState(today);
  const [performedBy, setPerformedBy] = useState(lastKeeper);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [noteOn, setNoteOn] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [colonyCount, setColonyCount] = useState("");

  const entry = collections.find((c) => c.id === collectionId);
  const tasks = useMemo(() => (entry ? getCareTasks(entry) : []), [entry]);

  // Reset the per-task selection when the species changes (ids differ).
  useEffect(() => {
    setChecked({});
    setNoteOn(false);
    setNoteText("");
    setColonyCount("");
  }, [collectionId]);

  const toggle = (id: string) => setChecked((m) => ({ ...m, [id]: !m[id] }));

  function save() {
    if (!entry) {
      toast("Pick a species first", "err");
      return;
    }
    if (!performedBy.trim()) {
      toast("Add who performed the task", "err");
      return;
    }
    const chosen = tasks.filter((t) => checked[t.id]);
    const includeNote = noteOn && noteText.trim().length > 0;
    if (chosen.length === 0 && !includeNote) {
      toast("Select at least one task, or add a care note", "err");
      return;
    }

    const iso = new Date(date || today).toISOString();
    const by = performedBy.trim();
    const count = colonyCount === "" ? null : Number(colonyCount);
    // The count belongs to a census task if one was logged, else the first entry.
    const countTargetId = (chosen.find((t) => t.taskType === "census") || chosen[0])?.id;

    const logs: CareLog[] = chosen.map((t) => ({
      id: uuid(),
      collectionId: entry.id,
      date: iso,
      frequency: t.frequency,
      taskId: t.id,
      taskType: t.taskType,
      taskLabel: t.label,
      performedBy: by,
      colonyCountRecorded: count != null && t.id === countTargetId ? count : null,
      notes: "",
      createdAt: nowISO(),
    }));

    if (includeNote) {
      logs.push({
        id: uuid(),
        collectionId: entry.id,
        date: iso,
        taskType: "other",
        taskLabel: "Care notes",
        performedBy: by,
        colonyCountRecorded: count != null && chosen.length === 0 ? count : null,
        notes: noteText.trim(),
        createdAt: nowISO(),
      });
    }

    logs.forEach((l) => saveLog(l));
    setLastKeeper(by);
    close();
    toast(`Logged ${logs.length} ${logs.length === 1 ? "entry" : "entries"}`);
  }

  return (
    <ModalShell
      kicker="Care log"
      title={entry ? `Log care · ${entry.commonName}` : "Log a care task"}
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn btn-green" onClick={save}>
            Save log
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
          <label>Performed by</label>
          <input value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} placeholder="Your name" list="keeperList" />
          <datalist id="keeperList">
            {keepers.map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="sectiontitle" style={{ margin: "10px 0 8px" }}>
        Tasks completed
      </div>
      <p className="muted" style={{ margin: "0 0 10px", fontSize: 13 }}>
        Check the routine care you carried out for {entry ? entry.commonName : "this colony"}.
      </p>

      <div className="tasklog">
        {tasks.map((t) => {
          const ts = entry ? taskStatus(carelogs, entry.id, t) : null;
          return (
            <label key={t.id} className={`tasklog-row ${checked[t.id] ? "on" : ""}`}>
              <input type="checkbox" checked={!!checked[t.id]} onChange={() => toggle(t.id)} />
              <div className="tl-main">
                <b>{t.label}</b>
                <span className="tl-meta">
                  <span className={`tasktag tt-${t.taskType}`}>{t.taskType}</span>
                  {FREQUENCY_LABELS[t.frequency]}
                </span>
              </div>
              {ts ? (
                <span className="tl-status">
                  {ts.status === "overdue" ? (
                    <span className="risk high">{ts.daysSince === Infinity ? "never" : `${Math.abs(ts.nextDays)}d overdue`}</span>
                  ) : ts.status === "due" ? (
                    <span className="risk med">due today</span>
                  ) : (
                    <span className="risk low">in {ts.nextDays}d</span>
                  )}
                </span>
              ) : null}
            </label>
          );
        })}

        <label className={`tasklog-row ${noteOn ? "on" : ""}`}>
          <input type="checkbox" checked={noteOn} onChange={() => setNoteOn((v) => !v)} />
          <div className="tl-main">
            <b>Care notes</b>
            <span className="tl-meta">
              <span className="tasktag tt-other">note</span>
              unscheduled
            </span>
          </div>
        </label>
      </div>

      {noteOn ? (
        <div className="field full" style={{ marginTop: 12 }}>
          <label>Care note</label>
          <textarea
            value={noteText}
            autoFocus
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Observation, ad-hoc care, anything off-schedule…"
          />
        </div>
      ) : null}

      <div className="field full" style={{ marginTop: 12 }}>
        <label>
          Colony count recorded <span className="hint">optional — updates colony size</span>
        </label>
        <input type="number" min={0} value={colonyCount} onChange={(e) => setColonyCount(e.target.value)} placeholder="—" />
      </div>
    </ModalShell>
  );
}

/** Returns openLogForm(colId?) — opens the care-log modal (species locked when colId given). */
export function useLogForm() {
  const { open } = useModal();
  return useCallback((colId?: string | null) => open(<LogForm colId={colId ?? null} />), [open]);
}

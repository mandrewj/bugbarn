"use client";

import { useCallback, useState } from "react";
import type { FacilityLog } from "@/lib/types";
import { uuid, nowISO, dateKey, logTimestamp } from "@/lib/format";
import { FREQUENCY_LABELS } from "@/lib/constants";
import { facilityTaskStatus } from "@/lib/care";
import { useData } from "@/components/providers/DataProvider";
import { useModal, ModalShell } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toasts";

function FacilityLogForm() {
  const { close } = useModal();
  const { facility, facilitylogs, saveFacilityLog, lastKeeper, setLastKeeper, keepers } = useData();
  const toast = useToast();
  const today = dateKey(new Date());

  const [date, setDate] = useState(today);
  const [performedBy, setPerformedBy] = useState(lastKeeper);
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [noteOn, setNoteOn] = useState(false);
  const [noteText, setNoteText] = useState("");

  const tasks = facility.tasks;
  const toggle = (id: string) => setChecked((m) => ({ ...m, [id]: !m[id] }));

  function save() {
    if (!performedBy.trim()) {
      toast("Add who performed the check", "err");
      return;
    }
    const chosen = tasks.filter((t) => checked[t.id]);
    const hasTemp = temperature.trim() !== "";
    const hasHum = humidity.trim() !== "";
    const includeNote = noteOn && noteText.trim().length > 0;
    if (chosen.length === 0 && !hasTemp && !hasHum && !includeNote) {
      toast("Record a reading, a task, or a note", "err");
      return;
    }

    const iso = logTimestamp(date);
    const by = performedBy.trim();

    const logs: FacilityLog[] = chosen.map((t) => ({
      id: uuid(),
      date: iso,
      temperature: null,
      humidity: null,
      frequency: t.frequency,
      taskId: t.id,
      taskType: t.taskType,
      taskLabel: t.label,
      performedBy: by,
      notes: "",
      createdAt: nowISO(),
    }));

    // Environment readings (and any note) ride on a single observation log so
    // "latest reading" lookups have one record to find.
    if (hasTemp || hasHum) {
      logs.push({
        id: uuid(),
        date: iso,
        temperature: hasTemp ? Number(temperature) : null,
        humidity: hasHum ? Number(humidity) : null,
        taskType: "observation",
        taskLabel: "Environment reading",
        performedBy: by,
        notes: includeNote ? noteText.trim() : "",
        createdAt: nowISO(),
      });
    } else if (includeNote) {
      logs.push({
        id: uuid(),
        date: iso,
        temperature: null,
        humidity: null,
        taskType: "other",
        taskLabel: "Notes",
        performedBy: by,
        notes: noteText.trim(),
        createdAt: nowISO(),
      });
    }

    logs.forEach((l) => saveFacilityLog(l));
    setLastKeeper(by);
    close();
    toast(`Logged ${logs.length} ${logs.length === 1 ? "entry" : "entries"}`);
  }

  return (
    <ModalShell
      kicker="Facility check"
      title="Log facility check"
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
        <div className="field">
          <label>
            Temperature <span className="hint">°F</span>
          </label>
          <input type="number" value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="—" />
        </div>
        <div className="field">
          <label>
            Humidity <span className="hint">%</span>
          </label>
          <input type="number" value={humidity} onChange={(e) => setHumidity(e.target.value)} placeholder="—" />
        </div>
      </div>

      <div className="sectiontitle" style={{ margin: "10px 0 8px" }}>
        Tasks completed
      </div>
      {tasks.length ? (
        <div className="tasklog">
          {tasks.map((t) => {
            const ts = facilityTaskStatus(facilitylogs, t);
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
                <span className="tl-status">
                  {ts.status === "overdue" ? (
                    <span className="risk high">{ts.daysSince === Infinity ? "never" : `${Math.abs(ts.nextDays)}d overdue`}</span>
                  ) : ts.status === "due" ? (
                    <span className="risk med">due today</span>
                  ) : (
                    <span className="risk low">in {ts.nextDays}d</span>
                  )}
                </span>
              </label>
            );
          })}

          <label className={`tasklog-row ${noteOn ? "on" : ""}`}>
            <input type="checkbox" checked={noteOn} onChange={() => setNoteOn((v) => !v)} />
            <div className="tl-main">
              <b>Note</b>
              <span className="tl-meta">
                <span className="tasktag tt-other">note</span>
                unscheduled
              </span>
            </div>
          </label>
        </div>
      ) : (
        <p className="muted" style={{ margin: "0 0 10px", fontSize: 13 }}>
          No managerial tasks defined yet — add some from the facility page. You can still record readings and a note.
        </p>
      )}

      {(noteOn || !tasks.length) ? (
        <div className="field full" style={{ marginTop: 12 }}>
          <label>
            Note {tasks.length ? "" : <span className="hint">optional</span>}
          </label>
          <textarea
            value={noteText}
            onChange={(e) => {
              setNoteText(e.target.value);
              if (!tasks.length) setNoteOn(true);
            }}
            placeholder="Anything off-schedule — pest sighting, equipment issue, deep clean…"
          />
        </div>
      ) : null}
    </ModalShell>
  );
}

/** Returns openFacilityLogForm() — opens the facility-check modal. */
export function useFacilityLogForm() {
  const { open } = useModal();
  return useCallback(() => open(<FacilityLogForm />), [open]);
}

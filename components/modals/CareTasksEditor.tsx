"use client";

import { useCallback, useState } from "react";
import type { CollectionEntry, CareTask, TaskType, Frequency } from "@/lib/types";
import { uuid } from "@/lib/format";
import { TASK_TYPES, FREQUENCIES, FREQUENCY_LABELS } from "@/lib/constants";
import { getCareTasks } from "@/lib/care";
import { useData } from "@/components/providers/DataProvider";
import { useModal, ModalShell } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toasts";
import { Icon } from "@/components/Icon";

type Row = { id: string; label: string; taskType: TaskType; frequency: Frequency };

function CareTasksEditor({ entry }: { entry: CollectionEntry }) {
  const { close } = useModal();
  const { saveCollection } = useData();
  const toast = useToast();

  const [rows, setRows] = useState<Row[]>(getCareTasks(entry).map((t) => ({ ...t })));

  const update = (id: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));
  const add = () => setRows((rs) => [...rs, { id: uuid(), label: "", taskType: "feeding", frequency: "weekly" }]);

  function save() {
    const careTasks: CareTask[] = rows.map((r) => ({
      id: uuid(),
      label: r.label.trim() || "Task",
      taskType: r.taskType,
      frequency: r.frequency,
    }));
    saveCollection({ ...entry, careTasks });
    close();
    toast("Care tasks updated");
  }

  return (
    <ModalShell
      kicker="Routine care"
      title={`${entry.commonName} — care tasks`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            Save tasks
          </button>
        </>
      }
    >
      <p className="muted" style={{ margin: "0 0 14px" }}>
        Define the recurring care this colony needs. These drive the “due today / overdue” flags on the dashboard and schedule.
      </p>
      <div className="tasklist">
        {rows.map((r) => (
          <div className="taskrow" key={r.id}>
            <input className="tk-label" value={r.label} placeholder="Task name" onChange={(e) => update(r.id, { label: e.target.value })} />
            <select value={r.taskType} onChange={(e) => update(r.id, { taskType: e.target.value as TaskType })}>
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
            <select value={r.frequency} onChange={(e) => update(r.id, { frequency: e.target.value as Frequency })}>
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </option>
              ))}
            </select>
            <button type="button" className="btn-icon" title="Remove" onClick={() => remove(r.id)}>
              <Icon name="trash" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={add}>
        <Icon name="plus" /> Add task
      </button>
    </ModalShell>
  );
}

/** Returns openCareTasksEditor(entry). */
export function useCareTasksEditor() {
  const { open } = useModal();
  return useCallback((entry: CollectionEntry) => open(<CareTasksEditor entry={entry} />), [open]);
}

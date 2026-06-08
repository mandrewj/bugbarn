"use client";

import { useCallback, useState } from "react";
import type { Facility, FacilityTask, TaskType, Frequency } from "@/lib/types";
import { uuid } from "@/lib/format";
import { TASK_TYPES, FREQUENCIES, FREQUENCY_LABELS } from "@/lib/constants";
import { useData } from "@/components/providers/DataProvider";
import { useModal, ModalShell } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toasts";
import { Icon } from "@/components/Icon";

type Row = { id: string; label: string; taskType: TaskType; frequency: Frequency };

function FacilityTasksEditor({ facility }: { facility: Facility }) {
  const { close } = useModal();
  const { saveFacility } = useData();
  const toast = useToast();

  const [rows, setRows] = useState<Row[]>(facility.tasks.map((t) => ({ ...t })));

  const update = (id: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));
  const add = () => setRows((rs) => [...rs, { id: uuid(), label: "", taskType: "cleaning", frequency: "weekly" }]);

  function save() {
    // Preserve each row's id so logs stay linked to their routine across edits.
    const tasks: FacilityTask[] = rows.map((r) => ({
      id: r.id,
      label: r.label.trim() || "Task",
      taskType: r.taskType,
      frequency: r.frequency,
    }));
    saveFacility({ ...facility, tasks });
    close();
    toast("Facility tasks updated");
  }

  return (
    <ModalShell
      kicker="Managerial tasks"
      title="Facility tasks"
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
        Define the recurring managerial &amp; cleaning tasks for the barn itself. These drive the “due today / overdue” flags on the facility page and dashboard.
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

/** Returns openFacilityTasksEditor(facility). */
export function useFacilityTasksEditor() {
  const { open } = useModal();
  return useCallback((facility: Facility) => open(<FacilityTasksEditor facility={facility} />), [open]);
}

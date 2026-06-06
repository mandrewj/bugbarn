"use client";

import { useCallback } from "react";
import { fmtTime } from "@/lib/format";
import { logsByDay } from "@/lib/care";
import { TASK_COLORS } from "@/lib/constants";
import { useData } from "@/components/providers/DataProvider";
import { useModal, ModalShell } from "@/components/ui/Modal";
import { useLogForm } from "@/components/modals/LogForm";
import { Icon } from "@/components/Icon";

function DayModal({ dayKey }: { dayKey: string }) {
  const { close } = useModal();
  const { collections, carelogs } = useData();
  const openLogForm = useLogForm();

  const evts = (logsByDay(carelogs)[dayKey] || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const title = new Date(dayKey + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const nameOf = (id: string) => collections.find((c) => c.id === id)?.commonName ?? "—";

  return (
    <ModalShell
      kicker="Day log"
      title={title}
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>
            Close
          </button>
          <button
            className="btn btn-green"
            onClick={() => {
              close();
              openLogForm(null);
            }}
          >
            <Icon name="plus" /> Log a task
          </button>
        </>
      }
    >
      {evts.length ? (
        <div className="feed">
          {evts.map((e) => (
            <div className="fitem" key={e.id}>
              <span className="fdot" style={{ background: TASK_COLORS[e.taskType], marginTop: 6 }} />
              <div>
                <div className="ft">
                  <span className={`tasktag tt-${e.taskType}`}>{e.taskType}</span> <b>{nameOf(e.collectionId)}</b>
                  {e.colonyCountRecorded != null ? ` · count ${e.colonyCountRecorded}` : ""}
                </div>
                <div className="fw">
                  {fmtTime(e.date)} · {e.performedBy || "—"}
                  {e.notes ? ` · ${e.notes}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">No tasks logged on this day.</p>
      )}
    </ModalShell>
  );
}

/** Returns openDayModal(dateKey). */
export function useDayModal() {
  const { open } = useModal();
  return useCallback((dayKey: string) => open(<DayModal dayKey={dayKey} />), [open]);
}

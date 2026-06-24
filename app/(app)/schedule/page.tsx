"use client";

import { useEffect, useState } from "react";
import { useData } from "@/components/providers/DataProvider";
import { careStatus, logsByDay } from "@/lib/care";
import { dateKey, hexA, shortName } from "@/lib/format";
import { TASK_COLORS } from "@/lib/constants";
import type { TaskType } from "@/lib/types";
import { PageHeader, Splash } from "@/components/ui/bits";
import { Icon } from "@/components/Icon";
import { useLogForm } from "@/components/modals/LogForm";
import { useDayModal } from "@/components/modals/DayModal";

const DOWS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SchedulePage() {
  const { collections, carelogs, loading } = useData();
  const openLogForm = useLogForm();
  const openDayModal = useDayModal();

  const [view, setView] = useState<"calendar" | "weekly">("calendar");
  const [calMonth, setCalMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [weekOffset, setWeekOffset] = useState(0);

  // The weekly agenda reads far better on phones — default to it on small screens.
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width:820px)").matches) {
      setView("weekly");
    }
  }, []);

  if (loading) return <Splash />;

  const map = logsByDay(carelogs);
  const todayKey = dateKey(new Date());
  const nameOf = (id: string) => collections.find((c) => c.id === id);
  const overdue = collections
    .filter((c) => !c.retired)
    .map((c) => ({ c, st: careStatus(carelogs, c) }))
    .filter((o) => o.st.status === "overdue");

  return (
    <>
      <PageHeader
        kicker="Husbandry Calendar"
        title="Care Schedule"
        sub="Every logged task, color-coded by type"
        action={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="segwrap">
              <button className={`seg ${view === "calendar" ? "on" : ""}`} onClick={() => setView("calendar")}>
                Monthly
              </button>
              <button className={`seg ${view === "weekly" ? "on" : ""}`} onClick={() => setView("weekly")}>
                Weekly
              </button>
            </div>
            <button className="btn btn-green" onClick={() => openLogForm(null)}>
              <Icon name="plus" /> Log Care Task
            </button>
          </div>
        }
      />

      {overdue.length ? (
        <div className="alert">
          <Icon name="alert" />
          <div className="at">
            <b>{overdue.length} overdue:</b>
            <span className="names">
              {" "}
              {overdue.map((o) => o.c.commonName + (o.st.daysSince === Infinity ? " (never)" : ` (${o.st.daysSince}d)`)).join(" · ")}
            </span>
          </div>
        </div>
      ) : null}

      {view === "calendar" ? (
        <MonthCalendar
          month={calMonth}
          map={map}
          todayKey={todayKey}
          nameOf={nameOf}
          onPrev={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          onNext={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          onToday={() => setCalMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
          onDay={openDayModal}
        />
      ) : (
        <WeekAgenda
          weekOffset={weekOffset}
          map={map}
          todayKey={todayKey}
          nameOf={nameOf}
          onPrev={() => setWeekOffset((w) => w - 1)}
          onNext={() => setWeekOffset((w) => w + 1)}
          onThis={() => setWeekOffset(0)}
        />
      )}

      <div className="legend">
        {(Object.entries(TASK_COLORS) as [TaskType, string][]).map(([k, v]) => (
          <span key={k}>
            <i style={{ background: v }} />
            {k}
          </span>
        ))}
      </div>
    </>
  );
}

type DayMap = Record<string, import("@/lib/types").CareLog[]>;
type NameOf = (id: string) => import("@/lib/types").CollectionEntry | undefined;

function MonthCalendar({
  month,
  map,
  todayKey,
  nameOf,
  onPrev,
  onNext,
  onToday,
  onDay,
}: {
  month: Date;
  map: DayMap;
  todayKey: string;
  nameOf: NameOf;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onDay: (key: string) => void;
}) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const startDow = new Date(y, m, 1).getDay();
  const daysIn = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();

  const cells: { day: number; dim: boolean; date: Date }[] = [];
  for (let i = 0; i < startDow; i++) {
    const d = prevDays - startDow + 1 + i;
    cells.push({ day: d, dim: true, date: new Date(y, m - 1, d) });
  }
  for (let d = 1; d <= daysIn; d++) cells.push({ day: d, dim: false, date: new Date(y, m, d) });
  while (cells.length % 7 !== 0) {
    const d = cells.length - (startDow + daysIn) + 1;
    cells.push({ day: d, dim: true, date: new Date(y, m + 1, d) });
  }

  return (
    <>
      <div className="cal-nav no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button className="btn btn-ghost btn-sm" onClick={onPrev}>
          <Icon name="chL" />
        </button>
        <div className="mlabel">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
        <button className="btn btn-ghost btn-sm" onClick={onNext}>
          <Icon name="chR" />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onToday} style={{ marginLeft: 8 }}>
          Today
        </button>
      </div>
      <div className="calendar">
        <div className="cal-head">
          {DOWS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="cal-body">
          {cells.map((c, i) => {
            const k = dateKey(c.date);
            const evts = map[k] || [];
            return (
              <div
                key={i}
                className={`cal-cell ${c.dim ? "dim" : ""} ${k === todayKey ? "today" : ""} ${evts.length ? "clickable" : ""}`}
                onClick={evts.length ? () => onDay(k) : undefined}
              >
                <div className="dnum">{c.day}</div>
                {evts.slice(0, 3).map((e) => {
                  const col = nameOf(e.collectionId);
                  return (
                    <div
                      key={e.id}
                      className="cal-evt"
                      style={{ background: hexA(TASK_COLORS[e.taskType], 0.16), color: TASK_COLORS[e.taskType] }}
                    >
                      {shortName(col ? col.commonName : "?")}
                    </div>
                  );
                })}
                {evts.length > 3 ? <div className="cal-more">+{evts.length - 3} more</div> : null}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function WeekAgenda({
  weekOffset,
  map,
  todayKey,
  nameOf,
  onPrev,
  onNext,
  onThis,
}: {
  weekOffset: number;
  map: DayMap;
  todayKey: string;
  nameOf: NameOf;
  onPrev: () => void;
  onNext: () => void;
  onThis: () => void;
}) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() - base.getDay() + weekOffset * 7);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(d);
  }
  const rangeLabel =
    days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " – " +
    days[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <>
      <div className="cal-nav no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button className="btn btn-ghost btn-sm" onClick={onPrev}>
          <Icon name="chL" />
        </button>
        <div className="mlabel mlabel-wide">{rangeLabel}</div>
        <button className="btn btn-ghost btn-sm" onClick={onNext}>
          <Icon name="chR" />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onThis} style={{ marginLeft: 8 }}>
          This week
        </button>
      </div>
      <div className="agenda">
        {days.map((d) => {
          const k = dateKey(d);
          const evts = (map[k] || []).slice().sort((a, b) => a.date.localeCompare(b.date));
          return (
            <div className={`aday ${k === todayKey ? "today" : ""}`} key={k}>
              <div className="aday-h">
                <div className="ad">
                  {d.toLocaleDateString("en-US", { weekday: "long" })}
                  <small>{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</small>
                </div>
                <div className="acount">
                  {evts.length} task{evts.length !== 1 ? "s" : ""}
                </div>
              </div>
              {evts.length ? (
                evts.map((e) => {
                  const c = nameOf(e.collectionId);
                  return (
                    <div className="atask" key={e.id}>
                      <span className="fdot" style={{ background: TASK_COLORS[e.taskType] }} />
                      <span className={`tasktag tt-${e.taskType}`}>{e.taskType}</span>
                      <span className="aname">{c ? c.commonName : "—"}</span>
                      {e.notes ? <span className="muted" style={{ fontSize: 12 }}>{e.notes}</span> : null}
                      <span className="aby">{e.performedBy || ""}</span>
                    </div>
                  );
                })
              ) : (
                <div className="none">No tasks logged.</div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

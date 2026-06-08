"use client";

import { useData } from "@/components/providers/DataProvider";
import { facilityTaskStatus, latestFacilityReading, readingFlag, type ReadingFlag } from "@/lib/care";
import { fmtDate, fmtTime, relTime } from "@/lib/format";
import { FREQUENCY_LABELS } from "@/lib/constants";
import type { Range } from "@/lib/types";
import { PageHeader, EmptyState, Splash } from "@/components/ui/bits";
import { Icon } from "@/components/Icon";
import { useConfirm } from "@/components/ui/Modal";
import { useFacilityForm } from "@/components/modals/FacilityForm";
import { useFacilityTasksEditor } from "@/components/modals/FacilityTasksEditor";
import { useFacilityLogForm } from "@/components/modals/FacilityLogForm";

const FLAG_LABEL: Record<Exclude<ReadingFlag, null>, string> = { ok: "in range", low: "below target", high: "above target" };

function targetText(t: Range | null, unit: string): string {
  return t ? `Target ${t.min}–${t.max}${unit}` : "No target set";
}

function ReadingCard({ label, value, unit, target, flag }: { label: string; value: number | null; unit: string; target: Range | null; flag: ReadingFlag }) {
  const warn = flag === "low" || flag === "high";
  return (
    <div className={`stat ${warn ? "warn" : ""}`}>
      <span className="pin" />
      <div className="n">{value != null ? `${value}${unit}` : "—"}</div>
      <div className="l">
        {label} · {targetText(target, unit)}
        {flag ? (
          <span className={`risk ${warn ? "high" : "low"}`} style={{ marginLeft: 8 }}>
            {FLAG_LABEL[flag]}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function FacilityPage() {
  const { facility, facilitylogs, loading, deleteFacilityLog } = useData();
  const openFacilityForm = useFacilityForm();
  const openTasksEditor = useFacilityTasksEditor();
  const openLogForm = useFacilityLogForm();
  const confirm = useConfirm();

  if (loading) return <Splash />;

  const latest = latestFacilityReading(facilitylogs);
  const tempFlag = readingFlag(latest?.temperature ?? null, facility.tempTarget);
  const humFlag = readingFlag(latest?.humidity ?? null, facility.humidityTarget);
  const tasks = facility.tasks;
  const logs = facilitylogs.slice().sort((a, b) => b.date.localeCompare(a.date));
  const outOfRange = tempFlag === "low" || tempFlag === "high" || humFlag === "low" || humFlag === "high";

  return (
    <>
      <PageHeader
        kicker="Facility Monitoring"
        title={facility.name || "Bug Barn Facility"}
        sub={latest ? `Last reading ${relTime(latest.date)}` : "No readings logged yet"}
        action={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn btn-ghost" onClick={() => openFacilityForm(facility)}>
              <Icon name="edit" /> Edit
            </button>
            <button className="btn btn-green" onClick={() => openLogForm()}>
              <Icon name="plus" /> Log Facility Check
            </button>
          </div>
        }
      />

      {outOfRange ? (
        <div className="alert">
          <Icon name="alert" />
          <div className="at">
            <b>Environment outside target range.</b>{" "}
            <span className="names">
              {tempFlag && tempFlag !== "ok" ? `Temperature ${FLAG_LABEL[tempFlag]}. ` : ""}
              {humFlag && humFlag !== "ok" ? `Humidity ${FLAG_LABEL[humFlag]}.` : ""}
            </span>
          </div>
        </div>
      ) : null}

      <div className="stats" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
        <ReadingCard label="Temperature" value={latest?.temperature ?? null} unit="°F" target={facility.tempTarget} flag={tempFlag} />
        <ReadingCard label="Humidity" value={latest?.humidity ?? null} unit="%" target={facility.humidityTarget} flag={humFlag} />
      </div>

      {facility.notes ? (
        <div className="panel" style={{ padding: "14px 18px", marginTop: 16 }}>
          <div className="panel-t" style={{ marginBottom: 6 }}>Facility notes</div>
          <p className="muted" style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 13.5 }}>
            {facility.notes}
          </p>
        </div>
      ) : null}

      <div className="sectiontitle" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 6, height: 18, background: "var(--amber)", borderRadius: 2, display: "block" }} />
          Managerial tasks
        </span>
        <button className="btn btn-ghost btn-sm" onClick={() => openTasksEditor(facility)}>
          <Icon name="edit" /> Manage tasks
        </button>
      </div>
      {tasks.length ? (
        <div className="panel" style={{ padding: "6px 16px" }}>
          <div className="tblwrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Type</th>
                  <th>Every</th>
                  <th>Last done</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const ts = facilityTaskStatus(facilitylogs, t);
                  return (
                    <tr key={t.id}>
                      <td>
                        <b>{t.label}</b>
                      </td>
                      <td>
                        <span className={`tasktag tt-${t.taskType}`}>{t.taskType}</span>
                      </td>
                      <td>{FREQUENCY_LABELS[t.frequency]}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{ts.last ? fmtDate(ts.last, { month: "short", day: "numeric" }) : "—"}</td>
                      <td>
                        {ts.status === "overdue" ? (
                          <span className="risk high">{ts.daysSince === Infinity ? "never" : `${Math.abs(ts.nextDays)}d overdue`}</span>
                        ) : ts.status === "due" ? (
                          <span className="risk med">due today</span>
                        ) : (
                          <span className="risk low">in {ts.nextDays}d</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="muted" style={{ padding: "6px 2px" }}>
          No managerial tasks defined yet.
        </div>
      )}

      <div className="sectiontitle">Check log</div>
      {logs.length ? (
        <div className="panel" style={{ padding: "6px 14px" }}>
          <div className="tblwrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Entry</th>
                  <th>Temp</th>
                  <th>Humidity</th>
                  <th>By</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {fmtDate(l.date, { month: "short", day: "numeric" })}
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink3)" }}>{fmtTime(l.date)}</div>
                    </td>
                    <td>
                      {l.taskLabel ? <div style={{ fontWeight: 700, marginBottom: 3 }}>{l.taskLabel}</div> : null}
                      <span className={`tasktag tt-${l.taskType}`}>{l.taskType}</span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{l.temperature != null ? `${l.temperature}°F` : "—"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{l.humidity != null ? `${l.humidity}%` : "—"}</td>
                    <td>{l.performedBy || "—"}</td>
                    <td style={{ maxWidth: 220 }}>{l.notes || "—"}</td>
                    <td>
                      <button
                        className="btn-icon"
                        title="Delete entry"
                        onClick={() =>
                          confirm({
                            title: "Delete this log entry?",
                            message: "This permanently removes the facility check entry.",
                            confirmLabel: "Delete",
                            onConfirm: () => deleteFacilityLog(l.id),
                          })
                        }
                      >
                        <Icon name="trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState icon="home" title="No facility checks logged">
          Log your first check to start tracking temperature, humidity, and managerial tasks.
        </EmptyState>
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Frequency } from "@/lib/types";
import { useData } from "@/components/providers/DataProvider";
import { careStatus, getCareTasks, riskOf, sopForCollection, taskStatus, logsForCollection } from "@/lib/care";
import { fmtDate, fmtTime } from "@/lib/format";
import { SOP_SECTIONS, FREQUENCY_LABELS } from "@/lib/constants";
import { Splash, RiskBadge } from "@/components/ui/bits";
import { Icon } from "@/components/Icon";
import { LocationCard } from "@/components/LocationCard";
import { useEntryForm } from "@/components/modals/EntryForm";
import { useLogForm } from "@/components/modals/LogForm";
import { useSopEditor } from "@/components/modals/SopEditor";
import { useExhibitForm } from "@/components/modals/ExhibitForm";
import { useCareTasksEditor } from "@/components/modals/CareTasksEditor";
import { useDuplicateEntry } from "@/components/modals/duplicate";
import { usePrintSop } from "@/components/SopPrint";
import { useConfirm } from "@/components/ui/Modal";

const LOG_FILTERS: ("all" | Frequency)[] = ["all", "daily", "every-other-day", "weekly", "monthly"];

function Spec({ k, v, full }: { k: string; v: React.ReactNode; full?: boolean }) {
  return (
    <div className={`sp ${full ? "full" : ""}`}>
      <div className="k">{k}</div>
      <div className="v">{v || "—"}</div>
    </div>
  );
}

export default function DetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const router = useRouter();
  const { collections, sops, carelogs, loading, deleteCollection, deleteLog } = useData();

  const openEntryForm = useEntryForm();
  const openLogForm = useLogForm();
  const openSopEditor = useSopEditor();
  const openExhibitForm = useExhibitForm();
  const openCareTasksEditor = useCareTasksEditor();
  const duplicate = useDuplicateEntry();
  const printSop = usePrintSop();
  const confirm = useConfirm();

  const [logFilter, setLogFilter] = useState<"all" | Frequency>("all");

  const entry = collections.find((c) => c.id === id);

  useEffect(() => {
    if (!loading && !entry) router.replace("/collections");
  }, [loading, entry, router]);

  if (loading) return <Splash />;
  if (!entry) return <Splash />;

  const sop = sopForCollection(sops, id);
  const allLogs = logsForCollection(carelogs, id);
  const logs = allLogs.filter((l) => logFilter === "all" || l.frequency === logFilter);
  const st = careStatus(carelogs, entry);
  const tasks = getCareTasks(entry);

  return (
    <>
      <button className="backlink" onClick={() => router.push("/collections")}>
        <Icon name="back" /> All species
      </button>

      <div className="phead" style={{ marginBottom: 18 }}>
        <div>
          <p className="kicker">
            {entry.enclosureType || "Collection"}
            {entry.enclosureLabel ? ` · ${entry.enclosureLabel}` : ""} · added {fmtDate(entry.dateAdded)}
          </p>
          <h1 className="ptitle">{entry.commonName}</h1>
          <p className="sci" style={{ fontSize: 16, marginTop: 4 }}>
            {entry.scientificName}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => duplicate(entry)}>
            <Icon name="copy" /> Duplicate
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => openEntryForm(entry)}>
            <Icon name="edit" /> Edit
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() =>
              confirm({
                title: `Delete ${entry.commonName}?`,
                message: `This permanently removes the species, its SOP, and all ${allLogs.length} care log entries. This cannot be undone.`,
                confirmLabel: "Delete",
                onConfirm: () => {
                  deleteCollection(entry.id);
                  router.push("/collections");
                },
              })
            }
          >
            <Icon name="trash" /> Delete
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <div className="detail-photo">
            <div className="imgwrap">
              {entry.photo ? (
                <img src={entry.photo} alt="" />
              ) : (
                <div
                  className="ph"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "flex-end",
                    backgroundColor: "#ddd3bd",
                    backgroundImage: "repeating-linear-gradient(45deg,rgba(0,0,0,.05) 0 8px,transparent 8px 16px)",
                  }}
                >
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "rgba(59,32,7,.5)", padding: "9px 11px" }}>
                    no photo — add via Edit
                  </span>
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <RiskBadge risk={riskOf(sops, entry.id)} />
            {st.status === "overdue" ? (
              <span className="risk high">care overdue</span>
            ) : st.status === "due" ? (
              <span className="risk med">due today</span>
            ) : (
              <span className="risk low">on schedule</span>
            )}
          </div>
          <LocationCard entry={entry} onToggle={() => openExhibitForm(entry)} />
          <button
            className="btn btn-green btn-sm"
            onClick={() => openLogForm(entry.id)}
            style={{ marginTop: 14, width: "100%", justifyContent: "center" }}
          >
            <Icon name="plus" /> Log Care Task
          </button>
        </div>

        <div>
          <div className="specs">
            <Spec k="Colony size" v={`${entry.colonySize || 0} individuals`} />
            <Spec
              k="Life stages present"
              v={
                entry.lifeStages && entry.lifeStages.length ? (
                  <div className="stages">
                    {entry.lifeStages.map((s) => (
                      <span className="stagepill" key={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  "—"
                )
              }
            />
            <Spec k="Enclosure" v={entry.enclosureType} />
            <Spec k="Enclosure size" v={entry.enclosureSize} />
            <Spec k="Substrate" v={entry.substrate} />
            <Spec k="Temperature" v={entry.temperature} />
            <Spec k="Humidity" v={entry.humidity} />
            <Spec k="Diet" v={entry.diet} />
            <Spec k="Feeding frequency" v={entry.feedingFrequency} />
            {entry.notes ? <Spec k="Notes" v={entry.notes} full /> : null}
          </div>

          <div className="sectiontitle" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 6, height: 18, background: "var(--amber)", borderRadius: 2, display: "block" }} />
              Routine care tasks
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => openCareTasksEditor(entry)}>
              <Icon name="edit" /> Manage tasks
            </button>
          </div>
          {tasks.length ? (
            <div className="panel" style={{ padding: "6px 16px" }}>
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
                    const ts = taskStatus(carelogs, entry.id, t);
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
          ) : (
            <div className="muted" style={{ padding: "6px 2px" }}>
              No routine tasks defined yet.
            </div>
          )}

          <div className="sectiontitle">Standard Operating Procedure</div>
          {sop ? (
            <div className="sopbox">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`risk ${sop.biteStingRisk}`}>{sop.biteStingRisk === "medium" ? "med" : sop.biteStingRisk} bite/sting risk</span>
                  {sop.ppeRequired ? <span className="chip">PPE: {sop.ppeRequired}</span> : null}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => printSop(entry, sop)}>
                    <Icon name="print" /> Print / PDF
                  </button>
                  <button className="btn btn-green btn-sm" onClick={() => openSopEditor(entry.id)}>
                    <Icon name="edit" /> View / Edit SOP
                  </button>
                </div>
              </div>
              {SOP_SECTIONS.filter(({ key }) => sop[key]).map(({ label, key }) => (
                <div className="sop-sec" key={key}>
                  <div className="sk">{label}</div>
                  <div className="sv">{String(sop[key])}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sopbox empty-sop">
              <p className="muted" style={{ margin: "0 0 12px" }}>
                No care SOP exists for this species yet. Generate one pre-filled from this entry.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => openSopEditor(entry.id)}>
                <Icon name="sop" /> Generate SOP from Template
              </button>
            </div>
          )}

          <div className="sectiontitle" style={{ justifyContent: "space-between", display: "flex" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 6, height: 18, background: "var(--amber)", borderRadius: 2, display: "block" }} />
              Care Log
            </span>
          </div>
          <div className="toolbar" style={{ marginBottom: 12 }}>
            <div className="filterpills">
              {LOG_FILTERS.map((f) => (
                <button key={f} className={`fpill ${logFilter === f ? "on" : ""}`} onClick={() => setLogFilter(f)}>
                  {f === "all" ? "All" : FREQUENCY_LABELS[f]}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink3)" }}>
              {allLogs.length} total entries
            </div>
          </div>
          {logs.length ? (
            <div className="panel" style={{ padding: "6px 14px" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Task</th>
                    <th>Freq</th>
                    <th>By</th>
                    <th>Count</th>
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
                        <span className={`tasktag tt-${l.taskType}`}>{l.taskType}</span>
                      </td>
                      <td>{FREQUENCY_LABELS[l.frequency]}</td>
                      <td>{l.performedBy || "—"}</td>
                      <td>{l.colonyCountRecorded != null ? l.colonyCountRecorded : "—"}</td>
                      <td style={{ maxWidth: 220 }}>{l.notes || "—"}</td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Delete entry"
                          onClick={() =>
                            confirm({
                              title: "Delete this log entry?",
                              message: "This care log line will be removed.",
                              confirmLabel: "Delete",
                              onConfirm: () => deleteLog(l.id),
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
          ) : (
            <div className="muted" style={{ padding: "14px 2px" }}>
              No care tasks logged{logFilter !== "all" ? " for this frequency" : ""} yet.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

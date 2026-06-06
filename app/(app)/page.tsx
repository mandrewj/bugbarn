"use client";

import Link from "next/link";
import { useData } from "@/components/providers/DataProvider";
import { computeStats, careStatus, exhibitOf } from "@/lib/care";
import { greeting, relTime } from "@/lib/format";
import { ACTIVITY_VERB, TASK_COLORS } from "@/lib/constants";
import { PageHeader, Splash } from "@/components/ui/bits";
import { SpeciesRow } from "@/components/SpeciesRow";
import { Icon } from "@/components/Icon";
import { useEntryForm } from "@/components/modals/EntryForm";

export default function DashboardPage() {
  const { collections, carelogs, loading } = useData();
  const openEntryForm = useEntryForm();

  if (loading) return <Splash />;

  const s = computeStats(collections, carelogs);
  const attention = collections
    .map((c) => ({ c, st: careStatus(carelogs, c) }))
    .filter((o) => o.st.status !== "ok")
    .sort((a, b) => a.st.nextDays - b.st.nextDays)
    .slice(0, 4);
  const recent = carelogs.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const nameOf = (id: string) => collections.find((c) => c.id === id);

  return (
    <>
      <PageHeader
        kicker="Daily Logbook"
        title={`Good ${greeting()}, keeper.`}
        sub={`${today} · ${collections.length} species under care${s.onExhibit ? ` · ${s.onExhibit} on exhibit` : ""}`}
        action={
          <button className="btn btn-primary" onClick={() => openEntryForm()}>
            <Icon name="plus" /> Add New Species
          </button>
        }
      />

      {s.exhibitOverdue.length ? (
        <div className="alert">
          <Icon name="alert" />
          <div className="at">
            <b>
              {s.exhibitOverdue.length} exhibit {s.exhibitOverdue.length === 1 ? "loan is" : "loans are"} past due for return.
            </b>{" "}
            <span className="names">
              {s.exhibitOverdue
                .map((c) => c.commonName + (exhibitOf(c).custodian ? ` · ${exhibitOf(c).custodian}` : ""))
                .join(" · ")}
            </span>
          </div>
        </div>
      ) : null}
      {s.stale.length ? (
        <div className="alert">
          <Icon name="alert" />
          <div className="at">
            <b>
              {s.stale.length} {s.stale.length === 1 ? "species has" : "species have"} no care logged in 7+ days.
            </b>{" "}
            <span className="names"> {s.stale.map((c) => c.commonName).join(" · ")}</span>
          </div>
        </div>
      ) : null}

      <div className="stats">
        <div className="stat">
          <span className="pin" />
          <div className="n">{s.species}</div>
          <div className="l">Species housed</div>
        </div>
        <div className="stat">
          <span className="pin" />
          <div className="n">{s.individuals.toLocaleString()}</div>
          <div className="l">Individuals across colonies</div>
        </div>
        <div className="stat amber">
          <span className="pin" />
          <div className="n">{s.due}</div>
          <div className="l">Care tasks due today</div>
        </div>
        <div className={`stat ${s.overdue ? "warn" : ""}`}>
          <span className="pin" />
          <div className="n">{s.overdue}</div>
          <div className="l">Overdue {s.overdue ? "· check soon" : ""}</div>
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <div className="panel-h">
            <div className="panel-t">Needs attention</div>
            <Link className="link" href="/schedule">
              Care schedule →
            </Link>
          </div>
          {attention.length ? (
            attention.map((o) => <SpeciesRow key={o.c.id} c={o.c} />)
          ) : (
            <div style={{ padding: "18px 4px", color: "var(--ink2)", fontSize: 14 }}>
              🌿 All colonies are on schedule. Nicely done.
            </div>
          )}
        </div>
        <div className="panel">
          <div className="panel-h">
            <div className="panel-t">Recent activity</div>
          </div>
          <div className="feed">
            {recent.length ? (
              recent.map((l) => {
                const c = nameOf(l.collectionId);
                if (!c) return null;
                return (
                  <div className="fitem" key={l.id}>
                    <span className="fdot" style={{ background: TASK_COLORS[l.taskType] }} />
                    <div>
                      <div className="ft">
                        <b>{ACTIVITY_VERB[l.taskType]}</b> {c.commonName}
                        {l.notes ? ` — ${l.notes}` : ""}
                      </div>
                      <div className="fw">
                        {relTime(l.date)} · {l.performedBy || "—"}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="muted" style={{ padding: "10px 0" }}>
                No activity logged yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

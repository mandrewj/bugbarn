"use client";

import Link from "next/link";
import { useData } from "@/components/providers/DataProvider";
import { computeStats, careStatus, exhibitOf, facilityRollup } from "@/lib/care";
import { greeting, relTime } from "@/lib/format";
import { ACTIVITY_VERB, TASK_COLORS } from "@/lib/constants";
import { PageHeader, Splash } from "@/components/ui/bits";
import { SpeciesRow } from "@/components/SpeciesRow";
import { Icon } from "@/components/Icon";
import { useEntryForm } from "@/components/modals/EntryForm";
import { useLogForm } from "@/components/modals/LogForm";
import { useFacilityLogForm } from "@/components/modals/FacilityLogForm";

export default function DashboardPage() {
  const { collections, carelogs, facility, facilitylogs, loading } = useData();
  const openEntryForm = useEntryForm();
  const openLogForm = useLogForm();
  const openFacilityLog = useFacilityLogForm();

  if (loading) return <Splash />;

  const s = computeStats(collections, carelogs);
  const fac = facilityRollup(facility, facilitylogs);
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

      <div className="quickactions">
        <button className="qaction" onClick={() => openLogForm(null)}>
          <span className="qa-ico qa-green">
            <Icon name="leaf" />
          </span>
          <span className="qa-text">
            <b>Log Care Task</b>
            <small>Record feeding, cleaning, census &amp; more</small>
          </span>
          <Icon name="chR" className="qa-arrow" />
        </button>
        <button className="qaction" onClick={() => openFacilityLog()}>
          <span className="qa-ico qa-amber">
            <Icon name="home" />
          </span>
          <span className="qa-text">
            <b>Log Facility Check</b>
            <small>Temperature, humidity &amp; barn tasks</small>
          </span>
          <Icon name="chR" className="qa-arrow" />
        </button>
      </div>

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

      <Link href="/facility" className={`facility-summary ${fac.tempFlag === "low" || fac.tempFlag === "high" || fac.humidityFlag === "low" || fac.humidityFlag === "high" ? "warn" : ""}`}>
        <span className="fs-ico">
          <Icon name="home" />
        </span>
        <div className="fs-main">
          <b>{facility.name || "Bug Barn"} facility</b>
          <span className="fs-readings">
            <span className={fac.tempFlag === "low" || fac.tempFlag === "high" ? "out" : ""}>
              {fac.latest?.temperature != null ? `${fac.latest.temperature}°F` : "— °F"}
            </span>
            <span className={fac.humidityFlag === "low" || fac.humidityFlag === "high" ? "out" : ""}>
              {fac.latest?.humidity != null ? `${fac.latest.humidity}%` : "— %"}
            </span>
            <small>{fac.latest ? `updated ${relTime(fac.latest.date)}` : "no readings yet"}</small>
          </span>
        </div>
        <div className="fs-tasks">
          {fac.overdueCount ? <span className="risk high">{fac.overdueCount} overdue</span> : null}
          {fac.dueCount ? <span className="risk med">{fac.dueCount} due</span> : null}
          {!fac.overdueCount && !fac.dueCount ? <span className="risk low">tasks on track</span> : null}
          <Icon name="chR" className="qa-arrow" />
        </div>
      </Link>

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

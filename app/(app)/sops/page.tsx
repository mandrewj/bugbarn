"use client";

import { useData } from "@/components/providers/DataProvider";
import { sopForCollection } from "@/lib/care";
import { PageHeader, EmptyState, Splash } from "@/components/ui/bits";
import { Icon } from "@/components/Icon";
import { useSopEditor } from "@/components/modals/SopEditor";
import { usePrintSop } from "@/components/SopPrint";

export default function SopsPage() {
  const { collections, sops, loading } = useData();
  const openSopEditor = useSopEditor();
  const printSop = usePrintSop();

  if (loading) return <Splash />;

  const withSop = collections.filter((c) => sopForCollection(sops, c.id));
  const without = collections.filter((c) => !sopForCollection(sops, c.id));

  return (
    <>
      <PageHeader kicker="Husbandry Protocols" title="SOP Library" sub={`${withSop.length} of ${collections.length} species documented`} />

      {withSop.length ? (
        <div className="cardgrid">
          {withSop.map((c) => {
            const s = sopForCollection(sops, c.id)!;
            return (
              <div className="scard" key={c.id} style={{ cursor: "default" }}>
                <div className="bd" style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <h4>{c.commonName}</h4>
                    <span className={`risk ${s.biteStingRisk}`}>{s.biteStingRisk === "medium" ? "med" : s.biteStingRisk}</span>
                  </div>
                  <div className="sci">{c.scientificName}</div>
                  <p
                    className="muted"
                    style={{
                      fontSize: 12.5,
                      margin: "4px 0 14px",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {s.biologyOverview || s.housingEnvironment || "No overview yet."}
                  </p>
                  <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => printSop(c, s)}>
                      <Icon name="print" /> PDF
                    </button>
                    <button className="btn btn-green btn-sm" onClick={() => openSopEditor(c.id)}>
                      <Icon name="edit" /> Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon="sop" title="No SOPs yet">
          Open a species and generate its first care SOP.
        </EmptyState>
      )}

      {without.length ? (
        <>
          <div className="sectiontitle">Awaiting an SOP</div>
          <div className="cardgrid">
            {without.map((c) => (
              <div className="scard" key={c.id} style={{ cursor: "default" }}>
                <div className="bd" style={{ padding: "16px 18px" }}>
                  <h4>{c.commonName}</h4>
                  <div className="sci">{c.scientificName}</div>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => openSopEditor(c.id)}>
                    <Icon name="plus" /> Generate SOP
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}

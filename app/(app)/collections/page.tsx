"use client";

import { useMemo, useState } from "react";
import { useData } from "@/components/providers/DataProvider";
import { STAGES } from "@/lib/constants";
import { PageHeader, EmptyState, Splash } from "@/components/ui/bits";
import { SpeciesCard } from "@/components/SpeciesCard";
import { Icon } from "@/components/Icon";
import { useEntryForm } from "@/components/modals/EntryForm";

export default function CollectionsPage() {
  const { collections, loading } = useData();
  const openEntryForm = useEntryForm();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return collections
      .filter((c) => {
        const matchQ = !q || c.commonName.toLowerCase().includes(q) || c.scientificName.toLowerCase().includes(q);
        const matchF = filter === "all" || (c.lifeStages || []).includes(filter as never);
        return matchQ && matchF;
      })
      .sort((a, b) => a.commonName.localeCompare(b.commonName));
  }, [collections, search, filter]);

  if (loading) return <Splash />;

  const individuals = collections.reduce((s, c) => s + (Number(c.colonySize) || 0), 0);

  return (
    <>
      <PageHeader
        kicker="The Living Collection"
        title="All Species"
        sub={`${collections.length} species · ${individuals.toLocaleString()} individuals`}
        action={
          <button className="btn btn-primary" onClick={() => openEntryForm()}>
            <Icon name="plus" /> Add New Species
          </button>
        }
      />

      <div className="toolbar">
        <div className="search">
          <Icon name="search" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search common or scientific name…" />
        </div>
        <div className="filterpills">
          <button className={`fpill ${filter === "all" ? "on" : ""}`} onClick={() => setFilter("all")}>
            All stages
          </button>
          {STAGES.map((s) => (
            <button key={s} className={`fpill ${filter === s ? "on" : ""}`} onClick={() => setFilter(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <div className="cardgrid">
          {filtered.map((c) => (
            <SpeciesCard key={c.id} c={c} />
          ))}
        </div>
      ) : (
        <EmptyState icon="bug" title={collections.length ? "No matches" : "No species yet"}>
          {collections.length ? "Try a different search or filter." : "Add your first living collection entry to get started."}
        </EmptyState>
      )}
    </>
  );
}

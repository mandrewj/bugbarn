"use client";

import { useCallback, useState } from "react";
import type { Facility, Range } from "@/lib/types";
import { useData } from "@/components/providers/DataProvider";
import { useModal, ModalShell } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toasts";

/** Build a Range from two text inputs; null unless both parse to numbers. */
function toRange(min: string, max: string): Range | null {
  if (min.trim() === "" || max.trim() === "") return null;
  const lo = Number(min);
  const hi = Number(max);
  if (Number.isNaN(lo) || Number.isNaN(hi)) return null;
  return { min: Math.min(lo, hi), max: Math.max(lo, hi) };
}

const numOrEmpty = (n: number | null | undefined) => (n == null ? "" : String(n));

function FacilityForm({ facility }: { facility: Facility }) {
  const { close } = useModal();
  const { saveFacility } = useData();
  const toast = useToast();

  const [name, setName] = useState(facility.name || "Bug Barn");
  const [tempMin, setTempMin] = useState(numOrEmpty(facility.tempTarget?.min));
  const [tempMax, setTempMax] = useState(numOrEmpty(facility.tempTarget?.max));
  const [humMin, setHumMin] = useState(numOrEmpty(facility.humidityTarget?.min));
  const [humMax, setHumMax] = useState(numOrEmpty(facility.humidityTarget?.max));
  const [notes, setNotes] = useState(facility.notes || "");

  function save() {
    saveFacility({
      ...facility,
      name: name.trim() || "Bug Barn",
      tempTarget: toRange(tempMin, tempMax),
      humidityTarget: toRange(humMin, humMax),
      notes: notes.trim(),
    });
    close();
    toast("Facility settings saved");
  }

  return (
    <ModalShell
      kicker="Facility"
      title="Edit facility settings"
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            Save settings
          </button>
        </>
      }
    >
      <div className="formgrid">
        <div className="field full">
          <label>Facility name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bug Barn" />
        </div>
        <div className="field">
          <label>
            Target temperature <span className="hint">°F, low</span>
          </label>
          <input type="number" value={tempMin} onChange={(e) => setTempMin(e.target.value)} placeholder="—" />
        </div>
        <div className="field">
          <label>
            Target temperature <span className="hint">°F, high</span>
          </label>
          <input type="number" value={tempMax} onChange={(e) => setTempMax(e.target.value)} placeholder="—" />
        </div>
        <div className="field">
          <label>
            Target humidity <span className="hint">%, low</span>
          </label>
          <input type="number" value={humMin} onChange={(e) => setHumMin(e.target.value)} placeholder="—" />
        </div>
        <div className="field">
          <label>
            Target humidity <span className="hint">%, high</span>
          </label>
          <input type="number" value={humMax} onChange={(e) => setHumMax(e.target.value)} placeholder="—" />
        </div>
        <div className="field full">
          <label>
            Notes <span className="hint">optional</span>
          </label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="HVAC quirks, sensor locations, anything worth noting…" />
        </div>
      </div>
    </ModalShell>
  );
}

/** Returns openFacilityForm(facility). */
export function useFacilityForm() {
  const { open } = useModal();
  return useCallback((facility: Facility) => open(<FacilityForm facility={facility} />), [open]);
}

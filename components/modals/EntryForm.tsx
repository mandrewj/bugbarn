"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CollectionEntry, LifeStage } from "@/lib/types";
import { uuid, nowISO } from "@/lib/format";
import { ENCLOSURES, STAGES } from "@/lib/constants";
import { uploadPhoto } from "@/lib/image";
import { useData } from "@/components/providers/DataProvider";
import { useModal, ModalShell } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toasts";
import { useConfirm } from "@/components/ui/Modal";
import { useSopEditor } from "@/components/modals/SopEditor";
import { Icon } from "@/components/Icon";

type FormState = {
  commonName: string;
  scientificName: string;
  dateAdded: string;
  colonySize: string;
  lifeStages: LifeStage[];
  enclosureType: string;
  enclosureSize: string;
  enclosureLabel: string;
  substrate: string;
  temperature: string;
  humidity: string;
  feedingFrequency: string;
  diet: string;
  notes: string;
};

function toDateInput(iso?: string): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function EntryForm({ existing }: { existing?: CollectionEntry }) {
  const { close } = useModal();
  const { saveCollection } = useData();
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const openSopEditor = useSopEditor();
  const fileInput = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<string | null>(existing?.photo ?? null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ commonName?: boolean; scientificName?: boolean }>({});

  const [form, setForm] = useState<FormState>({
    commonName: existing?.commonName ?? "",
    scientificName: existing?.scientificName ?? "",
    dateAdded: toDateInput(existing?.dateAdded),
    colonySize: existing?.colonySize != null ? String(existing.colonySize) : "",
    lifeStages: existing?.lifeStages ?? [],
    enclosureType: existing?.enclosureType ?? "",
    enclosureSize: existing?.enclosureSize ?? "",
    enclosureLabel: existing?.enclosureLabel ?? "",
    substrate: existing?.substrate ?? "",
    temperature: existing?.temperature ?? "",
    humidity: existing?.humidity ?? "",
    feedingFrequency: existing?.feedingFrequency ?? "",
    diet: existing?.diet ?? "",
    notes: existing?.notes ?? "",
  });

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleStage = (s: LifeStage) =>
    setForm((f) => ({ ...f, lifeStages: f.lifeStages.includes(s) ? f.lifeStages.filter((x) => x !== s) : [...f.lifeStages, s] }));

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setUploading(true);
      try {
        setPhoto(await uploadPhoto(file));
      } catch {
        toast("Could not read image", "err");
      } finally {
        setUploading(false);
      }
    },
    [toast],
  );

  function save() {
    const nextErrors = { commonName: !form.commonName.trim(), scientificName: !form.scientificName.trim() };
    setErrors(nextErrors);
    if (nextErrors.commonName || nextErrors.scientificName) {
      toast("Fill in the required fields", "err");
      return;
    }
    const isNew = !existing;
    const entry: CollectionEntry = {
      ...(existing ?? {
        exhibit: { onExhibit: false, sentOut: null, dueBack: null, custodian: "" },
        careTasks: [],
        createdAt: nowISO(),
      }),
      id: existing?.id ?? uuid(),
      commonName: form.commonName.trim(),
      scientificName: form.scientificName.trim(),
      dateAdded: form.dateAdded ? new Date(form.dateAdded).toISOString() : nowISO(),
      colonySize: Number(form.colonySize) || 0,
      lifeStages: form.lifeStages,
      enclosureType: form.enclosureType.trim(),
      enclosureSize: form.enclosureSize.trim(),
      enclosureLabel: form.enclosureLabel.trim(),
      substrate: form.substrate.trim(),
      temperature: form.temperature.trim(),
      humidity: form.humidity.trim(),
      diet: form.diet.trim(),
      feedingFrequency: form.feedingFrequency.trim(),
      notes: form.notes.trim(),
      photo,
      sopId: existing?.sopId ?? null,
      updatedAt: nowISO(),
    } as CollectionEntry;

    const saved = saveCollection(entry);
    close();
    if (!isNew) {
      toast(`${saved.commonName} updated`);
      return;
    }
    toast(`${saved.commonName} added to the collection`);
    confirm({
      title: "Create a care SOP now?",
      message: `Would you like to generate a Standard Operating Procedure for ${saved.commonName}? It will be pre-filled from this entry.`,
      confirmLabel: "Generate SOP",
      cancelLabel: "Not now",
      onConfirm: () => openSopEditor(saved.id),
      onCancel: () => router.push(`/collections/${saved.id}`),
    });
  }

  return (
    <ModalShell
      kicker={existing ? "Edit entry" : "New entry"}
      title={existing ? `Edit ${existing.commonName}` : "Add a species"}
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={uploading}>
            {existing ? "Save changes" : "Add species"}
          </button>
        </>
      }
    >
      <div className="formgrid">
        <div
          className={`dropzone ${drag ? "drag" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDrag(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            handleFile(e.dataTransfer.files[0]);
          }}
        >
          <div className="dzprev">{photo ? <img src={photo} alt="" /> : <Icon name="img" />}</div>
          <div className="dztext">
            <b>Specimen photo</b>
            <br />
            {uploading ? "Uploading…" : "Drag & drop an image here, or browse. Stored with the entry & in your backup."}
            <div className="dzbtns">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInput.current?.click()}>
                <Icon name="up" /> Choose file
              </button>
              {photo ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPhoto(null)}>
                  Remove
                </button>
              ) : null}
            </div>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hide"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        <div className={`field full ${errors.commonName ? "err" : ""}`}>
          <label>
            Common name <span className="req">*</span>
          </label>
          <input value={form.commonName} onChange={set("commonName")} placeholder="e.g. Madagascar Hissing Cockroach" />
          {errors.commonName ? <div className="errmsg">Required</div> : null}
        </div>
        <div className={`field full ${errors.scientificName ? "err" : ""}`}>
          <label>
            Scientific name <span className="req">*</span>
          </label>
          <input className="sciinput" value={form.scientificName} onChange={set("scientificName")} placeholder="Genus species" />
          {errors.scientificName ? <div className="errmsg">Required</div> : null}
        </div>

        <div className="field">
          <label>Date added / acquired</label>
          <input type="date" value={form.dateAdded} onChange={set("dateAdded")} />
        </div>
        <div className="field">
          <label>Colony size</label>
          <input type="number" min={0} value={form.colonySize} onChange={set("colonySize")} placeholder="0" />
        </div>

        <div className="field full">
          <label>Life stages present</label>
          <div className="checkrow">
            {STAGES.map((s) => (
              <label key={s} className={`checkpill ${form.lifeStages.includes(s) ? "on" : ""}`}>
                <input type="checkbox" checked={form.lifeStages.includes(s)} onChange={() => toggleStage(s)} />
                {s}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Enclosure type</label>
          <input list="enclList" value={form.enclosureType} onChange={set("enclosureType")} placeholder="Terrarium, deli cup, custom…" />
          <datalist id="enclList">
            {ENCLOSURES.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label>Enclosure size</label>
          <input value={form.enclosureSize} onChange={set("enclosureSize")} placeholder="24×18×18 in" />
        </div>

        <div className="field full">
          <label>
            Enclosure label / ID <span className="hint">distinguishes duplicate colonies</span>
          </label>
          <input value={form.enclosureLabel} onChange={set("enclosureLabel")} placeholder="e.g. Rack B · Tank 2, Rearing room" />
        </div>

        <div className="field">
          <label>Substrate</label>
          <input value={form.substrate} onChange={set("substrate")} placeholder="Coco fiber, sand…" />
        </div>
        <div className="field">
          <label>Temperature range</label>
          <input value={form.temperature} onChange={set("temperature")} placeholder="72-78°F" />
        </div>
        <div className="field">
          <label>Humidity range</label>
          <input value={form.humidity} onChange={set("humidity")} placeholder="50-70%" />
        </div>
        <div className="field">
          <label>Feeding frequency</label>
          <input value={form.feedingFrequency} onChange={set("feedingFrequency")} placeholder="Daily, every 3 days, weekly…" />
        </div>
        <div className="field full">
          <label>Diet</label>
          <input value={form.diet} onChange={set("diet")} placeholder="Leafy greens, crickets, milkweed…" />
        </div>
        <div className="field full">
          <label>Notes</label>
          <textarea value={form.notes} onChange={set("notes")} placeholder="Husbandry notes, sourcing, temperament…" />
        </div>
      </div>
    </ModalShell>
  );
}

/** Returns open(existing?) to launch the Add/Edit species modal. */
export function useEntryForm() {
  const { open } = useModal();
  return useCallback((existing?: CollectionEntry) => open(<EntryForm existing={existing} />), [open]);
}

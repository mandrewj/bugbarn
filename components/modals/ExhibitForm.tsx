"use client";

import { useCallback, useState } from "react";
import type { CollectionEntry } from "@/lib/types";
import { nowISO } from "@/lib/format";
import { exhibitOf } from "@/lib/care";
import { useData } from "@/components/providers/DataProvider";
import { useModal, ModalShell, useConfirm } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toasts";
import { Icon } from "@/components/Icon";

function CheckoutForm({ entry }: { entry: CollectionEntry }) {
  const { close } = useModal();
  const { saveCollection } = useData();
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);

  const [custodian, setCustodian] = useState("");
  const [sentOut, setSentOut] = useState(today);
  const [dueBack, setDueBack] = useState("");

  function save() {
    saveCollection({
      ...entry,
      exhibit: {
        onExhibit: true,
        sentOut: sentOut ? new Date(sentOut).toISOString() : nowISO(),
        dueBack: dueBack ? new Date(dueBack).toISOString() : null,
        custodian: custodian.trim(),
      },
    });
    close();
    toast(`${entry.commonName} checked out to exhibit`);
  }

  return (
    <ModalShell
      kicker="Exhibit loan"
      title={`Check out ${entry.commonName}`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            <Icon name="box" /> Check out to exhibit
          </button>
        </>
      }
    >
      <div className="formgrid">
        <div className="field full">
          <label>Who / where is it going?</label>
          <input value={custodian} onChange={(e) => setCustodian(e.target.value)} placeholder="Person, classroom, or display location" />
        </div>
        <div className="field">
          <label>Date sent out</label>
          <input type="date" value={sentOut} onChange={(e) => setSentOut(e.target.value)} />
        </div>
        <div className="field">
          <label>
            Due back <span className="hint">optional</span>
          </label>
          <input type="date" value={dueBack} onChange={(e) => setDueBack(e.target.value)} />
        </div>
      </div>
    </ModalShell>
  );
}

/** Returns openExhibitForm(entry) — checkout modal, or a return-to-barn confirm if already out. */
export function useExhibitForm() {
  const { open } = useModal();
  const { saveCollection } = useData();
  const toast = useToast();
  const confirm = useConfirm();

  return useCallback(
    (entry: CollectionEntry) => {
      const e = exhibitOf(entry);
      if (e.onExhibit) {
        confirm({
          title: `Return ${entry.commonName} to the barn?`,
          message: `${e.custodian ? `Currently out with ${e.custodian}. ` : ""}This marks it back in the Bug Barn and clears the loan details.`,
          confirmLabel: "Return to barn",
          onConfirm: () => {
            saveCollection({ ...entry, exhibit: { onExhibit: false, sentOut: null, dueBack: null, custodian: "" } });
            toast(`${entry.commonName} is back in the barn`);
          },
        });
        return;
      }
      open(<CheckoutForm entry={entry} />);
    },
    [open, saveCollection, toast, confirm],
  );
}

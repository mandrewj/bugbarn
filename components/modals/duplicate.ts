"use client";

import { useCallback } from "react";
import type { CollectionEntry } from "@/lib/types";
import { uuid, nowISO } from "@/lib/format";
import { getCareTasks } from "@/lib/care";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/ui/Toasts";
import { useEntryForm } from "@/components/modals/EntryForm";

/**
 * Clone an entry into a new enclosure: new id, SOP + exhibit reset,
 * careTasks copied with fresh ids — then open Edit to set the new label.
 */
export function useDuplicateEntry() {
  const { saveCollection } = useData();
  const toast = useToast();
  const openEntryForm = useEntryForm();

  return useCallback(
    (c: CollectionEntry) => {
      const copy: CollectionEntry = {
        ...c,
        id: uuid(),
        enclosureLabel: c.enclosureLabel ? `${c.enclosureLabel} (copy)` : `Copy of ${c.commonName}`,
        sopId: null,
        exhibit: { onExhibit: false, sentOut: null, dueBack: null, custodian: "" },
        careTasks: getCareTasks(c).map((t) => ({ ...t, id: uuid() })),
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      saveCollection(copy);
      toast("Duplicated — edit the new enclosure’s details");
      openEntryForm(copy);
    },
    [saveCollection, toast, openEntryForm],
  );
}

"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import type { BackupEnvelope } from "@/lib/types";
import { DATA_VERSION } from "@/lib/types";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/ui/Toasts";
import { useConfirm } from "@/components/ui/Modal";
import { useImportDialog } from "@/components/modals/ImportDialog";
import { PageHeader, Splash } from "@/components/ui/bits";
import { Icon } from "@/components/Icon";

export default function SettingsPage() {
  const router = useRouter();
  const { collections, sops, carelogs, loading, exportEnvelope, mergeBackup, replaceDataset, clearAll } = useData();
  const toast = useToast();
  const confirm = useConfirm();
  const openImportDialog = useImportDialog();
  const fileInput = useRef<HTMLInputElement>(null);

  if (loading) return <Splash />;

  function doExport() {
    const data = exportEnvelope();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bugbarn_backup_" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Backup exported");
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let data: BackupEnvelope;
      try {
        data = JSON.parse(reader.result as string);
      } catch {
        toast("Invalid JSON file", "err");
        return;
      }
      if (!data.bugbarn_collections) {
        toast("Not a Bug Barn backup", "err");
        return;
      }
      openImportDialog(data, {
        onMerge: () => {
          mergeBackup(data);
          toast("Data merged");
          router.push("/");
        },
        onReplace: () => {
          replaceDataset({
            version: DATA_VERSION,
            collections: data.bugbarn_collections || [],
            sops: data.bugbarn_sops || [],
            carelogs: data.bugbarn_carelogs || [],
          });
          toast("Data replaced");
          router.push("/");
        },
      });
    };
    reader.readAsText(file);
  }

  return (
    <>
      <PageHeader
        kicker="Data & Backup"
        title="Settings"
        sub={`${collections.length} species · ${sops.length} SOPs · ${carelogs.length} care logs stored`}
      />

      <div className="setcard">
        <h3>Export data</h3>
        <p>Download a single JSON backup of every species, SOP, and care log. Keep it safe or move it to another machine.</p>
        <div className="setrow">
          <button className="btn btn-primary" onClick={doExport}>
            <Icon name="dl" /> Export backup (.json)
          </button>
        </div>
      </div>

      <div className="setcard">
        <h3>Import data</h3>
        <p>
          Load a previously exported backup. Choose whether to <b>merge</b> it into your current data (keeps both, updates matching IDs) or{" "}
          <b>replace</b> everything.
        </p>
        <div className="setrow">
          <button className="btn btn-ghost" onClick={() => fileInput.current?.click()}>
            <Icon name="up" /> Choose backup file…
          </button>
        </div>
        <input ref={fileInput} type="file" accept="application/json,.json" className="hide" onChange={onImportFile} />
      </div>

      <div className="setcard danger">
        <h3 style={{ color: "#9a3210" }}>Clear all data</h3>
        <p>Permanently delete every species, SOP, and care log. Export a backup first if you might want it later.</p>
        <div className="setrow">
          <button
            className="btn btn-danger"
            onClick={() =>
              confirm({
                title: "Clear all data?",
                message: "This permanently deletes every species, SOP, and care log stored. This cannot be undone.",
                confirmLabel: "Clear everything",
                confirmPhrase: "clear barn",
                onConfirm: async () => {
                  await clearAll();
                  toast("All data cleared");
                  router.push("/");
                },
              })
            }
          >
            <Icon name="trash" /> Clear everything
          </button>
        </div>
      </div>
    </>
  );
}

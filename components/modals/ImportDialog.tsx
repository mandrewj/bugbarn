"use client";

import { useCallback, useState } from "react";
import type { BackupEnvelope } from "@/lib/types";
import { useModal, ModalShell, phraseMatches } from "@/components/ui/Modal";

const CONFIRM_PHRASE = "load backup";

function ImportDialog({
  env,
  onMerge,
  onReplace,
}: {
  env: BackupEnvelope;
  onMerge: () => void;
  onReplace: () => void;
}) {
  const { close } = useModal();
  const [typed, setTyped] = useState("");
  const ok = phraseMatches(typed, CONFIRM_PHRASE);

  const counts = `${(env.bugbarn_collections || []).length} species · ${(env.bugbarn_sops || []).length} SOPs · ${
    (env.bugbarn_carelogs || []).length
  } care logs`;

  return (
    <ModalShell
      kicker="Load backup"
      title="Import backup data"
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!ok}
            onClick={() => {
              close();
              onMerge();
            }}
          >
            Merge
          </button>
          <button
            className="btn btn-danger"
            disabled={!ok}
            onClick={() => {
              close();
              onReplace();
            }}
          >
            Replace all
          </button>
        </>
      }
    >
      <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink)" }}>
        This backup contains <b>{counts}</b>.
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink)" }}>
        <b>Merge</b> keeps your current data and updates matching IDs. <b>Replace all</b> permanently overwrites everything
        currently stored — export a backup first if unsure.
      </p>
      <div className="field full" style={{ marginTop: 16 }}>
        <label>
          Type <b>{CONFIRM_PHRASE}</b> to enable importing
        </label>
        <input value={typed} autoFocus autoComplete="off" placeholder={CONFIRM_PHRASE} onChange={(e) => setTyped(e.target.value)} />
      </div>
    </ModalShell>
  );
}

/** Returns openImportDialog(env, { onMerge, onReplace }). */
export function useImportDialog() {
  const { open } = useModal();
  return useCallback(
    (env: BackupEnvelope, handlers: { onMerge: () => void; onReplace: () => void }) =>
      open(<ImportDialog env={env} onMerge={handlers.onMerge} onReplace={handlers.onReplace} />),
    [open],
  );
}

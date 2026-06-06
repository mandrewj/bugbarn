"use client";

import { useCallback, useState } from "react";
import { useData } from "@/components/providers/DataProvider";
import { useModal, ModalShell } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toasts";

function KeeperModal() {
  const { close } = useModal();
  const { lastKeeper, setLastKeeper, keepers } = useData();
  const toast = useToast();
  const [name, setName] = useState(lastKeeper);

  function save() {
    const clean = name.trim();
    if (!clean) {
      toast("Enter a keeper name", "err");
      return;
    }
    setLastKeeper(clean);
    close();
    toast(`Now on shift: ${clean}`);
  }

  return (
    <ModalShell
      kicker="Keeper on shift"
      title="Change keeper"
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            Save
          </button>
        </>
      }
    >
      <p className="muted" style={{ margin: "0 0 14px" }}>
        Set who is currently on shift. New care logs will be attributed to this name. This does not sign you out.
      </p>
      <div className="field full">
        <label>Keeper name</label>
        <input
          value={name}
          autoFocus
          autoComplete="off"
          list="changeKeeperList"
          placeholder="Who's on shift?"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
          }}
        />
        <datalist id="changeKeeperList">
          {keepers.map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>
      </div>
    </ModalShell>
  );
}

/** Returns openChangeKeeper() — opens the in-place keeper switcher (no re-auth). */
export function useChangeKeeper() {
  const { open } = useModal();
  return useCallback(() => open(<KeeperModal />), [open]);
}

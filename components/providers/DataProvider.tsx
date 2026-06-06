"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { CareLog, CollectionEntry, Dataset, Sop, BackupEnvelope } from "@/lib/types";
import { DATA_VERSION } from "@/lib/types";
import { nowISO } from "@/lib/format";
import { useToast } from "@/components/ui/Toasts";

const LAST_KEEPER_KEY = "bugbarn_lastkeeper";

interface DataApi {
  collections: CollectionEntry[];
  sops: Sop[];
  carelogs: CareLog[];
  loading: boolean;
  saveCollection: (c: CollectionEntry) => CollectionEntry;
  deleteCollection: (id: string) => void;
  saveSop: (s: Sop) => Sop;
  saveLog: (l: CareLog) => void;
  deleteLog: (id: string) => void;
  replaceDataset: (ds: Dataset) => void;
  mergeBackup: (env: BackupEnvelope) => void;
  reseed: () => Promise<void>;
  clearAll: () => Promise<void>;
  reload: () => Promise<void>;
  exportEnvelope: () => BackupEnvelope;
  lastKeeper: string;
  setLastKeeper: (s: string) => void;
}

const DataContext = createContext<DataApi | null>(null);

export function useData(): DataApi {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

const EMPTY: Dataset = { version: DATA_VERSION, collections: [], sops: [], carelogs: [] };

export function DataProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [dataset, setDataset] = useState<Dataset>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [lastKeeper, setLastKeeperState] = useState("");

  const dataRef = useRef<Dataset>(EMPTY);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- persistence -------------------------------------------------------
  const flush = useCallback(async () => {
    try {
      const res = await fetch("/api/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataRef.current),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      toast("Couldn't save changes — check your connection", "err");
    }
  }, [router, toast]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flush, 600);
  }, [flush]);

  /** Apply an update to the dataset, mirror it into the ref, optionally persist. */
  const apply = useCallback(
    (updater: (d: Dataset) => Dataset, persist = true): Dataset => {
      const next = updater(dataRef.current);
      dataRef.current = next;
      setDataset(next);
      if (persist) scheduleSave();
      return next;
    },
    [scheduleSave],
  );

  const setStateFromServer = useCallback((ds: Dataset) => {
    dataRef.current = ds;
    setDataset(ds);
  }, []);

  // ---- initial load ------------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const ds = (await res.json()) as Dataset;
      setStateFromServer(ds);
    } catch {
      toast("Couldn't load data", "err");
    } finally {
      setLoading(false);
    }
  }, [router, toast, setStateFromServer]);

  useEffect(() => {
    load();
    setLastKeeperState(localStorage.getItem(LAST_KEEPER_KEY) || "");
  }, [load]);

  // Best-effort flush if the tab is hidden/closed with a pending save.
  useEffect(() => {
    const onHide = () => {
      if (!saveTimer.current) return;
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
      // keepalive lets the PUT outlive the page unload (small payloads)
      fetch("/api/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataRef.current),
        keepalive: true,
      }).catch(() => {});
    };
    const onVisibility = () => document.visibilityState === "hidden" && onHide();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  // ---- mutators ----------------------------------------------------------
  const saveCollection = useCallback(
    (c: CollectionEntry): CollectionEntry => {
      let saved!: CollectionEntry;
      apply((d) => {
        const all = d.collections.slice();
        const i = all.findIndex((x) => x.id === c.id);
        saved = { ...c, updatedAt: nowISO(), createdAt: c.createdAt || (i >= 0 ? all[i].createdAt : nowISO()) };
        if (i >= 0) all[i] = saved;
        else all.push(saved);
        return { ...d, collections: all };
      });
      return saved;
    },
    [apply],
  );

  const deleteCollection = useCallback(
    (id: string) => {
      apply((d) => ({
        ...d,
        collections: d.collections.filter((c) => c.id !== id),
        sops: d.sops.filter((s) => s.collectionId !== id),
        carelogs: d.carelogs.filter((l) => l.collectionId !== id),
      }));
    },
    [apply],
  );

  const saveSop = useCallback(
    (s: Sop): Sop => {
      let saved!: Sop;
      apply((d) => {
        const sops = d.sops.slice();
        const i = sops.findIndex((x) => x.id === s.id);
        saved = { ...s, updatedAt: nowISO(), createdAt: s.createdAt || (i >= 0 ? sops[i].createdAt : nowISO()) };
        if (i >= 0) sops[i] = saved;
        else sops.push(saved);
        // link the SOP to its collection
        const collections = d.collections.map((c) =>
          c.id === s.collectionId ? { ...c, sopId: saved.id, updatedAt: nowISO() } : c,
        );
        return { ...d, sops, collections };
      });
      return saved;
    },
    [apply],
  );

  const saveLog = useCallback(
    (l: CareLog) => {
      apply((d) => {
        const logs = d.carelogs.slice();
        const i = logs.findIndex((x) => x.id === l.id);
        if (i >= 0) logs[i] = l;
        else logs.push({ ...l, createdAt: l.createdAt || nowISO() });
        let collections = d.collections;
        if (l.colonyCountRecorded != null) {
          collections = d.collections.map((c) =>
            c.id === l.collectionId ? { ...c, colonySize: l.colonyCountRecorded as number, updatedAt: nowISO() } : c,
          );
        }
        return { ...d, carelogs: logs, collections };
      });
    },
    [apply],
  );

  const deleteLog = useCallback(
    (id: string) => apply((d) => ({ ...d, carelogs: d.carelogs.filter((l) => l.id !== id) })),
    [apply],
  );

  const replaceDataset = useCallback(
    (ds: Dataset) => apply(() => ({ version: DATA_VERSION, collections: ds.collections || [], sops: ds.sops || [], carelogs: ds.carelogs || [] })),
    [apply],
  );

  const mergeBackup = useCallback(
    (env: BackupEnvelope) => {
      apply((d) => {
        const mergeById = <T extends { id: string }>(cur: T[], incoming: T[] = []): T[] => {
          const byId: Record<string, T> = {};
          cur.forEach((x) => (byId[x.id] = x));
          incoming.forEach((x) => (byId[x.id] = x));
          return Object.values(byId);
        };
        return {
          version: DATA_VERSION,
          collections: mergeById(d.collections, env.bugbarn_collections),
          sops: mergeById(d.sops, env.bugbarn_sops),
          carelogs: mergeById(d.carelogs, env.bugbarn_carelogs),
        };
      });
    },
    [apply],
  );

  const serverAction = useCallback(
    async (action: "reseed" | "clear") => {
      try {
        const res = await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const ds = (await res.json()) as Dataset;
        setStateFromServer(ds);
      } catch {
        toast("Action failed — check your connection", "err");
      }
    },
    [router, toast, setStateFromServer],
  );

  const reseed = useCallback(() => serverAction("reseed"), [serverAction]);
  const clearAll = useCallback(() => serverAction("clear"), [serverAction]);

  const exportEnvelope = useCallback(
    (): BackupEnvelope => ({
      exportedAt: nowISO(),
      app: "BugBarn",
      version: DATA_VERSION,
      bugbarn_collections: dataRef.current.collections,
      bugbarn_sops: dataRef.current.sops,
      bugbarn_carelogs: dataRef.current.carelogs,
    }),
    [],
  );

  const setLastKeeper = useCallback((s: string) => {
    setLastKeeperState(s);
    try {
      localStorage.setItem(LAST_KEEPER_KEY, s);
    } catch {
      /* ignore */
    }
  }, []);

  const value: DataApi = {
    collections: dataset.collections,
    sops: dataset.sops,
    carelogs: dataset.carelogs,
    loading,
    saveCollection,
    deleteCollection,
    saveSop,
    saveLog,
    deleteLog,
    replaceDataset,
    mergeBackup,
    reseed,
    clearAll,
    reload: load,
    exportEnvelope,
    lastKeeper,
    setLastKeeper,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

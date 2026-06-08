// ============================================================
// Server-only data store for the single bugbarn.json document.
//
//  • Production: Vercel Blob (set BLOB_READ_WRITE_TOKEN, auto-added
//    when you connect Blob storage to the project).
//  • Local dev:  data/bugbarn.json on disk (no token needed).
//
// Starts empty on first run and migrates older shapes on read. The
// whole dataset is read/written as one document — the app is single-
// writer in practice (a few lab staff, rarely concurrent).
// ============================================================

import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { Dataset, CollectionEntry } from "./types";
import { DATA_VERSION, emptyDataset, defaultFacility } from "./types";

const BLOB_PATH = "bugbarn.json";
const LOCAL_PATH = path.join(process.cwd(), "data", "bugbarn.json");
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
// On Vercel the only writable path is /tmp; the bundle dir (process.cwd) is
// read-only. If we're on Vercel without a Blob token, fail loudly with a clear
// message instead of an opaque "ENOENT mkdir /var/task/data".
const onVercelWithoutBlob = !useBlob && !!process.env.VERCEL;
const MISCONFIG =
  "Storage is not configured: connect Vercel Blob to this project so BLOB_READ_WRITE_TOKEN is set, then redeploy.";

async function rawRead(): Promise<Dataset | null> {
  if (onVercelWithoutBlob) throw new Error(MISCONFIG);
  if (useBlob) {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: BLOB_PATH });
    const blob = blobs.find((b) => b.pathname === BLOB_PATH);
    if (!blob) return null;
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Dataset;
  }
  try {
    const txt = await fs.readFile(LOCAL_PATH, "utf8");
    return JSON.parse(txt) as Dataset;
  } catch {
    return null;
  }
}

async function rawWrite(data: Dataset): Promise<void> {
  if (onVercelWithoutBlob) throw new Error(MISCONFIG);
  const body = JSON.stringify(data, null, 2);
  if (useBlob) {
    const { put } = await import("@vercel/blob");
    await put(BLOB_PATH, body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
    return;
  }
  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, body, "utf8");
}

/** Backfill defaults onto older entries so the app can rely on shape. */
export function migrate(data: Dataset): Dataset {
  const collections = (data.collections || []).map((c): CollectionEntry => ({
    ...c,
    lifeStages: c.lifeStages || [],
    careTasks: c.careTasks || [],
    permitStatus: c.permitStatus || "unpermitted",
    exhibit: c.exhibit || { onExhibit: false, sentOut: null, dueBack: null, custodian: "" },
  }));
  return {
    version: DATA_VERSION,
    collections,
    sops: data.sops || [],
    carelogs: data.carelogs || [],
    facility: data.facility || defaultFacility(),
    facilitylogs: data.facilitylogs || [],
  };
}

/** Read the dataset, initializing an empty store on first run. */
export async function readStore(): Promise<Dataset> {
  const data = await rawRead();
  if (!data || !Array.isArray(data.collections)) {
    const empty = emptyDataset();
    await rawWrite(empty);
    return empty;
  }
  return migrate(data);
}

/** Overwrite the whole dataset. */
export async function writeStore(data: Dataset): Promise<void> {
  await rawWrite(migrate(data));
}

/** Wipe the store to an empty dataset. */
export async function clearStore(): Promise<Dataset> {
  const empty = emptyDataset();
  await rawWrite(empty);
  return empty;
}

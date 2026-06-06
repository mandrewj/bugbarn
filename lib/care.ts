// ============================================================
// Care scheduling + status logic — ported verbatim from the
// prototype (reference/HANDOFF.md "Logic to Port"). Pure functions:
// they take the data they need so they stay unit-testable.
// ============================================================

import type { CareLog, CareTask, CollectionEntry, Sop, TaskType, Frequency, Risk } from "./types";
import { daysBetween, dateKey } from "./format";

/** Free-text feeding frequency → day count. */
export function intervalDays(freqStr: string): number {
  const s = (freqStr || "").toLowerCase();
  if (/daily|every day/.test(s)) return 1;
  if (/every other|every 2|other day/.test(s)) return 2;
  if (/every 3/.test(s)) return 3;
  if (/twice.*week|2x.*week/.test(s)) return 4;
  if (/bi.?week|every 2 week|fortnight/.test(s)) return 14;
  if (/week/.test(s)) return 7;
  if (/month/.test(s)) return 30;
  return 7;
}

const FREQ_DAYS: Record<Frequency, number> = { daily: 1, "every-other-day": 2, weekly: 7, monthly: 30 };

export function taskFreqDays(f: Frequency | string): number {
  return (FREQ_DAYS as Record<string, number>)[f] != null ? (FREQ_DAYS as Record<string, number>)[f] : intervalDays(f);
}

export function feedingToFreq(str: string): Frequency {
  const d = intervalDays(str);
  return d <= 1 ? "daily" : d <= 2 ? "every-other-day" : d <= 10 ? "weekly" : "monthly";
}

/** All logs for a colony, newest first. */
export function logsForCollection(logs: CareLog[], colId: string): CareLog[] {
  return logs.filter((l) => l.collectionId === colId).sort((a, b) => b.date.localeCompare(a.date));
}

export function lastLogOfType(logs: CareLog[], colId: string, type: TaskType): string | null {
  const ls = logsForCollection(logs, colId).filter((l) => l.taskType === type);
  return ls.length ? ls[0].date : null;
}

/**
 * Most recent log that satisfies a specific routine. Matches by the log's
 * taskId; logs without one (care notes / pre-routine-tracking data) fall back
 * to matching the task's type so legacy history still counts.
 */
export function lastLogOfTask(logs: CareLog[], colId: string, task: CareTask): string | null {
  const ls = logsForCollection(logs, colId).filter((l) =>
    l.taskId ? l.taskId === task.id : l.taskType === task.taskType,
  );
  return ls.length ? ls[0].date : null;
}

export function lastCareDate(logs: CareLog[], colId: string): string | null {
  const ls = logsForCollection(logs, colId);
  return ls.length ? ls[0].date : null;
}

export function defaultCareTasks(c: CollectionEntry): CareTask[] {
  return [{ id: "_feed", label: "Feeding", taskType: "feeding", frequency: feedingToFreq(c.feedingFrequency) }];
}

export function getCareTasks(c: CollectionEntry): CareTask[] {
  return c.careTasks && c.careTasks.length ? c.careTasks : defaultCareTasks(c);
}

export interface TaskStatus {
  status: "overdue" | "due" | "ok";
  daysSince: number;
  nextDays: number;
  iv: number;
  last: string | null;
}

/** For a single recurring task: when is it next due? */
export function taskStatus(logs: CareLog[], colId: string, task: CareTask): TaskStatus {
  const iv = taskFreqDays(task.frequency);
  const last = lastLogOfTask(logs, colId, task);
  if (!last) return { status: "overdue", daysSince: Infinity, nextDays: -Infinity, iv, last: null };
  const since = daysBetween(new Date(), last);
  const nextDays = iv - since;
  const status = nextDays < 0 ? "overdue" : nextDays === 0 ? "due" : "ok";
  return { status, daysSince: since, nextDays, iv, last };
}

export interface CareStatus {
  status: "overdue" | "due" | "ok";
  daysSince: number;
  nextDays: number;
  dueCount: number;
  overdueCount: number;
  tasks: CareTask[];
}

/** Aggregate across a colony's routine tasks → worst-case status + counts. */
export function careStatus(logs: CareLog[], c: CollectionEntry): CareStatus {
  const tasks = getCareTasks(c);
  let worst: TaskStatus | null = null;
  let due = 0;
  let overdue = 0;
  for (const t of tasks) {
    const ts = taskStatus(logs, c.id, t);
    if (ts.status === "overdue") overdue++;
    else if (ts.status === "due") due++;
    if (worst === null || ts.nextDays < worst.nextDays) worst = ts;
  }
  const status = overdue > 0 ? "overdue" : due > 0 ? "due" : "ok";
  return {
    status,
    daysSince: worst === null ? Infinity : worst.daysSince,
    nextDays: worst === null ? Infinity : worst.nextDays,
    dueCount: due,
    overdueCount: overdue,
    tasks,
  };
}

const EMPTY_EXHIBIT = { onExhibit: false, sentOut: null, dueBack: null, custodian: "" };

export function exhibitOf(c: CollectionEntry) {
  return c.exhibit || EMPTY_EXHIBIT;
}

export function exhibitReturnOverdue(c: CollectionEntry): boolean {
  const e = exhibitOf(c);
  return !!(e.onExhibit && e.dueBack && daysBetween(new Date(), e.dueBack) > 0);
}

export function riskOf(sops: Sop[], colId: string): Risk | null {
  const s = sops.find((x) => x.collectionId === colId);
  return s ? s.biteStingRisk : null;
}

export function sopForCollection(sops: Sop[], colId: string): Sop | undefined {
  return sops.find((s) => s.collectionId === colId);
}

export interface DashStats {
  species: number;
  individuals: number;
  due: number;
  overdue: number;
  stale: CollectionEntry[];
  onExhibit: number;
  exhibitOverdue: CollectionEntry[];
}

/** Dashboard rollups. */
export function computeStats(collections: CollectionEntry[], logs: CareLog[]): DashStats {
  const totalInd = collections.reduce((s, c) => s + (Number(c.colonySize) || 0), 0);
  let due = 0;
  let overdue = 0;
  let onExhibit = 0;
  const stale: CollectionEntry[] = [];
  const exhibitOverdue: CollectionEntry[] = [];
  collections.forEach((c) => {
    const st = careStatus(logs, c);
    if (st.status === "overdue") overdue++;
    else if (st.status === "due") due++;
    const last = lastCareDate(logs, c.id);
    if (!last || daysBetween(new Date(), last) >= 7) stale.push(c);
    if (exhibitOf(c).onExhibit) {
      onExhibit++;
      if (exhibitReturnOverdue(c)) exhibitOverdue.push(c);
    }
  });
  return { species: collections.length, individuals: totalInd, due, overdue, stale, onExhibit, exhibitOverdue };
}

/** Group logs by local date key for the schedule grids. */
export function logsByDay(logs: CareLog[]): Record<string, CareLog[]> {
  const m: Record<string, CareLog[]> = {};
  logs.forEach((l) => {
    const k = dateKey(l.date);
    (m[k] = m[k] || []).push(l);
  });
  return m;
}

// ============================================================
// Bug Barn — domain types (see reference/HANDOFF.md "Data Model")
// ============================================================

export type TaskType = "feeding" | "cleaning" | "census" | "observation" | "other";
export type Frequency = "daily" | "every-other-day" | "weekly" | "monthly";
export type Risk = "low" | "medium" | "high";
export type LifeStage = "egg" | "larva" | "nymph" | "pupa" | "juvenile" | "adult";
/** USDA regulatory classification. "permitted" = held under a USDA permit. */
export type PermitStatus = "permitted" | "unpermitted";

export interface CareTask {
  id: string;
  label: string; // "Feeding", "Spot-clean & water", "UV headcount"…
  taskType: TaskType;
  frequency: Frequency;
}

export interface Exhibit {
  onExhibit: boolean;
  sentOut: string | null; // ISO date loaned out
  dueBack: string | null; // ISO date expected back (optional)
  custodian: string; // who/where has it
}

/** A species in a specific enclosure. Multiple entries of one species may coexist. */
export interface CollectionEntry {
  id: string;
  commonName: string;
  scientificName: string; // always rendered italic
  dateAdded: string; // ISO date
  colonySize: number;
  lifeStages: LifeStage[];
  enclosureType: string;
  enclosureSize: string;
  enclosureLabel: string; // distinguishes duplicate colonies
  substrate: string;
  temperature: string;
  humidity: string;
  diet: string;
  feedingFrequency: string;
  permitStatus: PermitStatus; // USDA permitted (regulated) vs unpermitted
  notes: string;
  photo: string | null; // Vercel Blob URL (prototype used a dataURL)
  sopId: string | null;
  exhibit: Exhibit;
  careTasks: CareTask[];
  createdAt: string;
  updatedAt: string;
}

export interface Sop {
  id: string;
  collectionId: string;
  speciesName: string;
  biologyOverview: string;
  housingEnvironment: string;
  feedingProtocol: string;
  cleaningSchedule: string;
  populationCensus: string;
  healthSafetyNotes: string;
  ppeRequired: string; // comma-joined subset of: gloves, eye protection, long sleeves, respirator
  biteStingRisk: Risk;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CareLog {
  id: string;
  collectionId: string;
  date: string; // ISO date
  frequency?: Frequency; // routine cadence; absent for unscheduled care notes
  taskId?: string; // the specific CareTask this log satisfies (absent: care notes / legacy)
  taskType: TaskType;
  taskLabel?: string; // the routine's name (or "Care notes") this log records
  performedBy: string;
  notes: string;
  colonyCountRecorded: number | null; // if set, also updates the entry's colonySize
  createdAt: string;
}

/** The whole persisted document. */
export interface Dataset {
  version: number;
  collections: CollectionEntry[];
  sops: Sop[];
  carelogs: CareLog[];
}

/** Canonical export/import envelope — matches the prototype's backup shape. */
export interface BackupEnvelope {
  exportedAt: string;
  app: string;
  version: number;
  bugbarn_collections: CollectionEntry[];
  bugbarn_sops: Sop[];
  bugbarn_carelogs: CareLog[];
}

export const DATA_VERSION = 1;

export function emptyDataset(): Dataset {
  return { version: DATA_VERSION, collections: [], sops: [], carelogs: [] };
}

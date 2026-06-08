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

/** An inclusive numeric target band (e.g. acceptable temperature range). */
export interface Range {
  min: number;
  max: number;
}

/** A recurring managerial/cleaning task for the facility (mirrors CareTask). */
export interface FacilityTask {
  id: string;
  label: string; // "HVAC filter check", "Mop floors", "Sticky-trap census"…
  taskType: TaskType;
  frequency: Frequency;
}

/** The Bug Barn facility itself — ambient targets + managerial routines. */
export interface Facility {
  name: string; // default "Bug Barn"
  tempTarget: Range | null; // °F acceptable band
  humidityTarget: Range | null; // % RH acceptable band
  tasks: FacilityTask[]; // recurring managerial tasks
  notes: string;
  updatedAt: string;
}

/** One facility check: environment readings and/or a managerial task done. */
export interface FacilityLog {
  id: string;
  date: string; // ISO timestamp
  temperature: number | null; // °F reading at this check
  humidity: number | null; // % RH reading at this check
  frequency?: Frequency; // routine cadence; absent for unscheduled checks
  taskId?: string; // the FacilityTask this log satisfies (absent: reading / notes)
  taskType: TaskType;
  taskLabel?: string; // the routine's name (or "Environment reading") this records
  performedBy: string;
  notes: string;
  createdAt: string;
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
  facility: Facility;
  facilitylogs: FacilityLog[];
}

/** Canonical export/import envelope — matches the prototype's backup shape. */
export interface BackupEnvelope {
  exportedAt: string;
  app: string;
  version: number;
  bugbarn_collections: CollectionEntry[];
  bugbarn_sops: Sop[];
  bugbarn_carelogs: CareLog[];
  bugbarn_facility?: Facility; // added in v2; optional so older backups still import
  bugbarn_facilitylogs?: FacilityLog[];
}

export const DATA_VERSION = 2;

/** A fresh, empty facility record. */
export function defaultFacility(): Facility {
  return { name: "Bug Barn", tempTarget: null, humidityTarget: null, tasks: [], notes: "", updatedAt: new Date().toISOString() };
}

export function emptyDataset(): Dataset {
  return { version: DATA_VERSION, collections: [], sops: [], carelogs: [], facility: defaultFacility(), facilitylogs: [] };
}

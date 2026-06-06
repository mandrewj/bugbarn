import type { TaskType, Frequency, LifeStage, Risk } from "./types";

export const TASK_TYPES: TaskType[] = ["feeding", "cleaning", "census", "observation", "other"];
export const FREQUENCIES: Frequency[] = ["daily", "weekly", "monthly"];
export const STAGES: LifeStage[] = ["egg", "larva", "nymph", "pupa", "juvenile", "adult"];
export const RISKS: Risk[] = ["low", "medium", "high"];

export const ENCLOSURES = [
  "Terrarium",
  "Deli cup",
  "Deli cup colony",
  "Mesh cage",
  "Mesh flight cage",
  "Glass aquarium",
  "Locked terrarium",
  "Custom",
];

export const PPE_OPTIONS = ["gloves", "eye protection", "long sleeves", "respirator"];

export const TASK_COLORS: Record<TaskType, string> = {
  feeding: "#5a8a32",
  cleaning: "#4a86b0",
  census: "#C8860A",
  observation: "#8a7a5e",
  other: "#9a8a6c",
};

/** Past-tense verbs for the dashboard recent-activity feed. */
export const ACTIVITY_VERB: Record<TaskType, string> = {
  feeding: "Fed",
  cleaning: "Cleaned",
  census: "Census",
  observation: "Observed",
  other: "Logged",
};

/** SOP section ordering used by detail view, editor, and print. */
export const SOP_SECTIONS: { label: string; key: keyof import("./types").Sop }[] = [
  { label: "Biology overview", key: "biologyOverview" },
  { label: "Housing & environment", key: "housingEnvironment" },
  { label: "Feeding protocol", key: "feedingProtocol" },
  { label: "Cleaning schedule", key: "cleaningSchedule" },
  { label: "Population census", key: "populationCensus" },
  { label: "Health & safety", key: "healthSafetyNotes" },
];

export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "/", icon: "dash" as const },
  { key: "collections", label: "Collections", href: "/collections", icon: "bug" as const },
  { key: "schedule", label: "Care Schedule", href: "/schedule", icon: "cal" as const },
  { key: "sops", label: "SOP Library", href: "/sops", icon: "sop" as const },
  { key: "settings", label: "Settings", href: "/settings", icon: "set" as const },
];

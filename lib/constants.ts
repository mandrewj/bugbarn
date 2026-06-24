import type { TaskType, Frequency, LifeStage, Risk, PermitStatus, RetireReason } from "./types";

/** Routine task types offered in the task editors. "life-event" is intentionally
 * excluded — life events are logged ad-hoc, not as recurring routines. */
export const TASK_TYPES: TaskType[] = ["feeding", "watering", "cleaning", "census", "observation", "other"];

export const PERMIT_STATUSES: PermitStatus[] = ["unpermitted", "permitted"];

/** Badge/label text for USDA permit classification. */
export const PERMIT_LABELS: Record<PermitStatus, string> = {
  permitted: "USDA Permitted",
  unpermitted: "No Permit Needed",
};

/** Preset life-event types for the "Log life event" picker. */
export const LIFE_EVENTS = [
  "Molted",
  "Laid eggs",
  "Eggs hatched",
  "Mating observed",
  "Death / loss",
  "Acquired / added",
  "Relocated",
  "Other",
];

/** Labels for the retire-reason picker. */
export const RETIRE_REASONS: { value: RetireReason; label: string }[] = [
  { value: "deceased", label: "Deceased" },
  { value: "removed", label: "Removed from barn" },
  { value: "released", label: "Released" },
];
export const FREQUENCIES: Frequency[] = ["daily", "every-other-day", "weekly", "monthly"];

/** Human-readable labels for the (hyphenated) frequency keys. */
export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: "Daily",
  "every-other-day": "Every other day",
  weekly: "Weekly",
  monthly: "Monthly",
};
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
  watering: "#2a9d9d",
  cleaning: "#4a86b0",
  census: "#C8860A",
  observation: "#8a7a5e",
  "life-event": "#8e5db0",
  other: "#9a8a6c",
};

/** Past-tense verbs for the dashboard recent-activity feed. */
export const ACTIVITY_VERB: Record<TaskType, string> = {
  feeding: "Fed",
  watering: "Watered",
  cleaning: "Cleaned",
  census: "Census",
  observation: "Observed",
  "life-event": "Life event",
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
  { key: "facility", label: "Facility", href: "/facility", icon: "home" as const },
  { key: "sops", label: "SOP Library", href: "/sops", icon: "sop" as const },
  { key: "settings", label: "Settings", href: "/settings", icon: "set" as const },
];

// ============================================================
// Demo dataset — ported from the prototype's seedData().
// Returns a full Dataset (8 species, 6 SOPs, ~3 weeks of care
// history, 2 exhibit loans). Used to seed an empty store and by
// the Settings "Reload sample data" action.
// ============================================================

import type { CareLog, CollectionEntry, Dataset, Sop, TaskType, Frequency, LifeStage } from "./types";
import { DATA_VERSION } from "./types";
import { uuid, nowISO } from "./format";
import { feedingToFreq } from "./care";

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(8 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 59), 0, 0);
  return d.toISOString();
}
function dayOnly(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

type SpecSeed = Partial<CollectionEntry> & { _added?: number };

export function seedData(): Dataset {
  const C = (o: SpecSeed): CollectionEntry =>
    Object.assign(
      {
        id: uuid(),
        commonName: "",
        scientificName: "",
        dateAdded: dayOnly(o._added || 200),
        colonySize: 0,
        lifeStages: [] as LifeStage[],
        enclosureType: "",
        enclosureSize: "",
        enclosureLabel: "",
        substrate: "",
        temperature: "",
        humidity: "",
        diet: "",
        feedingFrequency: "",
        notes: "",
        photo: null,
        sopId: null,
        exhibit: { onExhibit: false, sentOut: null, dueBack: null, custodian: "" },
        careTasks: [],
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
      o,
    ) as CollectionEntry;

  const specs: CollectionEntry[] = [
    C({ commonName: "Madagascar Hissing Cockroach", scientificName: "Gromphadorhina portentosa", colonySize: 300,
      lifeStages: ["adult", "nymph"], enclosureType: "Terrarium", enclosureSize: "24×18×18 in", substrate: "Coco fiber + bark",
      temperature: "75-82°F", humidity: "60-70%", diet: "Leafy greens, fruit, dog kibble", feedingFrequency: "Every 3 days",
      notes: "Display colony. Males hiss when handled — great for outreach demos. Watch for mite buildup on substrate.", _added: 540 }),
    C({ commonName: "Emperor Scorpion", scientificName: "Pandinus imperator", colonySize: 4,
      lifeStages: ["adult"], enclosureType: "Terrarium", enclosureSize: "18×12×12 in", substrate: "Coco fiber, 4 in deep",
      temperature: "78-86°F", humidity: "70-80%", diet: "Crickets, dubia roaches", feedingFrequency: "Twice weekly",
      notes: "Communal-tolerant. Provide cork bark hides. Mild venom but large pincers — use forceps.", _added: 410 }),
    C({ commonName: "Monarch Butterfly", scientificName: "Danaus plexippus", colonySize: 120,
      lifeStages: ["egg", "larva", "pupa", "adult"], enclosureType: "Mesh flight cage", enclosureSize: "24×24×36 in",
      substrate: "N/A — potted milkweed", temperature: "72-80°F", humidity: "50-60%", diet: "Milkweed (larvae), nectar/sugar water (adults)",
      feedingFrequency: "Daily", notes: "Rear-and-release education program. Sanitize cage between cohorts to prevent OE spore spread.", _added: 60 }),
    C({ commonName: "Vietnamese Stick Insect", scientificName: "Medauroidea extradentata", colonySize: 60,
      lifeStages: ["egg", "nymph", "adult"], enclosureType: "Mesh cage", enclosureSize: "18×18×24 in", substrate: "Paper towel",
      temperature: "70-78°F", humidity: "60-70%", diet: "Bramble, oak, rose leaves", feedingFrequency: "Every 2 days",
      notes: "Parthenogenetic — all female. Mist daily. Eggs drop to floor; collect for incubation.", _added: 150 }),
    C({ commonName: "Chilean Rose Tarantula", scientificName: "Grammostola rosea", colonySize: 1,
      lifeStages: ["adult"], enclosureType: "Terrarium", enclosureSize: "12×12×12 in", substrate: "Coco fiber, 3 in",
      temperature: "70-78°F", humidity: "60-65%", diet: "Crickets, dubia roaches", feedingFrequency: "Weekly",
      notes: "Docile but can flick urticating hairs. Keep water dish full. Long fasting is normal.", _added: 300 }),
    C({ commonName: "Giant African Millipede", scientificName: "Archispirostreptus gigas", colonySize: 12,
      lifeStages: ["adult", "juvenile"], enclosureType: "Terrarium", enclosureSize: "24×12×12 in", substrate: "Deep hardwood leaf litter + rotting wood",
      temperature: "72-80°F", humidity: "70-80%", diet: "Decaying leaves, cucumber, squash", feedingFrequency: "Every 3 days",
      notes: "Secretes benzoquinones if stressed — wash hands after handling. Excellent tactile outreach animal.", _added: 220 }),
    C({ commonName: "Desert Death-Feigning Beetle", scientificName: "Asbolus verrucosus", colonySize: 25,
      lifeStages: ["adult"], enclosureType: "Deli cup colony", enclosureSize: "6×6×4 in cups", substrate: "Sand + sphagnum",
      temperature: "72-85°F", humidity: "30-40%", diet: "Carrot, apple, dog kibble", feedingFrequency: "Twice weekly",
      notes: "Play dead when disturbed — kid favorite. Keep dry; mold is the main risk.", _added: 95 }),
    C({ commonName: "Arizona Bark Scorpion", scientificName: "Centruroides sculpturatus", colonySize: 8,
      lifeStages: ["adult", "juvenile"], enclosureType: "Locked terrarium", enclosureSize: "18×12×12 in", substrate: "Sand/clay mix",
      temperature: "78-88°F", humidity: "40-50%", diet: "Small crickets", feedingFrequency: "Weekly",
      notes: "⚠ Medically significant venom. Staff-only handling with forceps + UV light. Double-locked, escape-proof lid mandatory.", _added: 120 }),
  ];

  const byName = (n: string) => specs.find((s) => s.commonName === n)!;

  const LABELS: Record<string, string> = {
    "Madagascar Hissing Cockroach": "Main hall display",
    "Emperor Scorpion": "Invert room · Rack B",
    "Monarch Butterfly": "Rearing room",
    "Vietnamese Stick Insect": "Invert room · Rack A",
    "Chilean Rose Tarantula": "Invert room · Rack B",
    "Giant African Millipede": "Touch-table holding",
    "Desert Death-Feigning Beetle": "Touch-table holding",
    "Arizona Bark Scorpion": "Venom case (locked)",
  };
  const TASKS: Record<string, [string, TaskType, Frequency][]> = {
    "Madagascar Hissing Cockroach": [["Feeding", "feeding", "weekly"], ["Spot-clean & water", "cleaning", "weekly"], ["Full census", "census", "monthly"]],
    "Emperor Scorpion": [["Feeding", "feeding", "weekly"], ["Spot-clean & water", "cleaning", "weekly"], ["UV headcount", "census", "weekly"]],
    "Monarch Butterfly": [["Fresh milkweed / nectar", "feeding", "daily"], ["Frass clean & OE check", "cleaning", "daily"], ["Life-stage census", "census", "daily"]],
    "Vietnamese Stick Insect": [["Fresh foliage", "feeding", "daily"], ["Daily misting", "observation", "daily"], ["Floor clean & egg sift", "cleaning", "weekly"]],
    "Chilean Rose Tarantula": [["Feeding", "feeding", "weekly"], ["Water & spot-clean", "cleaning", "weekly"], ["Weight & molt check", "census", "monthly"]],
    "Giant African Millipede": [["Feeding", "feeding", "weekly"], ["Mist & spot-clean", "cleaning", "weekly"], ["Census", "census", "monthly"]],
    "Desert Death-Feigning Beetle": [["Feeding", "feeding", "weekly"], ["Dry-out & mold check", "cleaning", "weekly"], ["Census", "census", "monthly"]],
    "Arizona Bark Scorpion": [["Feeding (feeding port)", "feeding", "weekly"], ["Two-staff spot clean", "cleaning", "monthly"], ["UV reconcile count", "census", "weekly"]],
  };
  specs.forEach((c) => {
    c.enclosureLabel = LABELS[c.commonName] || "";
    c.careTasks = (TASKS[c.commonName] || [["Feeding", "feeding", feedingToFreq(c.feedingFrequency)] as [string, TaskType, Frequency]]).map(
      ([label, taskType, frequency]) => ({ id: uuid(), label, taskType, frequency }),
    );
  });

  const setEx = (name: string, sent: number, due: number | null, who: string) => {
    const c = byName(name);
    if (c) c.exhibit = { onExhibit: true, sentOut: dayOnly(sent), dueBack: due == null ? null : dayOnly(due), custodian: who };
  };
  setEx("Madagascar Hissing Cockroach", 10, -4, "Lilly Hall lobby · Outreach");
  setEx("Desert Death-Feigning Beetle", 20, 3, "Ms. Carter · Klondike Elementary");

  const mkSop = (name: string, fields: Partial<Sop>): Sop => {
    const c = byName(name);
    const s: Sop = Object.assign(
      {
        id: uuid(), collectionId: c.id, speciesName: c.commonName,
        biologyOverview: "", housingEnvironment: "", feedingProtocol: "", cleaningSchedule: "", populationCensus: "",
        healthSafetyNotes: "", ppeRequired: "", biteStingRisk: "low" as const, notes: "", createdAt: nowISO(), updatedAt: nowISO(),
      },
      fields,
    );
    c.sopId = s.id;
    return s;
  };

  const sops: Sop[] = [
    mkSop("Madagascar Hissing Cockroach", { biteStingRisk: "low", ppeRequired: "gloves",
      biologyOverview: "Large, wingless, ovoviviparous roach native to Madagascar leaf litter. Lifespan 2-5 years. Produces the characteristic hiss by forcing air through abdominal spiracles.",
      housingEnvironment: "Ventilated terrarium, 75-82°F, 60-70% RH. 2 in coco fiber + bark hides. Smooth-walled, vaseline rim to prevent climbing escapes.",
      feedingProtocol: "Leafy greens + fruit + dry dog kibble every 3 days. Shallow water crystals always available. Remove uneaten produce within 24h.",
      cleaningSchedule: "Spot-clean mold/old food daily. Full substrate change every 6-8 weeks. Sift for nymphs before discarding substrate.",
      populationCensus: "Visual estimate monthly by counting a marked quadrant ×4. Record adults vs nymphs separately.",
      healthSafetyNotes: "No bite/sting risk. Wash hands after handling. Allergen potential from frass dust — work in ventilated area.",
      notes: "Flagship outreach species. Suitable for unsupervised public handling under staff guidance." }),
    mkSop("Emperor Scorpion", { biteStingRisk: "medium", ppeRequired: "gloves, long sleeves",
      biologyOverview: "West African forest scorpion, communal, fluoresces under UV. Mild venom (LD50 high); pincers are the larger hazard. Lifespan 6-8 years.",
      housingEnvironment: "78-86°F, 70-80% RH. 4 in moist coco fiber, multiple cork hides, shallow water dish. One hide per animal.",
      feedingProtocol: "Appropriately sized crickets / dubia roaches twice weekly. Remove uneaten prey within 12h to avoid stressing molting animals.",
      cleaningSchedule: "Spot-clean boluses and mold weekly. Full clean quarterly. Never disturb a freshly molted (soft) scorpion.",
      populationCensus: "Headcount weekly with UV light after dark. Note any gravid females or recent molts.",
      healthSafetyNotes: "Use 12-in forceps. Sting comparable to a bee — keep antihistamine in first-aid kit. Not for public handling.",
      notes: "Staff demonstration animal only." }),
    mkSop("Monarch Butterfly", { biteStingRisk: "low", ppeRequired: "gloves",
      biologyOverview: "Migratory nymphalid. Complete metamorphosis ~28-32 days egg-to-adult at room temp. Larvae sequester cardenolides from milkweed.",
      housingEnvironment: "Mesh flight cage with potted live milkweed, 72-80°F, 50-60% RH, 14h light. Avoid crowding (>1 larva/leaf cluster).",
      feedingProtocol: "Larvae: fresh milkweed daily, replace wilted leaves. Adults: 10% sugar water on sponge / fresh nectar flowers daily.",
      cleaningSchedule: "Remove frass and shed skins daily. Bleach-sanitize cage (10% solution, rinse well) between rearing cohorts to control OE.",
      populationCensus: "Count by life stage daily during active rearing; log eclosion and release numbers.",
      healthSafetyNotes: "No risk to handlers. Handle adults by wing base only, sparingly. Quarantine/cull OE-positive individuals.",
      notes: "Tag-and-release with Monarch Watch each fall." }),
    mkSop("Vietnamese Stick Insect", { biteStingRisk: "low", ppeRequired: "none required",
      biologyOverview: "Parthenogenetic phasmid; colonies are all-female. Eggs hatch in 3-6 months. Adults reach ~10 cm, masters of crypsis.",
      housingEnvironment: "Tall mesh cage (height for molting), 70-78°F, 60-70% RH. Mist daily. Fresh bramble/oak/rose in water picks.",
      feedingProtocol: "Replace cut foliage every 2 days or when wilted. Ensure stems are in water but cage floor stays dry.",
      cleaningSchedule: "Clear frass from floor every 2-3 days. Sift floor debris for dropped eggs before disposal. Full clean monthly.",
      populationCensus: "Estimate nymphs + adults monthly; tally collected eggs into incubation cups.",
      healthSafetyNotes: "Harmless. Very fragile — never grasp legs (autotomy). Coax onto hand instead.",
      notes: "Great first hands-on insect for young visitors." }),
    mkSop("Chilean Rose Tarantula", { biteStingRisk: "medium", ppeRequired: "gloves, eye protection",
      biologyOverview: "New World terrestrial theraphosid. Females live 15-20 yrs. Mild venom; primary hazard is urticating setae kicked from the abdomen.",
      housingEnvironment: "70-78°F, 60-65% RH. 3 in dry coco fiber, one cork hide, full water dish. Floor space > height (avoid fall injury).",
      feedingProtocol: "1-2 appropriately sized crickets weekly. Long voluntary fasts are normal — never force feed. Remove uneaten prey in 24h.",
      cleaningSchedule: "Remove boluses and refill water weekly. Full substrate change yearly or post-molt. Do not disturb during premolt.",
      populationCensus: "Single specimen — log weight monthly and molt dates.",
      healthSafetyNotes: "Eye protection against flicked hairs. Bite ~ bee sting. Staff handling only, low and over soft surface.",
      notes: "Premolt animals refuse food and seal the hide — leave undisturbed." }),
    mkSop("Arizona Bark Scorpion", { biteStingRisk: "high", ppeRequired: "gloves, eye protection, respirator",
      biologyOverview: "Small climbing buthid, the most venomous scorpion in North America. Strongly fluoresces. Negative-buoyancy climber — escapes upward.",
      housingEnvironment: "78-88°F, 40-50% RH. Sand/clay substrate, vertical bark for climbing. DOUBLE-LOCKED escape-proof lid, smooth high walls.",
      feedingProtocol: "Small crickets weekly via forceps through a feeding port only. Never open the main lid for routine feeding.",
      cleaningSchedule: "Minimal-disturbance spot clean monthly, two-staff rule, UV light to locate all animals first. Count before and after.",
      populationCensus: "Full UV headcount before any enclosure opening; reconcile against logged total every time.",
      healthSafetyNotes: "MEDICALLY SIGNIFICANT. Antivenom protocol posted; nearest ER on file. Two-person rule, forceps only, no public access.",
      notes: "Venom-awareness display behind locked glass. Escapee protocol: clear room, UV sweep, report immediately." }),
  ];

  // Care logs — a believable history; tune last-fed to drive due/overdue.
  const keepers = ["M. Reyes", "J. Okafor", "S. Patel", "T. Nguyen", "A. Brooks"];
  const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
  const logs: CareLog[] = [];
  const addLog = (c: CollectionEntry, daysAgo: number, task: TaskType, freq: Frequency, note?: string, count?: number) =>
    logs.push({
      id: uuid(), collectionId: c.id, date: dateOffset(daysAgo), frequency: freq, taskType: task,
      performedBy: pick(keepers), notes: note || "", colonyCountRecorded: count !== undefined ? count : null, createdAt: nowISO(),
    });

  const recent: Record<string, number> = {
    "Madagascar Hissing Cockroach": 3, "Emperor Scorpion": 0, "Monarch Butterfly": 0,
    "Vietnamese Stick Insect": 2, "Chilean Rose Tarantula": 7, "Giant African Millipede": 5,
    "Desert Death-Feigning Beetle": 3, "Arizona Bark Scorpion": 9 /* overdue */,
  };
  specs.forEach((c) => {
    const r = recent[c.commonName] ?? 2;
    for (let d = r; d <= 24; d += c.feedingFrequency.match(/daily/i) ? 2 : 3) {
      addLog(c, d, "feeding", "weekly", "", undefined);
    }
    addLog(c, r + 1, "census", "monthly", "Routine count", c.colonySize + (Math.floor(Math.random() * 7) - 3));
    addLog(c, Math.min(r + 4, 20), "cleaning", "weekly", "Spot clean + water", undefined);
    addLog(c, Math.min(r + 9, 22), "observation", "weekly", pick(["Active, feeding well", "Normal behaviour", "Molt observed", "All accounted for"]), undefined);
  });
  addLog(byName("Emperor Scorpion"), 0, "feeding", "weekly", "2 crickets accepted", undefined);
  addLog(byName("Madagascar Hissing Cockroach"), 0, "census", "monthly", "Quadrant estimate", 300);
  addLog(byName("Monarch Butterfly"), 0, "cleaning", "daily", "Frass cleared, OE check clear", undefined);

  return { version: DATA_VERSION, collections: specs, sops, carelogs: logs };
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The app's data model: one child, and the few things the app records about
// them — growth measurements, diaper changes, the food regimen, and the
// vaccinations given. Everything the screens *say* about that data — the
// child's age, where a reading sits on the growth curve, whether the regimen
// still covers the day's needs, which vaccination is next — is derived at
// read time (see `growth.ts`, `nutrition.ts`, `vaccines.ts`, `diapers.ts`);
// nothing about those answers is stored, so a corrected reading re-derives
// every downstream number.
//
// The whole model is deliberately small. The app's premise is minimal input
// and useful output: a diaper change is one tap and a timestamp, a growth
// reading is what the scale said, a food is a name and a daily amount with
// calories and *optional* everything else. Every field here is read by a
// number on some screen; a field nothing reads is a question asked for
// nothing.

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";

/** The child's sex, as the growth standards and the target-height formula
 *  need it. The WHO standards publish a table per sex and nothing else. */
export type Sex = "female" | "male";

/** The child. One per document — the app follows one child from birth. */
export type Child = {
  /** Display name, or "" — the screens fall back to "your baby". */
  name: string;
  birthDate: DayKey;
  sex: Sex;
  /** The parents' adult heights, for the mid-parental target height (see
   *  `growth.ts`). Either may be unknown, in which case no target is
   *  computed. */
  motherHeightCm: number | null;
  fatherHeightCm: number | null;
  /** ISO timestamp of the last edit — the tiebreak when two devices edited
   *  the profile between syncs. */
  updatedAt: string;
};

/** One growth reading. A visit to the child health centre usually yields all
 *  three; a home scale yields one, so each is optional and a reading with
 *  none of them is dropped on read. */
export type Measurement = {
  /** Stable random id, so an edit on one device and the same reading on
   *  another merge as one row. */
  id: string;
  date: DayKey;
  weightKg: number | null;
  lengthCm: number | null;
  headCm: number | null;
  updatedAt: string;
};

/** What a diaper held. Three answers and no more — the app records the
 *  count of wet and dirty diapers, not a description of either. */
export type DiaperKind = "pee" | "poo" | "both";

/** One diaper change: a kind and the moment it was logged. Immutable — a
 *  mistap is deleted, not edited — so there is no `updatedAt`. */
export type DiaperChange = {
  id: string;
  kind: DiaperKind;
  /** ISO timestamp of the change. Recorded automatically at the tap; the
   *  day it falls on is derived from it in local time (see `diapers.ts`). */
  at: string;
};

/** The nutrient content of a food, per 100 g (or per 100 ml). Calories are
 *  the only value the form insists on; every other value is a claim the
 *  parent chose to make about that food, and the assessment treats "not
 *  entered" as "unknown", never as zero. Grams and micrograms as printed on
 *  Swedish food labels and in Livsmedelsverket's database. */
export type Nutrients = {
  kcal: number;
  ironMg?: number;
  vitaminDUg?: number;
  fatG?: number;
  saturatedG?: number;
  monounsaturatedG?: number;
  polyunsaturatedG?: number;
  omega3G?: number;
  omega6G?: number;
  /** The individual omega-3 fatty acids, kept when a label prints them. The
   *  screens never ask for these; they exist so a food entered with them
   *  keeps them. */
  alaG?: number;
  dhaG?: number;
  epaG?: number;
};

/** Every nutrient key, in the order the screens list them. */
export const NUTRIENT_KEYS = [
  "kcal",
  "ironMg",
  "vitaminDUg",
  "fatG",
  "saturatedG",
  "monounsaturatedG",
  "polyunsaturatedG",
  "omega3G",
  "omega6G",
  "alaG",
  "dhaG",
  "epaG",
] as const satisfies readonly (keyof Nutrients)[];

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];

/** One line of the daily food regimen: a food the child typically gets in a
 *  day, how much of it, and what is in it. Not a meal, not a diary entry —
 *  "porridge, 150 g a day" is the whole claim. */
export type Food = {
  id: string;
  name: string;
  /** The typical daily amount, in `unit`. */
  amount: number;
  /** Grams for food, millilitres for drinks (formula, oil by the spoon is
   *  grams). Only affects how the amount is labelled — the arithmetic is the
   *  same per 100. */
  unit: "g" | "ml";
  /** Content per 100 g / 100 ml. */
  per100: Nutrients;
  updatedAt: string;
};

/** How the child's milk is fed — the one fact the nutrition assessment needs
 *  beyond the regimen. Breast milk is not measured, on purpose: the app then
 *  compares the regimen against the *complementary* need, the part of the
 *  day's energy that solids are expected to cover at that age. Formula is
 *  measurable, so a formula-fed child's bottles are part of the regimen. */
export type MilkFeeding = {
  kind: "breast" | "formula" | "mixed" | "none";
  /** Typical formula per day in ml, when `kind` includes formula. */
  formulaMlPerDay: number | null;
  updatedAt: string;
};

/** A vaccination given. Points at a dose in the bundled schedule (see
 *  `vaccines.ts`) by id, or at `"other"` for one outside it. */
export type Vaccination = {
  id: string;
  /** The schedule dose this record fulfils (`"dtp-1"`, `"bcg"`, …), or
   *  `"other"` for a vaccination the schedule does not list. */
  doseId: string;
  date: DayKey;
  /** The product's name as written on the card ("Infanrix hexa"), or "". */
  vaccineName: string;
  /** For an `"other"` record: what it was against. Ignored otherwise — a
   *  schedule dose already knows. */
  label: string;
  /** Free-text note ("left thigh", batch number), or "". */
  note: string;
  updatedAt: string;
};

/** The persisted document — the whole app state, one JSON blob. */
export type AppData = {
  /** Schema version; bumped by a migration step in `migrations.ts`. */
  version: number;
  /** null until the child has been set up — the first-run screen. */
  child: Child | null;
  measurements: Record<string, Measurement>;
  diapers: Record<string, DiaperChange>;
  foods: Record<string, Food>;
  milk: MilkFeeding;
  vaccinations: Record<string, Vaccination>;
};

/** The current document schema version. v1 is the first published shape. */
export const DOC_VERSION = 1;

/** The milk feeding a new document starts on. Breast, because it is what
 *  most newborns in Sweden start on and what the nutrition screen's
 *  "nothing to track yet" state assumes. */
export function defaultMilk(): MilkFeeding {
  return { kind: "breast", formulaMlPerDay: null, updatedAt: "" };
}

/** The document a first run starts from. */
export function emptyDoc(): AppData {
  return {
    version: DOC_VERSION,
    child: null,
    measurements: {},
    diapers: {},
    foods: {},
    milk: defaultMilk(),
    vaccinations: {},
  };
}

/** A random id for a new record. `crypto.randomUUID` where the platform has
 *  it (every browser this app targets), a timestamp-random fallback for the
 *  rest — collisions only matter within one family's document. */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Every measurement, oldest first — the order a growth curve is walked. */
export function sortedMeasurements(data: AppData): Measurement[] {
  return Object.values(data.measurements).sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
}

/** Every diaper change, newest first — the order a log is read. */
export function sortedDiapers(data: AppData): DiaperChange[] {
  return Object.values(data.diapers).sort(
    (a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id),
  );
}

/** Every food in the regimen, by name. */
export function sortedFoods(data: AppData): Food[] {
  return Object.values(data.foods).sort((a, b) => a.name.localeCompare(b.name));
}

/** Every vaccination given, oldest first. */
export function sortedVaccinations(data: AppData): Vaccination[] {
  return Object.values(data.vaccinations).sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
}

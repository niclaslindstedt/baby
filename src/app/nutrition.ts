// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Nutrition: what a child of this age and size is recommended to get in a
// day, what the entered regimen adds up to, and whether the one covers the
// other.
//
// The app's premise, stated once here because every function below follows
// from it: **parents keep a regimen, not a diary.** The regimen is the foods
// the child typically gets in a day with a daily amount each; the comparison
// is against the recommendation for the child's *current* age and weight.
// Nothing is logged per meal. As the child grows the recommendation moves
// and the regimen does not, and the moment the two cross is the moment the
// app has something to say.
//
// ## Milk
//
// Breast milk is not measured, on purpose. A breastfed baby regulates intake
// through feeding frequency and duration, and there is no honest way to put
// a number on it from the outside. So for a breastfed child the app compares
// the regimen against the *complementary* need: the share of the day's energy
// that foods other than breast milk are expected to cover at that age. WHO's
// 2023 guideline puts breast milk at 77% of energy at 6–8 months, 63% at
// 9–11 and 44% at 12–23 — the remainder is the target the regimen is held to.
// Formula is measurable, so a formula-fed child's bottles are part of the
// regimen (`MilkFeeding.formulaMlPerDay`) and the target is the whole day.
//
// ## The numbers
//
// Energy: the Nordic Nutrition Recommendations 2023 (which adopt FAO/WHO/UNU
// 2004 for infants) — about 81 kcal per kilogram per day from 6 months
// through the second year, with the small sex difference the FAO table
// carries. The child's own latest weight is used when there is one; the WHO
// median weight for age stands in when there isn't.
//
// Iron: NNR2023 recommended intake 10 mg/day at 7–11 months, 7 mg/day at
// 1–3 years (raised and lowered respectively from the 8 mg of NNR2012).
// Vitamin D: 10 µg/day, which the Swedish D-drops (5 drops = 10 µg, from
// about one week until two years) supply on their own — so the regimen's
// vitamin D is shown for information, and the drops are what the app asks
// about.
// Fat: 30–45 E% at 6–11 months, 30–40 E% at 12–23 months, 25–40 E% from
// two years; saturated fat under 10 E% from 12 months; omega-6 (linoleic
// acid) at least 4 E% at 6–11 months and 3 E% after; omega-3 at least 1 E%
// at 6–11 months and 0.5 E% after. Livsmedelsverket's practical advice for
// the same thing — a teaspoon of rapeseed oil per home-made portion, at most
// a tablespoon of extra fat a day — is why the regimen has an "oil" entry.
// DHA: EFSA's adequate intake of 100 mg/day at 7–24 months, informational.
//
// ## What the assessment says, and refuses to say
//
// Each nutrient gets one of four readings: covered, low, unknown (no food in
// the regimen carries a value for it), or partial (some foods carry it and
// their sum is short — the true total is at least that). A missing value is
// never read as zero. Energy is the headline and is never marked "high":
// a baby's appetite is a better regulator than a table.
//
// Pure and clock-free. The growth standards are a parameter (the same chunk
// the Growth screen loads) because the reference weight comes from them.

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";

import { ageInDays, ageInMonths } from "./age.ts";
import type { WhoTable } from "./data/whoGrowth.ts";
import { lmsAt } from "./growth.ts";
import {
  sortedFoods,
  sortedMeasurements,
  type AppData,
  type Food,
  type MilkFeeding,
  type NutrientKey,
  type Nutrients,
  type Sex,
} from "./types.ts";

/** Where the child is in the feeding timeline. */
export type FeedingStage =
  /** Under about four months: breast milk or formula is everything, and
   *  nothing about food is tracked. */
  | "milkOnly"
  /** Four to six months: tiny tastes are allowed; still nothing to track. */
  | "tastes"
  /** From about six months: complementary foods, and the regimen matters. */
  | "complementary";

/** The age, in days, from which the app tracks a regimen at all. Six WHO
 *  months: Livsmedelsverket's "vid cirka sex månader". */
export const COMPLEMENTARY_FROM_DAYS = Math.round(6 * 30.4375);
/** Four months — the earliest tiny tastes. */
export const TASTES_FROM_DAYS = Math.round(4 * 30.4375);

export function feedingStage(ageDays: number): FeedingStage {
  if (ageDays >= COMPLEMENTARY_FROM_DAYS) return "complementary";
  if (ageDays >= TASTES_FROM_DAYS) return "tastes";
  return "milkOnly";
}

/** Energy per kilogram per day (kcal), by age. FAO/WHO/UNU 2004 for 6–12
 *  months (NNR2023 adopts it), the 1–2 and 2–3 year rows from the same
 *  table, and the NNR2023 1–3 year reference (≈81 kcal/kg) beyond. */
export function kcalPerKg(ageMonths: number, sex: Sex): number {
  const male = sex === "male";
  if (ageMonths < 6) return male ? 81 : 82;
  if (ageMonths < 9) return male ? 79 : 78;
  if (ageMonths < 12) return male ? 80 : 79;
  if (ageMonths < 24) return male ? 82.4 : 80.1;
  if (ageMonths < 36) return male ? 83.6 : 80.6;
  return 81;
}

/** The share of the day's energy breast milk is expected to supply at this
 *  age (WHO 2023), for a child who is breastfed. Tails off after two years,
 *  where the guideline stops — a nursing three-year-old is topping up. */
export function breastMilkEnergyShare(ageMonths: number): number {
  if (ageMonths < 6) return 1;
  if (ageMonths < 9) return 0.77;
  if (ageMonths < 12) return 0.63;
  if (ageMonths < 24) return 0.44;
  if (ageMonths < 36) return 0.15;
  return 0;
}

/** A range of energy shares, in E% (0–100). */
export type EnergyShareRange = { min: number | null; max: number | null };

/** The day's recommendation for the child, as the assessment reads it. */
export type Requirements = {
  ageMonths: number;
  stage: FeedingStage;
  /** The weight the energy figure rests on, and where it came from. */
  weightKg: number;
  weightSource: "measured" | "reference";
  /** Total energy for the day. */
  kcalPerDay: number;
  /** What the regimen (foods plus formula) is held to: the whole day, or
   *  the complementary share for a breastfed child. */
  targetKcal: number;
  ironMg: number;
  vitaminDUg: number;
  fatE: EnergyShareRange;
  saturatedMaxE: number | null;
  omega6MinE: number;
  omega3MinE: number;
  /** EFSA adequate intake, mg/day; null outside 7–24 months. */
  dhaMg: number | null;
};

/** The child's latest recorded weight, or null. */
export function latestWeight(data: AppData): number | null {
  const ms = sortedMeasurements(data);
  for (let i = ms.length - 1; i >= 0; i--) {
    const w = ms[i]!.weightKg;
    if (w !== null) return w;
  }
  return null;
}

/** The recommendation for the child, today. Null before birth. */
export function requirements(
  data: AppData,
  today: DayKey,
  weightForAge: WhoTable,
): Requirements | null {
  const child = data.child;
  if (!child) return null;
  const ageDays = ageInDays(child.birthDate, today);
  if (ageDays < 0) return null;
  const ageMonths = ageInMonths(child.birthDate, today);
  const measured = latestWeight(data);
  const lms = lmsAt(weightForAge, child.sex, ageDays);
  const weightKg = measured ?? lms?.M ?? 10;
  const kcalPerDay = kcalPerKg(ageMonths, child.sex) * weightKg;
  const breastfed = data.milk.kind === "breast" || data.milk.kind === "mixed";
  const share = breastfed ? breastMilkEnergyShare(ageMonths) : 0;
  const under12 = ageMonths < 12;
  const under24 = ageMonths < 24;
  return {
    ageMonths,
    stage: feedingStage(ageDays),
    weightKg,
    weightSource: measured === null ? "reference" : "measured",
    kcalPerDay,
    targetKcal: kcalPerDay * (1 - share),
    ironMg: under12 ? 10 : 7,
    vitaminDUg: 10,
    fatE: under12
      ? { min: 30, max: 45 }
      : under24
        ? { min: 30, max: 40 }
        : { min: 25, max: 40 },
    saturatedMaxE: under12 ? null : 10,
    omega6MinE: under12 ? 4 : 3,
    omega3MinE: under12 ? 1 : 0.5,
    dhaMg: ageMonths >= 7 && ageMonths <= 24 ? 100 : null,
  };
}

/** Standard infant formula, per 100 ml — Livsmedelsverket's database entry
 *  for modersmjölksersättning, with DHA at the EU-mandated minimum since the
 *  database rounds it away. Used for the formula the child gets, so a parent
 *  never has to type a bottle's label in. */
export const FORMULA_PER_100ML: Nutrients = {
  kcal: 66,
  ironMg: 0.4,
  vitaminDUg: 1.37,
  fatG: 3.5,
  saturatedG: 1.1,
  monounsaturatedG: 1.6,
  polyunsaturatedG: 0.6,
  omega3G: 0.1,
  omega6G: 0.6,
  dhaG: 0.02,
};

/** What the regimen adds up to, per day. Each nutrient carries the sum over
 *  the foods that stated it, plus whether every food did — a sum a third of
 *  the foods didn't contribute to is a floor, not a total. */
export type Totals = Record<
  NutrientKey,
  { sum: number; stated: number; unstated: number }
>;

const KEYS: NutrientKey[] = [
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
];

function emptyTotals(): Totals {
  const out = {} as Totals;
  for (const key of KEYS) out[key] = { sum: 0, stated: 0, unstated: 0 };
  return out;
}

function addPortion(totals: Totals, per100: Nutrients, amount: number): void {
  const factor = amount / 100;
  for (const key of KEYS) {
    const value = per100[key];
    if (value === undefined) {
      totals[key].unstated += 1;
    } else {
      totals[key].sum += value * factor;
      totals[key].stated += 1;
    }
  }
}

/** The day's totals from the foods and, when the child gets formula, the
 *  formula. */
export function regimenTotals(foods: Food[], milk: MilkFeeding): Totals {
  const totals = emptyTotals();
  for (const food of foods) addPortion(totals, food.per100, food.amount);
  if (
    (milk.kind === "formula" || milk.kind === "mixed") &&
    milk.formulaMlPerDay !== null &&
    milk.formulaMlPerDay > 0
  ) {
    addPortion(totals, FORMULA_PER_100ML, milk.formulaMlPerDay);
  }
  return totals;
}

/** One nutrient's reading against its target. */
export type NutrientStatus = "covered" | "low" | "partial" | "unknown" | "high";

export type NutrientLine = {
  key: NutrientKey | "fatE" | "saturatedE" | "omega6E" | "omega3E";
  /** The regimen's figure, in the unit the target is in; null when unknown. */
  actual: number | null;
  /** The recommended figure (a minimum, or for `high` a maximum). */
  target: number;
  status: NutrientStatus;
};

/** The whole assessment, as the Food screen renders it. */
export type Assessment = {
  requirements: Requirements;
  totals: Totals;
  /** The headline: does the regimen's energy cover the target. */
  energy: NutrientLine;
  lines: NutrientLine[];
  /** True when there is no regimen to assess yet. */
  empty: boolean;
};

/** How much short of the target still reads as covered. A tenth: the
 *  recommendation is a population figure and a portion is a guess. */
const TOLERANCE = 0.9;

function statusFor(
  sum: number,
  stated: number,
  unstated: number,
  target: number,
): NutrientStatus {
  if (stated === 0) return "unknown";
  if (sum >= target * TOLERANCE) return "covered";
  return unstated > 0 ? "partial" : "low";
}

/** Grams of a fat as a share of the regimen's energy, in E%. */
function energyShare(gramsPerDay: number, kcal: number): number | null {
  if (kcal <= 0) return null;
  return ((gramsPerDay * 9) / kcal) * 100;
}

/** Assess the regimen against the recommendation. Null before birth or
 *  without a child. */
export function assess(
  data: AppData,
  today: DayKey,
  weightForAge: WhoTable,
): Assessment | null {
  const req = requirements(data, today, weightForAge);
  if (!req) return null;
  const foods = sortedFoods(data);
  const totals = regimenTotals(foods, data.milk);
  const kcal = totals.kcal;
  const empty = kcal.stated === 0;

  // Before the complementary stage there is nothing to hold a regimen to:
  // milk is the whole day, and the target would be zero.
  const applicable = req.stage === "complementary";
  const energy: NutrientLine = {
    key: "kcal",
    actual: empty ? null : kcal.sum,
    target: req.targetKcal,
    status:
      empty || !applicable
        ? "unknown"
        : kcal.sum >= req.targetKcal * TOLERANCE
          ? "covered"
          : "low",
  };

  const lines: NutrientLine[] = [];
  const iron = totals.ironMg;
  lines.push({
    key: "ironMg",
    actual: iron.stated ? iron.sum : null,
    target: req.ironMg,
    status: statusFor(iron.sum, iron.stated, iron.unstated, req.ironMg),
  });
  const vitD = totals.vitaminDUg;
  lines.push({
    key: "vitaminDUg",
    actual: vitD.stated ? vitD.sum : null,
    target: req.vitaminDUg,
    status: statusFor(vitD.sum, vitD.stated, vitD.unstated, req.vitaminDUg),
  });

  // The fat shares are read against the regimen's own energy — the fat
  // share of the food you give — which for a breastfed child leaves the
  // milk out of both sides, so the comparison still holds.
  const fat = totals.fatG;
  const fatE = fat.stated ? energyShare(fat.sum, kcal.sum) : null;
  lines.push({
    key: "fatE",
    actual: fatE,
    target: req.fatE.min ?? 0,
    status:
      fatE === null
        ? "unknown"
        : req.fatE.max !== null && fatE > req.fatE.max
          ? "high"
          : fatE >= (req.fatE.min ?? 0) * TOLERANCE
            ? "covered"
            : fat.unstated > 0
              ? "partial"
              : "low",
  });
  if (req.saturatedMaxE !== null) {
    const sat = totals.saturatedG;
    const satE = sat.stated ? energyShare(sat.sum, kcal.sum) : null;
    lines.push({
      key: "saturatedE",
      actual: satE,
      target: req.saturatedMaxE,
      status:
        satE === null
          ? "unknown"
          : satE > req.saturatedMaxE
            ? "high"
            : "covered",
    });
  }
  const o6 = totals.omega6G;
  const o6E = o6.stated ? energyShare(o6.sum, kcal.sum) : null;
  lines.push({
    key: "omega6E",
    actual: o6E,
    target: req.omega6MinE,
    status:
      o6E === null
        ? "unknown"
        : statusFor(o6E, o6.stated, o6.unstated, req.omega6MinE),
  });
  const o3 = totals.omega3G;
  const o3E = o3.stated ? energyShare(o3.sum, kcal.sum) : null;
  lines.push({
    key: "omega3E",
    actual: o3E,
    target: req.omega3MinE,
    status:
      o3E === null
        ? "unknown"
        : statusFor(o3E, o3.stated, o3.unstated, req.omega3MinE),
  });
  if (req.dhaMg !== null) {
    const dha = totals.dhaG;
    lines.push({
      key: "dhaG",
      actual: dha.stated ? dha.sum * 1000 : null,
      target: req.dhaMg,
      status: statusFor(dha.sum * 1000, dha.stated, dha.unstated, req.dhaMg),
    });
  }

  return { requirements: req, totals, energy, lines, empty };
}

/** True when the regimen assessment applies at all — from about six months,
 *  when complementary foods begin. */
export function regimenApplies(assessment: Assessment): boolean {
  return assessment.requirements.stage === "complementary";
}

/**
 * Whether the child has *outgrown* a regimen that used to be enough: the
 * energy is short today, but was covered on the day the regimen was last
 * edited. That is the sentence the app exists to say — "your baby's current
 * food regimen may no longer provide enough energy for their estimated
 * needs" — and it is only true when the regimen did not change and the
 * child did.
 */
export function outgrown(
  data: AppData,
  today: DayKey,
  weightForAge: WhoTable,
): boolean {
  const now = assess(data, today, weightForAge);
  if (!now || now.empty || now.energy.status !== "low") return false;
  let lastEdit: DayKey | null = null;
  for (const food of Object.values(data.foods)) {
    const day = food.updatedAt.slice(0, 10) as DayKey;
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(day) &&
      (lastEdit === null || day > lastEdit)
    ) {
      lastEdit = day;
    }
  }
  const milkDay = data.milk.updatedAt.slice(0, 10) as DayKey;
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(milkDay) &&
    (lastEdit === null || milkDay > lastEdit)
  ) {
    lastEdit = milkDay;
  }
  if (lastEdit === null || lastEdit >= today) return false;
  const then = assess(data, lastEdit, weightForAge);
  return then !== null && !then.empty && then.energy.status === "covered";
}

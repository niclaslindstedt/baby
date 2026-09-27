// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The invented document behind the demo: one healthy, ordinary baby, seven
// and a half months old on the day it opens, with the readings, diaper
// changes, regimen and vaccinations a family would plausibly have entered.
//
// It is the developer "Demo data" toggle and — booted by `VITE_SEED=demo`
// (`make demo`) — what the App Store screenshots are taken of, so it is calm
// by construction: every reading sits on its channel (weight near +0.3 SD,
// length near +0.5, head near +0.3 — no crossing, no dip), the last 24 hours
// hold a full day's diapers at any hour, the regimen covers the day with some
// room, and the vaccination card is up to date with the next visit months
// away. Nothing on Today reads as a warning; `tests/demoData_test.ts` walks a
// year of opening moments and says so through the app's own `growth.ts`,
// `diapers.ts`, `nutrition.ts` and `vaccines.ts`.
//
// Built as a pure function of the moment it opens: every date is an offset
// from `now`, and nothing is written after it — a diaper change later today
// does not exist yet. Times are local wall-clock moments, stored the way a
// tap stores them (`new Date(y, m, d, h, min).toISOString()`), so a 6:40
// change reads 6:40 in any zone. No `Math.random`: the day-to-day variation is
// a hash of the day's offset, so two opens of the same moment are identical.
//
// One first name and no surname, no photo, no illness. The growth readings
// are placed on the WHO standards the app draws (`data/whoGrowth.ts`) at a
// chosen z and rounded the way a scale and a tape read, so the curve is the
// app's own; the foods take their per-100 g values from the app's presets
// (`data/foods.ts`), under the short names a parent gives them.

import {
  addDays,
  dayKeyOf,
  type DayKey,
} from "@niclaslindstedt/oss-framework/calendar";

import { FOOD_PRESETS } from "../data/foods.ts";
import {
  HEAD_FOR_AGE,
  LENGTH_FOR_AGE,
  WEIGHT_FOR_AGE,
  type WhoTable,
} from "../data/whoGrowth.ts";
import { lmsAt, valueAtZ } from "../growth.ts";
import {
  DOC_VERSION,
  type AppData,
  type DiaperChange,
  type DiaperKind,
  type Food,
  type Measurement,
  type Nutrients,
  type Sex,
  type Vaccination,
} from "../types.ts";

/** How old the demo baby is on the day it opens: seven and a half months —
 *  past six, so the food regimen is part of the day, and well before the
 *  twelve-month visit, so the card has nothing waiting. */
export const DEMO_AGE_DAYS = 228;

const SEX: Sex = "female";

/** How many days of diaper changes the log holds: three weeks, more than the
 *  week the Diapers tab and its chart read back. */
const DIAPER_DAYS = 21;

/** A small deterministic hash of two integers, in [0, 1). The day-to-day
 *  scatter — which night had a change, which minute the morning one fell
 *  on — without a random generator whose sequence depends on call order. */
function hash(n: number, salt: number): number {
  let x = (Math.imul(n + 1, 374761393) + Math.imul(salt, 668265263)) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

/** A local wall-clock moment on a day, as the ISO timestamp a tap stores. */
function localIso(day: DayKey, minutes: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(
    y!,
    m! - 1,
    d!,
    Math.floor(minutes / 60),
    minutes % 60,
  ).toISOString();
}

/** `h:mm` as minutes past midnight. */
const hm = (h: number, m: number) => h * 60 + m;

// ── Growth ───────────────────────────────────────────────────────────────────

/** A reading: its age in days, and the z-score each measured value sits at
 *  (null when that value was not taken). Clinic visits carry all three; the
 *  two-week check and a home scale carry only a weight. */
const READINGS: [
  ageDays: number,
  weightZ: number,
  lengthZ: number | null,
  headZ: number | null,
][] = [
  [0, 0.4, 0.45, 0.2], // birth
  [16, 0.22, null, null], // the two-week check: birth weight regained
  [33, 0.28, 0.5, 0.25], // one month
  [61, 0.34, 0.52, 0.3], // two months
  [95, 0.3, 0.48, 0.28], // three months, the day of the first vaccinations
  [124, 0.36, null, null], // four months, weight only
  [155, 0.31, 0.55, 0.3], // five months
  [185, 0.27, 0.5, 0.26], // six months
  [206, 0.33, null, null], // the bathroom scale at home
  [223, 0.3, 0.52, 0.29], // seven months
];

function valueAt(table: WhoTable, ageDays: number, z: number): number {
  const lms = lmsAt(table, SEX, ageDays);
  if (!lms) throw new Error(`no standard at ${ageDays} days`);
  return valueAtZ(lms, z);
}

/** Rounded to a step, as the instrument reads: a scale to 10 g, a tape to
 *  half a centimetre for length and a millimetre for the head. */
function roundTo(value: number, step: number): number {
  return Math.round(Math.round(value / step) * step * 100) / 100;
}

// ── Diapers ──────────────────────────────────────────────────────────────────

/**
 * One day's changes, as [minutes past midnight, kind], in the order they
 * happen. A breastfed seven-month-old on solids: a change on waking, one
 * mid-morning, one after lunch (a dirty one, every day), one after the
 * afternoon nap, one before the evening meal on most days and one at bedtime;
 * some mornings the waking change is dirty too, and about every other night
 * there is one in the small hours. Six to eight changes a day, six or seven
 * of them wet, one or two dirty.
 */
export function dayOfChanges(offset: number): [number, DiaperKind][] {
  const r = (salt: number) => hash(offset, salt);
  const spread = (salt: number, width: number) => Math.floor(r(salt) * width);
  const out: [number, DiaperKind][] = [];
  if (r(1) < 0.45) out.push([hm(2, 10) + spread(2, 100), "pee"]);
  out.push([hm(6, 10) + spread(3, 50), r(4) < 0.3 ? "both" : "pee"]);
  // Mid-morning, 8:50–9:29 — before the screenshots' 9:41.
  out.push([hm(8, 50) + spread(5, 40), "pee"]);
  out.push([hm(12, 5) + spread(6, 50), "both"]);
  out.push([hm(14, 40) + spread(7, 20), "pee"]);
  out.push([hm(16, 45) + spread(9, 14), "pee"]);
  out.push([hm(18, 50) + spread(10, 9), "pee"]);
  return out;
}

// ── The regimen ──────────────────────────────────────────────────────────────

function preset(id: string): Nutrients {
  const found = FOOD_PRESETS.find((p) => p.id === id);
  if (!found) throw new Error(`no food preset ${id}`);
  return { ...found.per100 };
}

/** Build the demo document for the moment `now`. */
export function buildDemoData(now: Date): AppData {
  const today = dayKeyOf(now);
  const birthDate = addDays(today, -DEMO_AGE_DAYS);
  const dayAt = (ageDays: number) => addDays(birthDate, ageDays);

  const measurements: Record<string, Measurement> = {};
  READINGS.forEach(([age, wz, lz, hz], i) => {
    const date = dayAt(age);
    const m: Measurement = {
      id: `demo-m-${i}`,
      date,
      weightKg: roundTo(valueAt(WEIGHT_FOR_AGE, age, wz), 0.01),
      lengthCm:
        lz === null ? null : roundTo(valueAt(LENGTH_FOR_AGE, age, lz), 0.5),
      headCm: hz === null ? null : roundTo(valueAt(HEAD_FOR_AGE, age, hz), 0.1),
      updatedAt: localIso(date, hm(10, 20 + i)),
    };
    measurements[m.id] = m;
  });

  const diapers: Record<string, DiaperChange> = {};
  for (let offset = DIAPER_DAYS - 1; offset >= 0; offset--) {
    const day = addDays(today, -offset);
    dayOfChanges(offset).forEach(([minutes, kind], k) => {
      const at = localIso(day, minutes);
      // Nothing after the moment the demo opens: later today has not
      // happened yet.
      if (Date.parse(at) > now.getTime()) return;
      const change: DiaperChange = { id: `demo-d-${offset}-${k}`, kind, at };
      diapers[change.id] = change;
    });
  }

  // The regimen: solids since six months, last adjusted nine days ago when
  // the salmon went in. Fortified porridge morning and evening, avocado and
  // salmon at lunch, banana in the afternoon — beside breastfeeding. Every
  // food has its times, so the coverage curve steps at the meals; no oil,
  // whose fat would tip the fat share over the recommended range.
  const edited = localIso(addDays(today, -9), hm(20, 15));
  const foods: Record<string, Food> = {};
  const list: Omit<Food, "updatedAt">[] = [
    {
      id: "demo-f-porridge",
      name: "Baby porridge, fortified",
      amount: 120,
      unit: "g",
      per100: preset("porridge"),
      times: ["07:30", "17:00"],
    },
    {
      id: "demo-f-avocado",
      name: "Avocado",
      amount: 20,
      unit: "g",
      per100: preset("avocado"),
      times: ["11:30"],
    },
    {
      id: "demo-f-salmon",
      name: "Salmon",
      amount: 10,
      unit: "g",
      per100: preset("salmon"),
      times: ["11:30"],
    },
    {
      id: "demo-f-banana",
      name: "Banana",
      amount: 30,
      unit: "g",
      per100: preset("banana"),
      times: ["15:00"],
    },
  ];
  for (const food of list) foods[food.id] = { ...food, updatedAt: edited };

  // The card, up to date: each visit on or a few days after the dose's age.
  const vaccinations: Record<string, Vaccination> = {};
  const given: [doseId: string, ageDays: number][] = [
    ["rota-1", 45],
    ["dtp-1", 95],
    ["pcv-1", 95],
    ["rota-2", 95],
    ["dtp-2", 155],
    ["pcv-2", 155],
    ["rota-3", 155],
  ];
  given.forEach(([doseId, age], i) => {
    const date = dayAt(age);
    const v: Vaccination = {
      id: `demo-v-${i}`,
      doseId,
      date,
      vaccineName: "",
      label: "",
      note: "",
      updatedAt: localIso(date, hm(11, 5 + i)),
    };
    vaccinations[v.id] = v;
  });

  const profileEdited = localIso(dayAt(2), hm(21, 30));
  return {
    version: DOC_VERSION,
    child: {
      name: "Robin",
      birthDate,
      sex: SEX,
      motherHeightCm: 168,
      fatherHeightCm: 183,
      updatedAt: profileEdited,
    },
    measurements,
    diapers,
    foods,
    milk: {
      kind: "breast",
      formulaMlPerDay: null,
      formulaType: "infant",
      updatedAt: profileEdited,
    },
    vaccinations,
  };
}

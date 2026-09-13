// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The invented document behind the developer "Demo data" toggle: one child,
// eight months old today, with the readings, diaper changes, regimen and
// vaccinations a family would plausibly have entered — built as a pure
// function of the day it is anchored to. Deterministic on purpose — a seeded
// generator, no `Math.random` — so a screenshot session and a test see the
// same document.
//
// The shape is designed to exercise every state the screens can show: a
// weight series that drifts down half a channel over the summer (the trend
// the Growth screen exists to surface), a regimen that covered the day at
// six months and no longer does at eight (the sentence the Food screen exists
// to say), a week of diapers with one thin day, and a vaccination card with
// the three-month and five-month visits recorded and the twelve-month ones
// ahead.

import { addDays, type DayKey } from "@niclaslindstedt/oss-framework/calendar";

import {
  DOC_VERSION,
  type AppData,
  type DiaperChange,
  type Food,
  type Measurement,
  type Vaccination,
} from "../types.ts";

/** How old the demo child is today, in days. About eight months. */
const AGE_DAYS = 245;

/** A tiny deterministic PRNG (mulberry32). Good enough to scatter readings;
 *  seeded so every enable of the toggle builds the same story. */
function rng(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A boy's median weight, length and head circumference at an age, close
 *  enough to the WHO medians for a demo — the readings below sit a little
 *  under them and drift. */
function median(ageDays: number): { kg: number; cm: number; head: number } {
  const m = ageDays / 30.4375;
  const kg = 3.35 + 6.3 * (1 - Math.exp(-m / 4.2));
  const cm = 49.9 + 28.5 * (1 - Math.exp(-m / 5.8));
  const head = 34.5 + 12.4 * (1 - Math.exp(-m / 4.5));
  return { kg, cm, head };
}

/** Build the demo document, anchored so the child is eight months old on
 *  `today`. */
export function buildDemoData(today: DayKey): AppData {
  const birthDate = addDays(today, -AGE_DAYS);
  const random = rng(7);
  const stamp = (day: DayKey, hour = 9) =>
    `${day}T${String(hour).padStart(2, "0")}:00:00.000Z`;

  // Readings at roughly the BVC visit ages, plus a few home weighings. The
  // weight starts a touch above the median and drifts down to about −0.6 SD
  // by eight months; length and head stay on their channels.
  const visitDays = [10, 30, 60, 90, 120, 150, 180, 210, 240];
  const measurements: Record<string, Measurement> = {};
  visitDays.forEach((age, i) => {
    const day = addDays(birthDate, age);
    const ref = median(age);
    const drift = -0.06 * i; // in kilograms, roughly half a channel by the end
    const m: Measurement = {
      id: `demo-m-${i}`,
      date: day,
      weightKg:
        Math.round((ref.kg * 1.02 + drift + (random() - 0.5) * 0.12) * 100) /
        100,
      lengthCm:
        i % 2 === 0
          ? Math.round((ref.cm + 0.4 + (random() - 0.5) * 0.6) * 10) / 10
          : null,
      headCm:
        i % 3 === 0
          ? Math.round((ref.head - 0.2 + (random() - 0.5) * 0.4) * 10) / 10
          : null,
      updatedAt: stamp(day, 10),
    };
    measurements[m.id] = m;
  });

  // Two weeks of diapers, five to seven a day, with one thin day four days
  // ago and today part-way through.
  const diapers: Record<string, DiaperChange> = {};
  let n = 0;
  for (let i = 13; i >= 0; i--) {
    const day = addDays(today, -i);
    const count = i === 4 ? 3 : i === 0 ? 3 : 5 + Math.floor(random() * 3);
    for (let k = 0; k < count; k++) {
      const hour = 7 + Math.floor((k / count) * 14);
      const minute = Math.floor(random() * 60);
      const roll = random();
      const kind = roll < 0.6 ? "pee" : roll < 0.85 ? "both" : "poo";
      const at = new Date(
        Number(day.slice(0, 4)),
        Number(day.slice(5, 7)) - 1,
        Number(day.slice(8, 10)),
        hour,
        minute,
      ).toISOString();
      const change: DiaperChange = { id: `demo-d-${n++}`, kind, at };
      diapers[change.id] = change;
    }
  }

  // The regimen, last edited at six and a half months: fortified porridge,
  // an egg most days, salmon, fruit, and a teaspoon of rapeseed oil, beside
  // breastfeeding. Enough at six months; short at eight.
  const edited = addDays(birthDate, 200);
  const foods: Record<string, Food> = {};
  const list: Food[] = [
    {
      id: "demo-f-porridge",
      name: "Fullkornsgröt (berikad)",
      amount: 150,
      unit: "g",
      per100: {
        kcal: 104,
        ironMg: 1.7,
        vitaminDUg: 1.79,
        fatG: 3.7,
        saturatedG: 0.7,
        monounsaturatedG: 1.7,
        polyunsaturatedG: 1.1,
        omega3G: 0.2,
        omega6G: 0.9,
      },
      updatedAt: stamp(edited),
    },
    {
      id: "demo-f-egg",
      name: "Ägg (kokt)",
      amount: 30,
      unit: "g",
      per100: {
        kcal: 136,
        ironMg: 1.8,
        vitaminDUg: 1.92,
        fatG: 9.8,
        saturatedG: 2.6,
        monounsaturatedG: 3.9,
        polyunsaturatedG: 1.5,
        omega3G: 0.19,
        omega6G: 1.32,
        dhaG: 0.1,
      },
      updatedAt: stamp(edited),
    },
    {
      id: "demo-f-salmon",
      name: "Lax (kokt)",
      amount: 20,
      unit: "g",
      per100: {
        kcal: 246,
        ironMg: 0.2,
        vitaminDUg: 6.91,
        fatG: 16.6,
        saturatedG: 2.2,
        monounsaturatedG: 7.9,
        polyunsaturatedG: 4.8,
        omega3G: 2.2,
        omega6G: 2.3,
        dhaG: 0.7,
        epaG: 0.4,
      },
      updatedAt: stamp(edited),
    },
    {
      id: "demo-f-banana",
      name: "Banan",
      amount: 40,
      unit: "g",
      per100: { kcal: 95 },
      updatedAt: stamp(edited),
    },
    {
      id: "demo-f-oil",
      name: "Rapsolja",
      amount: 5,
      unit: "g",
      per100: {
        kcal: 884,
        fatG: 100,
        saturatedG: 7.1,
        monounsaturatedG: 61.3,
        polyunsaturatedG: 27.4,
        omega3G: 8.5,
        omega6G: 18.8,
        alaG: 8.5,
      },
      updatedAt: stamp(edited),
    },
  ];
  for (const food of list) foods[food.id] = food;

  // The card: rotavirus at six weeks, the three- and five-month visits
  // recorded, twelve months ahead.
  const vaccinations: Record<string, Vaccination> = {};
  const given: [string, number, string][] = [
    ["rota-1", 44, "RotaTeq"],
    ["dtp-1", 92, "Infanrix hexa"],
    ["pcv-1", 92, "Synflorix"],
    ["rota-2", 92, "RotaTeq"],
    ["dtp-2", 154, "Infanrix hexa"],
    ["pcv-2", 154, "Synflorix"],
    ["rota-3", 154, "RotaTeq"],
  ];
  given.forEach(([doseId, age, name], i) => {
    const day = addDays(birthDate, age);
    const v: Vaccination = {
      id: `demo-v-${i}`,
      doseId,
      date: day,
      vaccineName: name,
      label: "",
      note: "",
      updatedAt: stamp(day, 11),
    };
    vaccinations[v.id] = v;
  });

  return {
    version: DOC_VERSION,
    child: {
      name: "Elias",
      birthDate,
      sex: "male",
      motherHeightCm: 167,
      fatherHeightCm: 182,
      updatedAt: stamp(birthDate, 12),
    },
    measurements,
    diapers,
    foods,
    milk: {
      kind: "breast",
      formulaMlPerDay: null,
      formulaType: "infant",
      updatedAt: stamp(edited),
    },
    vaccinations,
  };
}

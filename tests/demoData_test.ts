// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The demo document — the Settings toggle, `make demo`, and what the App
// Store screenshots are taken of. It is held to two things: the app's own
// format (it round-trips through the parser), and the calm it promises on
// every screen, for every day of a year it could be opened on. Every figure
// is read through the app's own derivations, never restated here.

import { addDays, dayKeyOf } from "@niclaslindstedt/oss-framework/calendar";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ageInDays, ageInMonths } from "../src/app/age.ts";
import {
  HEAD_FOR_AGE,
  LENGTH_FOR_AGE,
  WEIGHT_FOR_AGE,
} from "../src/app/data/whoGrowth.ts";
import { buildDemoData, DEMO_AGE_DAYS } from "../src/app/dev/demoData.ts";
import { assessDiapers, dailyCounts } from "../src/app/diapers.ts";
import {
  forecast,
  readings,
  trend,
  type GrowthStandards,
} from "../src/app/growth.ts";
import { parseDoc, serializeDoc } from "../src/app/migrations.ts";
import { assess, dayCoverage, outgrown } from "../src/app/nutrition.ts";
import {
  averageSleep,
  nextSleep,
  sleepNormFor,
  sleepRhythm,
  sleepSpans,
  sleepStatus,
  unfinishedSleeps,
  wakeWindowFor,
} from "../src/app/sleep.ts";
import { sortedFoods } from "../src/app/types.ts";
import { nextDose, timeline } from "../src/app/vaccines.ts";

const standards: GrowthStandards = {
  weight: WEIGHT_FOR_AGE,
  length: LENGTH_FOR_AGE,
  head: HEAD_FOR_AGE,
};

/** 9:41 local on every day of a year, starting from a fixed day. */
function yearOfMornings(): Date[] {
  const out: Date[] = [];
  for (let i = 0; i < 366; i++) out.push(new Date(2026, 0, 1 + i, 9, 41));
  return out;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("the demo document", () => {
  const now = new Date(2026, 8, 26, 9, 41);

  it("is deterministic for a moment", () => {
    expect(buildDemoData(now)).toEqual(buildDemoData(new Date(now)));
  });

  it("round-trips through the document parser", () => {
    const data = buildDemoData(now);
    expect(parseDoc(serializeDoc(data))).toEqual(data);
  });

  it("names one child by a first name only, and writes nothing after now", () => {
    const data = buildDemoData(now);
    expect(data.child?.name).toBe("Robin");
    for (const change of Object.values(data.diapers)) {
      expect(Date.parse(change.at)).toBeLessThanOrEqual(now.getTime());
    }
    for (const s of Object.values(data.sleeps)) {
      expect(Date.parse(s.start)).toBeLessThanOrEqual(now.getTime());
      if (s.end !== null) {
        expect(Date.parse(s.end)).toBeLessThanOrEqual(now.getTime());
      }
    }
    for (const m of Object.values(data.measurements)) {
      expect(m.date <= dayKeyOf(now)).toBe(true);
    }
    for (const v of Object.values(data.vaccinations)) {
      expect(v.date <= dayKeyOf(now)).toBe(true);
      // No product names: a brand has no place in a store frame.
      expect(v.vaccineName).toBe("");
    }
  });

  it("stamps changes as local wall-clock moments", () => {
    const data = buildDemoData(now);
    const minutes = Object.values(data.diapers).map((c) => {
      const d = new Date(c.at);
      return d.getHours() * 60 + d.getMinutes();
    });
    // Every change falls in the day the template writes: the small hours,
    // or between waking and bedtime — never at a UTC-shifted hour.
    for (const m of minutes) {
      expect(m < 4 * 60 || (m >= 6 * 60 && m < 19 * 60)).toBe(true);
    }
  });

  it("names its foods in English and takes their values from the presets", () => {
    const data = buildDemoData(now);
    for (const food of sortedFoods(data)) {
      expect(food.name).toMatch(/^[A-Za-z ,]+$/);
      expect(food.per100.kcal).toBeGreaterThan(0);
    }
  });
});

describe("every day of a year, at 9:41", () => {
  it("is seven and a half months old, growing along its channels", () => {
    for (const now of yearOfMornings()) {
      const data = buildDemoData(now);
      const today = dayKeyOf(now);
      expect(ageInDays(data.child!.birthDate, today)).toBe(DEMO_AGE_DAYS);
      const months = ageInMonths(data.child!.birthDate, today);
      expect(months).toBeGreaterThan(7.3);
      expect(months).toBeLessThan(7.7);
      for (const indicator of ["weight", "length", "head"] as const) {
        const series = readings(data, standards, indicator);
        // Every reading within ±1 SD of the median, and above it: no
        // reading a parent would read as "small".
        for (const r of series) {
          expect(r.z).not.toBeNull();
          expect(r.z!).toBeGreaterThan(0);
          expect(r.z!).toBeLessThan(1);
        }
        const t = trend(series)!;
        expect(t.verdict).toBe("steady");
        expect(Math.abs(t.delta!)).toBeLessThan(0.2);
        // "Holding" rather than "moving … SD a month".
        const f = forecast(series, standards[indicator], "female")!;
        expect(Math.abs(f.driftPerMonth)).toBeLessThan(0.05);
      }
    }
  });

  it("holds a full, ordinary day of diapers in the last 24 hours", () => {
    for (const now of yearOfMornings()) {
      const data = buildDemoData(now);
      const a = assessDiapers(data, DEMO_AGE_DAYS, now, true)!;
      expect(a.fewWet).toBe(false);
      expect(a.longDirtyGap).toBe(false);
      expect(a.wet).toBeGreaterThanOrEqual(6);
      expect(a.wet).toBeLessThanOrEqual(8);
      expect(a.dirty).toBeGreaterThanOrEqual(1);
      expect(a.dirty).toBeLessThanOrEqual(3);
      // The week's chart: every whole day between six and eight changes,
      // at least five of them wet; today so far, the morning's two or three.
      const week = dailyCounts(data, dayKeyOf(now), 7);
      for (const day of week.slice(0, 6)) {
        expect(day.total).toBeGreaterThanOrEqual(5);
        expect(day.total).toBeLessThanOrEqual(8);
        expect(day.wet).toBeGreaterThanOrEqual(5);
        expect(day.dirty).toBeGreaterThanOrEqual(1);
      }
      expect(week[6]!.total).toBeGreaterThanOrEqual(2);
      expect(week[6]!.total).toBeLessThanOrEqual(3);
    }
  });

  it("sleeps inside the recommendation, every wake window inside the band", () => {
    const band = wakeWindowFor(DEMO_AGE_DAYS)!;
    const norm = sleepNormFor(DEMO_AGE_DAYS)!;
    for (const now of yearOfMornings()) {
      const data = buildDemoData(now);
      for (const days of [30, 90]) {
        const avg = averageSleep(data, now, days)!;
        expect(avg.loggedDays).toBe(days);
        expect(sleepStatus(norm, avg)).toBe("within");
        // About eleven hours at night and three by day, on three naps.
        expect(avg.nightMinutes / 60).toBeGreaterThan(10.5);
        expect(avg.nightMinutes / 60).toBeLessThan(11.5);
        expect(avg.dayMinutes / 60).toBeGreaterThan(2.5);
        expect(avg.dayMinutes / 60).toBeLessThan(3.5);
        expect(avg.napsPerDay).toBe(3);
      }
      const rhythm = sleepRhythm(data, now, band);
      for (const w of [...rhythm.afterNight, ...rhythm.afterNap]) {
        expect(w).toBeGreaterThanOrEqual(band.min);
        expect(w).toBeLessThanOrEqual(band.max);
      }
      // Awake since the morning nap, the midday one suggested ahead.
      const next = nextSleep(data, DEMO_AGE_DAYS, now)!;
      expect(next.state).toBe("awake");
      if (next.state !== "awake") continue;
      expect(next.suggestion!.kind).toBe("nap");
      expect(next.suggestion!.overdue).toBe(false);
      expect(next.suggestion!.own).not.toBeNull();
      expect(unfinishedSleeps(data, now)).toEqual([]);
    }
  });

  it("keeps a regimen that covers the day, with room but not twice over", () => {
    for (const now of yearOfMornings()) {
      const data = buildDemoData(now);
      const today = dayKeyOf(now);
      const a = assess(data, today, WEIGHT_FOR_AGE)!;
      expect(a.requirements.stage).toBe("complementary");
      expect(a.energy.status).toBe("covered");
      const ratio = a.energy.actual! / a.energy.target;
      expect(ratio).toBeGreaterThan(1.1);
      expect(ratio).toBeLessThan(1.6);
      expect(outgrown(data, today, WEIGHT_FOR_AGE)).toBe(false);
      // No nutrient drawn in the warning colour: nothing over a ceiling, and
      // nothing read as short — a food that does not state a value leaves
      // the line "at least this much", in the muted colour.
      for (const line of a.lines) {
        expect(line.status).not.toBe("high");
        expect(line.status).not.toBe("low");
      }
      // The coverage curve meets the day's need with the evening porridge.
      const cover = dayCoverage(sortedFoods(data), data.milk, a.energy.target);
      expect(cover.metAtMinutes).not.toBeNull();
      expect(cover.metAtMinutes!).toBeGreaterThanOrEqual(15 * 60);
      expect(cover.metAtMinutes!).toBeLessThanOrEqual(17 * 60 + 30);
    }
  });

  it("has an up-to-date vaccination card, the next visit months away", () => {
    for (const now of yearOfMornings()) {
      const data = buildDemoData(now);
      const today = dayKeyOf(now);
      const entries = timeline(data, today);
      expect(entries.filter((e) => e.status === "due")).toEqual([]);
      expect(entries.filter((e) => e.status === "given")).toHaveLength(7);
      const next = nextDose(entries)!;
      expect(next.status).toBe("upcoming");
      expect(next.due > addDays(today, 90)).toBe(true);
    }
  });
});

describe("at any hour", () => {
  it("never reads the last 24 hours as thin", () => {
    for (let day = 0; day < 60; day++) {
      for (const [h, m] of [
        [0, 5],
        [3, 30],
        [6, 5],
        [12, 0],
        [17, 0],
        [23, 55],
      ] as const) {
        const now = new Date(2026, 2, 1 + day, h, m);
        const a = assessDiapers(buildDemoData(now), DEMO_AGE_DAYS, now, true)!;
        expect(a.fewWet).toBe(false);
        expect(a.longDirtyGap).toBe(false);
      }
    }
  });
});

describe("the sleeps and the diapers", () => {
  it("never change a diaper while the child is asleep", () => {
    // Three weeks of changes per document, so a few documents cover it.
    for (let day = 0; day < 4; day++) {
      const now = new Date(2026, 4, 1 + day * 9, 23, 59);
      const data = buildDemoData(now);
      const spans = sleepSpans(data, now);
      const asleep = Object.values(data.diapers).filter((change) => {
        const at = Date.parse(change.at);
        return spans.some((span) => at > span.start && at < span.end);
      });
      expect(asleep).toEqual([]);
    }
  });

  it("reads as calm at any hour", () => {
    const norm = sleepNormFor(DEMO_AGE_DAYS)!;
    for (let day = 0; day < 30; day++) {
      for (const [h, m] of [
        [0, 5],
        [2, 45],
        [6, 5],
        [12, 0],
        [17, 0],
        [23, 55],
      ] as const) {
        const now = new Date(2026, 2, 1 + day, h, m);
        const data = buildDemoData(now);
        expect(nextSleep(data, DEMO_AGE_DAYS, now)).not.toBeNull();
        expect(unfinishedSleeps(data, now)).toEqual([]);
        expect(sleepStatus(norm, averageSleep(data, now, 30))).toBe("within");
      }
    }
  });
});

describe("the VITE_SEED=demo build", () => {
  it("boots onto the demo and refuses to turn it off", async () => {
    vi.stubEnv("VITE_SEED", "demo");
    vi.resetModules();
    const mod = await import("../src/app/dev/useDemoData.ts");
    expect(mod.DEMO).toBe(true);
    await mod.bootDemo();
    expect(mod.demoBackendModule()).not.toBeNull();
    mod.setDemoData(false);
    // Still the demo backend's module, and still on for the next render.
    const backend = mod.demoBackendModule()!.createDemoBackend();
    expect(backend.id).toBe("demo");
    expect(backend.load()?.child?.name).toBe("Robin");
  });

  it("is off in any other build", async () => {
    vi.stubEnv("VITE_SEED", "");
    vi.resetModules();
    const mod = await import("../src/app/dev/useDemoData.ts");
    expect(mod.DEMO).toBe(false);
    expect(mod.demoBackendModule()).toBeNull();
  });
});

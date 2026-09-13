// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The nutrition derivation: the recommendation for the child's age and size,
// the regimen's totals, and the assessment that compares them — including
// the one sentence the app exists to say, that a regimen which used to cover
// the day no longer does.

import { describe, expect, it } from "vitest";

import { WEIGHT_FOR_AGE } from "../src/app/data/whoGrowth.ts";
import {
  assess,
  breastMilkEnergyShare,
  DAY_WINDOW_END_MIN,
  DAY_WINDOW_START_MIN,
  dayCoverage,
  feedingStage,
  formulaPer100Ml,
  kcalPerKg,
  outgrown,
  regimenTotals,
  requirements,
} from "../src/app/nutrition.ts";
import {
  emptyDoc,
  type AppData,
  type Food,
  type MilkFeeding,
} from "../src/app/types.ts";

function food(overrides: Partial<Food> = {}): Food {
  return {
    id: "porridge",
    name: "Porridge",
    amount: 150,
    unit: "g",
    per100: { kcal: 104, ironMg: 1.7, fatG: 3.7 },
    times: [],
    updatedAt: "2026-07-20T09:00:00.000Z",
    ...overrides,
  };
}

function docWith(foods: Food[], birthDate = "2026-01-01"): AppData {
  return {
    ...emptyDoc(),
    child: {
      name: "",
      birthDate,
      sex: "female",
      motherHeightCm: null,
      fatherHeightCm: null,
      updatedAt: "",
    },
    foods: Object.fromEntries(foods.map((f) => [f.id, f])),
    milk: {
      kind: "breast",
      formulaMlPerDay: null,
      formulaType: "infant",
      updatedAt: "2026-07-20T09:00:00.000Z",
    },
  };
}

describe("feedingStage", () => {
  it("keeps food out of the way before six months", () => {
    expect(feedingStage(30)).toBe("milkOnly");
    expect(feedingStage(130)).toBe("tastes");
    expect(feedingStage(183)).toBe("complementary");
  });
});

describe("kcalPerKg / breastMilkEnergyShare", () => {
  it("follow the FAO and WHO tables", () => {
    expect(kcalPerKg(7, "male")).toBe(79);
    expect(kcalPerKg(10, "female")).toBe(79);
    expect(kcalPerKg(18, "male")).toBeCloseTo(82.4);
    expect(breastMilkEnergyShare(7)).toBe(0.77);
    expect(breastMilkEnergyShare(10)).toBe(0.63);
    expect(breastMilkEnergyShare(15)).toBe(0.44);
  });
});

describe("requirements", () => {
  it("rest on the latest weight when there is one, else the reference", () => {
    const data = docWith([]);
    const ref = requirements(data, "2026-08-01", WEIGHT_FOR_AGE)!;
    expect(ref.weightSource).toBe("reference");
    expect(ref.weightKg).toBeGreaterThan(7);
    expect(ref.weightKg).toBeLessThan(8.5);
    const withWeight: AppData = {
      ...data,
      measurements: {
        a: {
          id: "a",
          date: "2026-07-20",
          weightKg: 8.4,
          lengthCm: null,
          headCm: null,
          updatedAt: "",
        },
      },
    };
    const measured = requirements(withWeight, "2026-08-01", WEIGHT_FOR_AGE)!;
    expect(measured.weightSource).toBe("measured");
    expect(measured.kcalPerDay).toBeCloseTo(78 * 8.4, 3);
    // Breastfed at seven months: the regimen is held to 23% of the day.
    expect(measured.targetKcal).toBeCloseTo(78 * 8.4 * 0.23, 3);
  });

  it("move the iron and fat targets at the first birthday", () => {
    const data = docWith([]);
    const before = requirements(data, "2026-12-01", WEIGHT_FOR_AGE)!;
    const after = requirements(data, "2027-02-01", WEIGHT_FOR_AGE)!;
    expect(before.ironMg).toBe(10);
    expect(after.ironMg).toBe(7);
    expect(before.fatE).toEqual({ min: 30, max: 45 });
    expect(after.fatE).toEqual({ min: 30, max: 40 });
    expect(before.saturatedMaxE).toBeNull();
    expect(after.saturatedMaxE).toBe(10);
  });

  it("are null before birth", () => {
    expect(
      requirements(docWith([], "2027-01-01"), "2026-08-01", WEIGHT_FOR_AGE),
    ).toBeNull();
  });
});

describe("regimenTotals", () => {
  it("scale each food by its daily amount and count what was not stated", () => {
    const totals = regimenTotals(
      [
        food(),
        food({
          id: "banana",
          name: "Banana",
          amount: 40,
          per100: { kcal: 95 },
        }),
      ],
      {
        kind: "breast",
        formulaMlPerDay: null,
        formulaType: "infant",
        updatedAt: "",
      },
    );
    expect(totals.kcal.sum).toBeCloseTo(104 * 1.5 + 95 * 0.4, 6);
    expect(totals.kcal.stated).toBe(2);
    expect(totals.ironMg.sum).toBeCloseTo(1.7 * 1.5, 6);
    expect(totals.ironMg.stated).toBe(1);
    expect(totals.ironMg.unstated).toBe(1);
  });

  it("count formula when the child gets it", () => {
    const totals = regimenTotals([], {
      kind: "formula",
      formulaMlPerDay: 600,
      formulaType: "infant",
      updatedAt: "",
    });
    expect(totals.kcal.sum).toBeCloseTo(66 * 6, 6);
    expect(totals.ironMg.sum).toBeCloseTo(0.4 * 6, 6);
  });

  it("count the product the parent said is in the bottle", () => {
    const totals = regimenTotals([], {
      kind: "formula",
      formulaMlPerDay: 600,
      formulaType: "followOn",
      updatedAt: "",
    });
    expect(totals.kcal.sum).toBeCloseTo(69 * 6, 6);
    expect(totals.ironMg.sum).toBeCloseTo(1.0 * 6, 6);
  });

  it("ignore millilitres recorded against a child who is not on bottles", () => {
    const totals = regimenTotals([], {
      kind: "breast",
      formulaMlPerDay: 600,
      formulaType: "followOn",
      updatedAt: "",
    });
    expect(totals.kcal.stated).toBe(0);
  });
});

describe("formulaPer100Ml", () => {
  it("separates the two products by the iron that separates them in law", () => {
    // Regulation (EU) 2016/127 floors infant formula at 0.3 mg iron per 100
    // kcal and follow-on formula at 0.6; the Swedish tins print 0.4 and 1.0
    // mg per 100 ml. Tillskottsnäring exists for this number.
    expect(formulaPer100Ml("infant").ironMg).toBe(0.4);
    expect(formulaPer100Ml("followOn").ironMg).toBe(1.0);
    expect(formulaPer100Ml("infant").kcal).toBe(66);
    expect(formulaPer100Ml("followOn").kcal).toBe(69);
    // Both carry the EU minimum DHA, which is 20 mg per 100 *kcal*.
    expect(formulaPer100Ml("infant").dhaG! * 1000).toBeCloseTo(0.2 * 66, 6);
    expect(formulaPer100Ml("followOn").dhaG! * 1000).toBeCloseTo(0.2 * 69, 6);
  });
});

describe("requirements, mixed feeding", () => {
  const measured = (milk: MilkFeeding): AppData => ({
    ...docWith([]),
    measurements: {
      a: {
        id: "a",
        date: "2026-07-20",
        weightKg: 8.4,
        lengthCm: null,
        headCm: null,
        updatedAt: "",
      },
    },
    milk,
  });
  const bottles = (
    kind: MilkFeeding["kind"],
    ml: number | null,
    formulaType: MilkFeeding["formulaType"] = "infant",
  ): MilkFeeding => ({
    kind,
    formulaMlPerDay: ml,
    formulaType,
    updatedAt: "2026-07-20T09:00:00.000Z",
  });

  it("counts the bottles inside the milk share, not on top of it", () => {
    const breastfed = requirements(
      measured(bottles("breast", null)),
      "2026-08-01",
      WEIGHT_FOR_AGE,
    )!;
    const mixed = requirements(
      measured(bottles("mixed", 400, "followOn")),
      "2026-08-01",
      WEIGHT_FOR_AGE,
    )!;
    // 400 ml of tillskottsnäring is 276 kcal of the day's milk.
    expect(mixed.formulaKcal).toBeCloseTo(69 * 4, 6);
    // Which is milk the child is not getting from the breast, so the target
    // rises by exactly what the bottles bring: the food side is held to the
    // same complementary figure as for a child who nurses for all of it.
    expect(mixed.targetKcal - breastfed.targetKcal).toBeCloseTo(
      mixed.formulaKcal,
      6,
    );
    expect(mixed.unmeasuredMilkKcal).toBeCloseTo(
      mixed.kcalPerDay * 0.77 - mixed.formulaKcal,
      6,
    );
  });

  it("reads enough formula as the formula-fed case", () => {
    // 900 ml of infant formula is more than the whole 77% milk share, so
    // there is no unmeasured breast milk left to set aside.
    const heavy = requirements(
      measured(bottles("mixed", 900)),
      "2026-08-01",
      WEIGHT_FOR_AGE,
    )!;
    expect(heavy.unmeasuredMilkKcal).toBe(0);
    expect(heavy.targetKcal).toBeCloseTo(heavy.kcalPerDay, 6);
  });

  it("leaves the breastfed, formula-fed and weaned cases where they were", () => {
    const at = (milk: MilkFeeding) =>
      requirements(measured(milk), "2026-08-01", WEIGHT_FOR_AGE)!;
    const breastfed = at(bottles("breast", null));
    expect(breastfed.targetKcal).toBeCloseTo(breastfed.kcalPerDay * 0.23, 6);
    for (const milk of [bottles("formula", 600), bottles("none", null)]) {
      const req = at(milk);
      expect(req.unmeasuredMilkKcal).toBe(0);
      expect(req.targetKcal).toBeCloseTo(req.kcalPerDay, 6);
    }
  });

  it("stops the bottles from covering a mixed-fed day on their own", () => {
    // The regression this model exists for: 400 ml of formula and no food at
    // all used to clear a target that had already been cut by the full
    // breast-milk share.
    const data = { ...measured(bottles("mixed", 400, "followOn")), foods: {} };
    const a = assess(data, "2026-08-01", WEIGHT_FOR_AGE)!;
    expect(a.energy.actual).toBeCloseTo(69 * 4, 6);
    expect(a.energy.target).toBeGreaterThan(69 * 4);
    expect(a.energy.status).toBe("low");
  });

  it("moves the iron line when the bottle is tillskottsnäring", () => {
    const ironOf = (milk: MilkFeeding) =>
      assess(measured(milk), "2026-08-01", WEIGHT_FOR_AGE)!.lines.find(
        (l) => l.key === "ironMg",
      )!.actual;
    // 600 ml a day, against the 10 mg the NNR2023 recommend at 7–11 months.
    expect(ironOf(bottles("formula", 600))).toBeCloseTo(2.4, 6);
    expect(ironOf(bottles("formula", 600, "followOn"))).toBeCloseTo(6.0, 6);
  });
});

describe("assess", () => {
  it("reads an empty regimen as unknown, not as zero", () => {
    const a = assess(docWith([]), "2026-08-01", WEIGHT_FOR_AGE)!;
    expect(a.empty).toBe(true);
    expect(a.energy.status).toBe("unknown");
  });

  it("covers the day when the regimen's energy reaches the target", () => {
    const data = docWith([food({ amount: 250 })]);
    const a = assess(data, "2026-08-01", WEIGHT_FOR_AGE)!;
    expect(a.energy.actual).toBeCloseTo(260, 6);
    expect(a.energy.target).toBeLessThan(200);
    expect(a.energy.status).toBe("covered");
  });

  it("reads a nutrient some foods didn't state as partial when short", () => {
    const data = docWith([
      food({ amount: 100 }),
      food({ id: "b", name: "Banana", amount: 100, per100: { kcal: 95 } }),
    ]);
    const a = assess(data, "2026-08-01", WEIGHT_FOR_AGE)!;
    const iron = a.lines.find((l) => l.key === "ironMg")!;
    expect(iron.status).toBe("partial");
    const vitD = a.lines.find((l) => l.key === "vitaminDUg")!;
    expect(vitD.status).toBe("unknown");
  });

  it("reads the fat share against the regimen's own energy", () => {
    const data = docWith([
      food({
        id: "oil",
        name: "Oil",
        amount: 10,
        per100: { kcal: 884, fatG: 100 },
      }),
      food({
        id: "b",
        name: "Banana",
        amount: 100,
        per100: { kcal: 95, fatG: 0.1 },
      }),
    ]);
    const a = assess(data, "2026-08-01", WEIGHT_FOR_AGE)!;
    const fat = a.lines.find((l) => l.key === "fatE")!;
    // 10.1 g fat × 9 / (88.4 + 95) kcal ≈ 49.6 E% — above the 45% ceiling.
    expect(fat.actual).toBeCloseTo(49.6, 0);
    expect(fat.status).toBe("high");
  });
});

describe("outgrown", () => {
  it("says so when the regimen covered the day it was last edited and not today", () => {
    // 150 g of porridge a day: enough for a breastfed six-month-old, short
    // for the same child at eleven months.
    const data = docWith([food({ amount: 170 })]);
    expect(assess(data, "2026-07-25", WEIGHT_FOR_AGE)!.energy.status).toBe(
      "covered",
    );
    expect(assess(data, "2026-12-01", WEIGHT_FOR_AGE)!.energy.status).toBe(
      "low",
    );
    expect(outgrown(data, "2026-12-01", WEIGHT_FOR_AGE)).toBe(true);
    expect(outgrown(data, "2026-07-25", WEIGHT_FOR_AGE)).toBe(false);
  });

  it("stays quiet for a regimen that was never enough", () => {
    const data = docWith([food({ amount: 20 })]);
    expect(outgrown(data, "2026-12-01", WEIGHT_FOR_AGE)).toBe(false);
  });

  it("has nothing to say before six months", () => {
    const early = docWith([
      food({ amount: 20, updatedAt: "2026-04-01T09:00:00.000Z" }),
    ]);
    expect(assess(early, "2026-05-01", WEIGHT_FOR_AGE)!.energy.status).toBe(
      "unknown",
    );
    expect(outgrown(early, "2026-12-01", WEIGHT_FOR_AGE)).toBe(false);
  });
});

// ── The day's shape ─────────────────────────────────────────────────────────
// `dayCoverage` is what the food view draws: the regimen's energy through the
// day against the line it is held to. The properties worth pinning are the
// ones a chart would hide — that an untimed food really is spread rather than
// dropped, that a food given twice contributes half at each sitting, and that
// the crossing minute is interpolated inside the segment that reaches the
// target rather than rounded to the nearest meal.

describe("dayCoverage", () => {
  const milk: MilkFeeding = {
    kind: "none",
    formulaMlPerDay: null,
    formulaType: "infant",
    updatedAt: "",
  };

  it("spreads an untimed food evenly across the default window", () => {
    // 100 g at 100 kcal/100 g = 100 kcal, no times.
    const cover = dayCoverage(
      [food({ amount: 100, per100: { kcal: 100 }, times: [] })],
      milk,
      100,
    );
    expect(cover.from).toBe(DAY_WINDOW_START_MIN);
    expect(cover.to).toBe(DAY_WINDOW_END_MIN);
    expect(cover.spreadKcal).toBeCloseTo(100, 6);
    expect(cover.meals).toEqual([]);
    expect(cover.points[0]).toEqual({ minutes: DAY_WINDOW_START_MIN, kcal: 0 });
    expect(cover.points.at(-1)!.kcal).toBeCloseTo(100, 6);
    // Half the window is half the day's energy, and the target is met at the
    // very end rather than at some earlier step.
    expect(cover.metAtMinutes).toBe(DAY_WINDOW_END_MIN);
  });

  it("steps at each time a food names, splitting the daily amount evenly", () => {
    const cover = dayCoverage(
      [
        food({
          amount: 100,
          per100: { kcal: 100 },
          times: ["08:00", "17:00"],
        }),
      ],
      milk,
      100,
    );
    expect(cover.spreadKcal).toBe(0);
    expect(cover.meals).toEqual([
      { minutes: 8 * 60, kcal: 50, names: ["Porridge"] },
      { minutes: 17 * 60, kcal: 50, names: ["Porridge"] },
    ]);
    // Two points per meal — the step's foot and its head.
    expect(cover.points.filter((p) => p.minutes === 8 * 60)).toEqual([
      { minutes: 480, kcal: 0 },
      { minutes: 480, kcal: 50 },
    ]);
    expect(cover.totalKcal).toBeCloseTo(100, 6);
    expect(cover.metAtMinutes).toBe(17 * 60);
  });

  it("gathers foods given at the same time into one meal", () => {
    const cover = dayCoverage(
      [
        food({
          id: "a",
          name: "Porridge",
          amount: 100,
          per100: { kcal: 100 },
          times: ["08:00"],
        }),
        food({
          id: "b",
          name: "Banana",
          amount: 50,
          per100: { kcal: 100 },
          times: ["08:00"],
        }),
      ],
      milk,
      150,
    );
    expect(cover.meals).toHaveLength(1);
    expect(cover.meals[0]!.kcal).toBeCloseTo(150, 6);
    expect(cover.meals[0]!.names).toEqual(["Porridge", "Banana"]);
  });

  it("interpolates the crossing inside the segment that reaches the target", () => {
    // 160 kcal spread across a 16-hour window is 10 kcal an hour, so a target
    // of 40 is reached four hours in — 10:00, not the window's end.
    const cover = dayCoverage(
      [food({ amount: 160, per100: { kcal: 100 }, times: [] })],
      milk,
      40,
    );
    expect(cover.metAtMinutes).toBeCloseTo(10 * 60, 6);
  });

  it("reports a day that never reaches the target", () => {
    const cover = dayCoverage(
      [food({ amount: 100, per100: { kcal: 100 }, times: ["12:00"] })],
      milk,
      400,
    );
    expect(cover.metAtMinutes).toBeNull();
    expect(cover.totalKcal).toBeCloseTo(100, 6);
    expect(cover.targetKcal).toBe(400);
  });

  it("widens the window around a time outside the waking day", () => {
    const cover = dayCoverage(
      [food({ amount: 100, per100: { kcal: 100 }, times: ["04:30", "23:30"] })],
      milk,
      100,
    );
    expect(cover.from).toBe(4 * 60 + 30);
    expect(cover.to).toBe(23 * 60 + 30);
  });

  it("counts the bottles as energy with no time on it", () => {
    // 200 ml of infant formula at 66 kcal per 100 ml.
    const cover = dayCoverage(
      [],
      { ...milk, kind: "formula", formulaMlPerDay: 200 },
      500,
    );
    expect(cover.spreadKcal).toBeCloseTo(132, 6);
    expect(cover.totalKcal).toBeCloseTo(132, 6);
    expect(cover.meals).toEqual([]);
  });
});

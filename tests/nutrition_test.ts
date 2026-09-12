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
  feedingStage,
  kcalPerKg,
  outgrown,
  regimenTotals,
  requirements,
} from "../src/app/nutrition.ts";
import { emptyDoc, type AppData, type Food } from "../src/app/types.ts";

function food(overrides: Partial<Food> = {}): Food {
  return {
    id: "porridge",
    name: "Porridge",
    amount: 150,
    unit: "g",
    per100: { kcal: 104, ironMg: 1.7, fatG: 3.7 },
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
      { kind: "breast", formulaMlPerDay: null, updatedAt: "" },
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
      updatedAt: "",
    });
    expect(totals.kcal.sum).toBeCloseTo(66 * 6, 6);
    expect(totals.ironMg.sum).toBeCloseTo(0.4 * 6, 6);
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

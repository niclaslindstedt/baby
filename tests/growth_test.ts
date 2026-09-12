// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The growth derivation: readings placed on the WHO standards, the trend
// read across them, the forecast projected from them, and the target height.
// Pinned to real WHO rows and real dates — nothing here touches the clock.

import { describe, expect, it } from "vitest";

import {
  HEAD_FOR_AGE,
  LENGTH_FOR_AGE,
  WEIGHT_FOR_AGE,
} from "../src/app/data/whoGrowth.ts";
import {
  adultHeightProjection,
  curveAtZ,
  forecast,
  heightCorrelationAt,
  lmsAt,
  normalCdf,
  readings,
  targetHeight,
  trend,
  valueAtZ,
  zScore,
  type GrowthStandards,
} from "../src/app/growth.ts";
import { emptyDoc, type AppData, type Measurement } from "../src/app/types.ts";

const STANDARDS: GrowthStandards = {
  weight: WEIGHT_FOR_AGE,
  length: LENGTH_FOR_AGE,
  head: HEAD_FOR_AGE,
};

function docWith(
  measurements: Measurement[],
  sex: "male" | "female" = "male",
): AppData {
  return {
    ...emptyDoc(),
    child: {
      name: "Test",
      birthDate: "2026-01-01",
      sex,
      motherHeightCm: 167,
      fatherHeightCm: 182,
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    measurements: Object.fromEntries(measurements.map((m) => [m.id, m])),
  };
}

function m(
  id: string,
  date: string,
  weightKg: number | null,
  lengthCm: number | null = null,
): Measurement {
  return {
    id,
    date,
    weightKg,
    lengthCm,
    headCm: null,
    updatedAt: `${date}T10:00:00.000Z`,
  };
}

describe("the standards", () => {
  it("carry the published medians at birth and one year", () => {
    expect(lmsAt(WEIGHT_FOR_AGE, "male", 0)?.M).toBeCloseTo(3.3464, 3);
    expect(lmsAt(WEIGHT_FOR_AGE, "male", 365.25)?.M).toBeCloseTo(9.6479, 3);
    expect(lmsAt(LENGTH_FOR_AGE, "female", 0)?.M).toBeCloseTo(49.1477, 3);
    expect(lmsAt(HEAD_FOR_AGE, "female", 0)?.M).toBeCloseTo(33.8787, 3);
  });

  it("interpolate between months and refuse ages outside the range", () => {
    const at6 = lmsAt(WEIGHT_FOR_AGE, "male", 6 * 30.4375)!.M;
    const at7 = lmsAt(WEIGHT_FOR_AGE, "male", 7 * 30.4375)!.M;
    const between = lmsAt(WEIGHT_FOR_AGE, "male", 6.5 * 30.4375)!.M;
    expect(between).toBeGreaterThan(at6);
    expect(between).toBeLessThan(at7);
    expect(lmsAt(WEIGHT_FOR_AGE, "male", -1)).toBeNull();
    expect(lmsAt(WEIGHT_FOR_AGE, "male", 61 * 30.4375)).toBeNull();
  });
});

describe("zScore / valueAtZ", () => {
  it("place the median at zero and invert exactly", () => {
    const lms = lmsAt(WEIGHT_FOR_AGE, "female", 180)!;
    expect(zScore(lms, lms.M)).toBeCloseTo(0, 9);
    for (const z of [-2.5, -1, 0.3, 2]) {
      expect(zScore(lms, valueAtZ(lms, z))).toBeCloseTo(z, 6);
    }
  });

  it("read a 9.65 kg boy at one year as on the median", () => {
    const lms = lmsAt(WEIGHT_FOR_AGE, "male", 365.25)!;
    expect(Math.abs(zScore(lms, 9.65))).toBeLessThan(0.01);
  });

  it("turn a z-score into the familiar percentile", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(-2)).toBeCloseTo(0.0228, 3);
  });
});

describe("readings", () => {
  it("place each recorded value at the child's age on that day", () => {
    const data = docWith([
      m("a", "2026-01-01", 3.35),
      m("b", "2026-07-02", 7.93, 67.6),
    ]);
    const weight = readings(data, STANDARDS, "weight");
    expect(weight).toHaveLength(2);
    expect(weight[0]!.ageDays).toBe(0);
    expect(Math.abs(weight[0]!.z!)).toBeLessThan(0.02);
    expect(weight[1]!.ageDays).toBe(182);
    expect(Math.abs(weight[1]!.z!)).toBeLessThan(0.05);
    const length = readings(data, STANDARDS, "length");
    expect(length).toHaveLength(1);
    expect(Math.abs(length[0]!.z!)).toBeLessThan(0.05);
  });

  it("are empty without a child", () => {
    expect(readings(emptyDoc(), STANDARDS, "weight")).toEqual([]);
  });
});

describe("trend", () => {
  it("needs a reading at least two months back to call anything", () => {
    const data = docWith([
      m("a", "2026-05-01", 6.5),
      m("b", "2026-05-15", 6.8),
    ]);
    const t = trend(readings(data, STANDARDS, "weight"))!;
    expect(t.verdict).toBe("steady");
    expect(t.reference).not.toBeNull();
  });

  it("calls a channel crossed when the z moves by two thirds of an SD", () => {
    const lmsA = lmsAt(WEIGHT_FOR_AGE, "male", 120)!;
    const lmsB = lmsAt(WEIGHT_FOR_AGE, "male", 240)!;
    const data = docWith([
      m("a", "2026-05-01", valueAtZ(lmsA, 0.2)),
      m("b", "2026-08-29", valueAtZ(lmsB, -0.7)),
    ]);
    const t = trend(readings(data, STANDARDS, "weight"))!;
    expect(t.verdict).toBe("down");
    expect(t.delta).toBeCloseTo(-0.9, 1);
  });

  it("reports a single reading as such", () => {
    const t = trend(
      readings(docWith([m("a", "2026-03-01", 5)]), STANDARDS, "weight"),
    )!;
    expect(t.verdict).toBe("single");
    expect(t.delta).toBeNull();
  });
});

describe("forecast", () => {
  it("follows the channel when the readings sit on one", () => {
    const series = [60, 90, 120, 150, 180].map((age, i) => {
      const lms = lmsAt(WEIGHT_FOR_AGE, "male", age)!;
      const date = new Date(Date.UTC(2026, 0, 1 + age))
        .toISOString()
        .slice(0, 10);
      return m(`r${i}`, date, valueAtZ(lms, -0.5));
    });
    const f = forecast(
      readings(docWith(series), STANDARDS, "weight"),
      WEIGHT_FOR_AGE,
      "male",
    )!;
    expect(f.zNow).toBeCloseTo(-0.5, 2);
    expect(Math.abs(f.driftPerMonth)).toBeLessThan(0.01);
    const last = f.points[f.points.length - 1]!;
    expect(last.z).toBeCloseTo(-0.5, 2);
    // The projected value sits on the −0.5 SD curve at that age.
    const lms = lmsAt(WEIGHT_FOR_AGE, "male", last.ageDays)!;
    expect(last.value).toBeCloseTo(valueAtZ(lms, -0.5), 2);
  });

  it("widens its bands with the horizon and nests them", () => {
    const series = [60, 120, 180].map((age, i) => {
      const lms = lmsAt(WEIGHT_FOR_AGE, "female", age)!;
      const date = new Date(Date.UTC(2026, 0, 1 + age))
        .toISOString()
        .slice(0, 10);
      return m(`r${i}`, date, valueAtZ(lms, 0.3));
    });
    const f = forecast(
      readings(docWith(series, "female"), STANDARDS, "weight"),
      WEIGHT_FOR_AGE,
      "female",
    )!;
    const first = f.points[0]!;
    const last = f.points[f.points.length - 1]!;
    const width = (p: typeof first, mass: number) => {
      const b = p.bands.find((x) => x.mass === mass)!;
      return b.upper - b.lower;
    };
    expect(width(last, 0.95)).toBeGreaterThan(width(first, 0.95));
    expect(width(last, 0.95)).toBeGreaterThan(width(last, 0.8));
    expect(width(last, 0.8)).toBeGreaterThan(width(last, 0.5));
  });

  it("damps a drift rather than extrapolating it forever", () => {
    // Dropping a full SD over four months.
    const series = [60, 90, 120, 150, 180].map((age, i) => {
      const lms = lmsAt(WEIGHT_FOR_AGE, "male", age)!;
      const date = new Date(Date.UTC(2026, 0, 1 + age))
        .toISOString()
        .slice(0, 10);
      return m(`r${i}`, date, valueAtZ(lms, 0.5 - i * 0.25));
    });
    const f = forecast(
      readings(docWith(series), STANDARDS, "weight"),
      WEIGHT_FOR_AGE,
      "male",
    )!;
    expect(f.driftPerMonth).toBeLessThan(0);
    const last = f.points[f.points.length - 1]!;
    // Four months on, a straight line would be at about −1.5 SD; the damped
    // projection stays well above that.
    expect(last.z).toBeGreaterThan(-1.3);
    expect(last.z).toBeLessThan(f.zNow);
  });

  it("is null with nothing to project from", () => {
    expect(forecast([], WEIGHT_FOR_AGE, "male")).toBeNull();
  });
});

describe("curveAtZ", () => {
  it("draws a rising median across the first year", () => {
    const pts = curveAtZ(LENGTH_FOR_AGE, "male", 0, 0, 365, 30);
    expect(pts[0]!.value).toBeCloseTo(49.88, 1);
    expect(pts[pts.length - 1]!.ageDays).toBe(365);
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i]!.value).toBeGreaterThan(pts[i - 1]!.value);
    }
  });
});

describe("targetHeight", () => {
  it("uses the Swedish regression per sex, with a ±10 cm interval", () => {
    const boy = targetHeight({
      name: "",
      birthDate: "2026-01-01",
      sex: "male",
      motherHeightCm: 166,
      fatherHeightCm: 180,
      updatedAt: "",
    })!;
    // x = 173 → 45.99 + 0.78 × 173 = 180.93
    expect(boy.cm).toBeCloseTo(180.93, 2);
    expect(boy.low).toBeCloseTo(170.93, 2);
    expect(boy.high).toBeCloseTo(190.93, 2);
    const girl = targetHeight({
      name: "",
      birthDate: "2026-01-01",
      sex: "female",
      motherHeightCm: 166,
      fatherHeightCm: 180,
      updatedAt: "",
    })!;
    // 37.85 + 0.75 × 173 = 167.6
    expect(girl.cm).toBeCloseTo(167.6, 2);
  });

  it("is null while a parent's height is unknown", () => {
    expect(
      targetHeight({
        name: "",
        birthDate: "2026-01-01",
        sex: "male",
        motherHeightCm: null,
        fatherHeightCm: 180,
        updatedAt: "",
      }),
    ).toBeNull();
  });
});

describe("adultHeightProjection", () => {
  const child = {
    name: "",
    birthDate: "2026-01-01",
    sex: "male" as const,
    motherHeightCm: 166,
    fatherHeightCm: 180,
    updatedAt: "",
  };

  it("keeps more of the channel the older the child", () => {
    expect(heightCorrelationAt(0)).toBeCloseTo(0.25, 6);
    expect(heightCorrelationAt(9)).toBeCloseTo(0.5, 6);
    expect(heightCorrelationAt(24)).toBeCloseTo(0.7, 6);
    expect(heightCorrelationAt(120)).toBeCloseTo(0.8, 6);
  });

  it("shrinks a tall channel toward the target and widens with youth", () => {
    const young = adultHeightProjection(child, 1.5, 6)!;
    const older = adultHeightProjection(child, 1.5, 36)!;
    // Both sit above the parental target (180.93) and below the raw channel
    // (180.4 + 1.5 × 6.6 = 190.3).
    expect(young.cm).toBeGreaterThan(180.93);
    expect(older.cm).toBeGreaterThan(young.cm);
    expect(older.cm).toBeLessThan(190.3);
    expect(young.high - young.low).toBeGreaterThan(older.high - older.low);
    expect(young.withParents).toBe(true);
  });

  it("regresses to the population mean without the parents", () => {
    const noParents = { ...child, motherHeightCm: null, fatherHeightCm: null };
    const p = adultHeightProjection(noParents, 0, 24)!;
    expect(p.cm).toBeCloseTo(180.4, 6);
    expect(p.withParents).toBe(false);
    expect(adultHeightProjection(child, null, 24)).toBeNull();
  });
});

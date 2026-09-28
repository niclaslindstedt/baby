// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// US units at the edge: a US phone reads and types pounds, ounces and inches;
// the document keeps kilograms and centimetres, and the WHO standards are
// computed in them unchanged.

import { describe, expect, it } from "vitest";

import { LENGTH_FOR_AGE, WEIGHT_FOR_AGE } from "../src/app/data/whoGrowth.ts";
import {
  formatHeight,
  formatLength,
  formatSpread,
  formatWeight,
  formatWeightEstimate,
  measurementValues,
  unitLabel,
} from "../src/app/format.ts";
import { curveAtZ, valueAtZ, lmsAt, zScore } from "../src/app/growth.ts";
import { localeFor } from "../src/app/locale.ts";
import type { Measurement } from "../src/app/types.ts";
import {
  cmToFtIn,
  displayScale,
  heightDraft,
  keepIfUnchanged,
  KG_PER_LB,
  kgToLbOz,
  kgToLbOzWhole,
  kgToQuarterLb,
  lbOzToKg,
  lengthDraft,
  parseHeight,
  parseLength,
  parseWeight,
  unitSystemFor,
  weightDraft,
} from "../src/app/units.ts";

const US = localeFor("en", ["en-US"]);
const GB = localeFor("en", ["en-GB"]);

describe("unitSystemFor", () => {
  it("is US units on a US phone in English, metric everywhere else", () => {
    expect(unitSystemFor(US)).toBe("us");
    expect(unitSystemFor(GB)).toBe("metric");
    expect(unitSystemFor(localeFor("sv", ["en-US"]))).toBe("metric");
    expect(unitSystemFor(localeFor("en", ["sv-SE"]))).toBe("metric");
    expect(unitSystemFor("not a tag!")).toBe("metric");
  });
});

describe("the conversions", () => {
  it("are the international definitions", () => {
    expect(lbOzToKg(1, 0)).toBe(0.454);
    expect(lbOzToKg(7, 8)).toBe(3.402);
    expect(kgToLbOz(3.402)).toEqual({ lb: 7, oz: 8 });
    expect(kgToLbOz(7.42)).toEqual({ lb: 16, oz: 5.7 });
    expect(cmToFtIn(175.26)).toEqual({ ft: 5, in: 9 });
  });

  it("never reads 16 ounces", () => {
    // 15 lb 15.97 oz rounds up to 16 lb 0 oz, not 15 lb 16 oz.
    expect(kgToLbOz(lbOzToKg(15, 15.97))).toEqual({ lb: 16, oz: 0 });
  });
});

describe("the form drafts", () => {
  it("round-trip a weight typed in pounds and ounces", () => {
    const kg = parseWeight({ main: "15", sub: "6" }, "us");
    expect(kg).toBe(6.974);
    expect(weightDraft(kg, "us")).toEqual({ main: "15", sub: "6" });
    expect(parseWeight({ main: "", sub: "12" }, "us")).toBe(0.34);
    expect(parseWeight({ main: "", sub: "" }, "us")).toBeNull();
  });

  it("round-trip a length typed in inches, to the tenth", () => {
    const cm = parseLength("26.5", "us");
    expect(cm).toBe(67.31);
    expect(lengthDraft(cm, "us")).toBe("26.5");
    expect(parseLength("26,5", "us")).toBe(67.31);
  });

  it("round-trip a parent's height in feet and inches", () => {
    const cm = parseHeight({ main: "5", sub: "9" }, "us");
    expect(cm).toBe(175.3);
    expect(heightDraft(cm, "us")).toEqual({ main: "5", sub: "9" });
    expect(parseHeight({ main: "", sub: "" }, "us")).toBeNull();
  });

  it("stay the plain metric field elsewhere", () => {
    expect(weightDraft(7.42, "metric")).toEqual({ main: "7.42", sub: "" });
    expect(parseWeight({ main: "7,42", sub: "" }, "metric")).toBe(7.42);
    expect(lengthDraft(68.5, "metric")).toBe("68.5");
    expect(parseLength("68,5", "metric")).toBe(68.5);
    expect(parseHeight({ main: "172", sub: "" }, "metric")).toBe(172);
  });

  it("save an untouched value exactly as stored", () => {
    // 7.42 kg opens as 16 lb 5.7 oz, which is 7.419 kg — a save that
    // changed nothing must not move the reading by that gram.
    const opened = weightDraft(7.42, "us");
    expect(parseWeight(opened, "us")).not.toBe(7.42);
    expect(keepIfUnchanged(7.42, opened, { ...opened }, 7.419)).toBe(7.42);
    expect(keepIfUnchanged(7.42, opened, { main: "16", sub: "8" }, 7.484)).toBe(
      7.484,
    );
    expect(keepIfUnchanged(68.5, "27", "27", 68.58)).toBe(68.5);
  });
});

describe("saying a measurement", () => {
  const reading: Measurement = {
    id: "m1",
    date: "2026-06-03",
    weightKg: 7.42,
    lengthCm: 68.5,
    headCm: 44,
    updatedAt: "2026-06-03T09:00:00.000Z",
  };

  it("reads pounds, ounces and inches on a US phone", () => {
    expect(measurementValues(reading, US)).toEqual([
      "16 lb 6 oz",
      "27.0 in",
      "17.3 in ↺",
    ]);
    expect(formatWeight(3.402, US)).toBe("7 lb 8 oz");
    expect(formatHeight(175.3, US)).toBe("5 ft 9 in");
    expect(formatSpread(10, US)).toBe("4 in");
  });

  it("keeps kilograms and centimetres elsewhere", () => {
    expect(measurementValues(reading, GB)).toEqual([
      "7.42 kg",
      "68.5 cm",
      "44.0 cm ↺",
    ]);
    expect(formatLength(68.5, "sv-SE")).toBe("68,5 cm");
    expect(formatHeight(175.3, GB)).toBe("175.3 cm");
    expect(formatSpread(10, GB)).toBe("10 cm");
  });

  it("labels each field with the unit it is typed in", () => {
    expect(unitLabel("weight", US)).toBe("lb, oz");
    expect(unitLabel("length", US)).toBe("in");
    expect(unitLabel("height", US)).toBe("ft, in");
    expect(unitLabel("weight", GB)).toBe("kg");
    expect(unitLabel("height", GB)).toBe("cm");
  });
});

describe("a weight said in pounds", () => {
  /** Pounds and ounces as kilograms, exactly — no gram rounding. */
  const exact = (lb: number, oz: number) => (lb + oz / 16) * KG_PER_LB;

  it("reads a reading to the whole ounce", () => {
    expect(formatWeight(lbOzToKg(17, 11.2), US)).toBe("17 lb 11 oz");
    expect(formatWeight(lbOzToKg(17, 11.6), US)).toBe("17 lb 12 oz");
    expect(kgToLbOzWhole(7.42)).toEqual({ lb: 16, oz: 6 });
  });

  it("carries half an ounce short of a pound into the pound", () => {
    expect(kgToLbOzWhole(exact(15, 15.5))).toEqual({ lb: 16, oz: 0 });
    expect(formatWeight(exact(15, 15.5), US)).toBe("16 lb 0 oz");
    expect(kgToLbOzWhole(exact(15, 15.4))).toEqual({ lb: 15, oz: 15 });
  });

  it("keeps a tenth of an ounce in the form, so a typed weight reads back", () => {
    expect(weightDraft(lbOzToKg(17, 11.2), "us")).toEqual({
      main: "17",
      sub: "11.2",
    });
  });

  it("says a forecast to the nearest quarter pound", () => {
    // The forecast that read "about 20 lb 1.2 oz (likely 18 lb 8.8 oz–
    // 21 lb 12.1 oz)": a band three pounds wide has no ounces in it.
    expect(formatWeightEstimate(exact(20, 1.2), US)).toBe("20 lb");
    expect(formatWeightEstimate(exact(18, 8.8), US)).toBe("18½ lb");
    expect(formatWeightEstimate(exact(21, 12.1), US)).toBe("21¾ lb");
    expect(formatWeightEstimate(exact(20, 3), US)).toBe("20¼ lb");
    expect(kgToQuarterLb(exact(19, 14.5))).toBe(20);
  });

  it("leaves a forecast in kilograms as a reading reads", () => {
    expect(formatWeightEstimate(9.12, GB)).toBe(formatWeight(9.12, GB));
    expect(formatWeightEstimate(9.12, GB)).toBe("9.12 kg");
  });
});

describe("the WHO standards, drawn in US units", () => {
  it("are the same curves, scaled", () => {
    // The boys' weight median at birth is 3.3464 kg (WHO 2006), which is
    // 7.38 lb; the chart's scale puts it there, and a reading's z-score is
    // the same whichever unit it was typed in.
    const birth = curveAtZ(WEIGHT_FOR_AGE, "male", 0, 0, 0)[0]!;
    expect(birth.value).toBeCloseTo(3.3464, 3);
    expect(birth.value * displayScale("weight", "us")).toBeCloseTo(7.378, 2);

    const lms = lmsAt(LENGTH_FOR_AGE, "female", 183)!;
    const typed = parseLength("26.5", "us")!;
    const z = zScore(lms, typed);
    expect(valueAtZ(lms, z) * displayScale("length", "us")).toBeCloseTo(
      26.5,
      6,
    );
    expect(displayScale("weight", "metric")).toBe(1);
  });
});

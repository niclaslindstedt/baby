// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// How a reading is said. A visit doesn't always take all three measurements
// — the clinic weighs and measures, a home scale only weighs, a nurse checks
// the head — so the line has to name what was taken and nothing else.

import { describe, expect, it } from "vitest";

import { formatElapsed, measurementValues } from "../src/app/format.ts";
import type { Measurement } from "../src/app/types.ts";

function reading(values: Partial<Measurement>): Measurement {
  return {
    id: "m1",
    date: "2026-06-03",
    weightKg: null,
    lengthCm: null,
    headCm: null,
    updatedAt: "2026-06-03T09:00:00.000Z",
    ...values,
  };
}

describe("measurementValues", () => {
  it("names the three in the order the clinic's card reads them", () => {
    expect(
      measurementValues(
        reading({ weightKg: 9.3, lengthCm: 80.5, headCm: 46 }),
        "en-GB",
      ),
    ).toEqual(["9.30 kg", "80.5 cm", "46.0 cm ↺"]);
  });

  it("leaves out what the visit didn't take", () => {
    expect(measurementValues(reading({ lengthCm: 80.5 }), "en-GB")).toEqual([
      "80.5 cm",
    ]);
    expect(measurementValues(reading({ weightKg: 7.42 }), "en-GB")).toEqual([
      "7.42 kg",
    ]);
    expect(measurementValues(reading({ headCm: 46 }), "en-GB")).toEqual([
      "46.0 cm ↺",
    ]);
  });

  it("gives nothing back for a reading that holds nothing", () => {
    expect(measurementValues(reading({}), "en-GB")).toEqual([]);
  });

  it("says the numbers the way the locale writes them", () => {
    expect(
      measurementValues(reading({ weightKg: 7.42, lengthCm: 68.5 }), "sv-SE"),
    ).toEqual(["7,42 kg", "68,5 cm"]);
  });
});

describe("formatElapsed", () => {
  it("reads like a stopwatch: minutes and seconds, then hours in front", () => {
    expect(formatElapsed(0)).toBe("00:00");
    expect(formatElapsed(65_000)).toBe("01:05");
    expect(formatElapsed((1 * 3600 + 23 * 60 + 45) * 1000)).toBe("1:23:45");
    expect(formatElapsed(10 * 3600 * 1000 + 999)).toBe("10:00:00");
    expect(formatElapsed(-5_000)).toBe("00:00");
  });
});

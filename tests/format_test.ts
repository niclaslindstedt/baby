// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// How a reading is said. A visit doesn't always take all three measurements
// — the clinic weighs and measures, a home scale only weighs, a nurse checks
// the head — so the line has to name what was taken and nothing else.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  formatAxisHour,
  formatElapsed,
  formatMinuteOfDay,
  formatTimeOfDay,
  hourParts,
  isTwelveHour,
  measurementValues,
} from "../src/app/format.ts";
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

// The clock a time of day is written in is the locale's, not the app's: a US
// phone reads the food chips, the coverage readout, the chart axes and the
// dial on a 12-hour clock, and Sweden (and a Swedish phone reading English,
// which falls back to en-GB) keeps the 24-hour one. `\s` rather than a space
// before AM/PM, because ICU writes a narrow no-break space there.
describe("the clock a time of day is written in", () => {
  it("is 12-hour on a US phone and 24-hour in Sweden and Britain", () => {
    expect(isTwelveHour("en-US")).toBe(true);
    expect(isTwelveHour("en-GB")).toBe(false);
    expect(isTwelveHour("sv-SE")).toBe(false);
  });

  it("writes a food's usual time in it", () => {
    expect(formatTimeOfDay("06:00", "en-US")).toMatch(/^6:00\sAM$/);
    expect(formatTimeOfDay("14:00", "en-US")).toMatch(/^2:00\sPM$/);
    expect(formatTimeOfDay("12:00", "en-US")).toMatch(/^12:00\sPM$/);
    expect(formatTimeOfDay("14:00", "sv-SE")).toBe("14:00");
    expect(formatTimeOfDay("14:00", "en-GB")).toBe("14:00");
  });

  it("writes a food's time as the tap times elsewhere are written", () => {
    for (const locale of ["en-US", "en-GB", "sv-SE"]) {
      const tap = new Date(2026, 8, 28, 8, 0).toISOString();
      expect(formatTimeOfDay("08:00", locale)).toBe(
        new Intl.DateTimeFormat(locale, {
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(tap)),
      );
    }
  });

  it("shows a time that is not HH:MM as it is", () => {
    expect(formatTimeOfDay("noon", "en-US")).toBe("noon");
  });

  it("writes the moment a day's food covers it in it", () => {
    expect(formatMinuteOfDay(17 * 60 + 30, "en-US")).toMatch(/^5:30\sPM$/);
    expect(formatMinuteOfDay(17 * 60 + 30, "sv-SE")).toBe("17:30");
    expect(formatMinuteOfDay(0, "en-US")).toMatch(/^12:00\sAM$/);
  });

  it("labels a chart's hours in it, midnight ending the day included", () => {
    expect([0, 6, 12, 18, 24].map((h) => formatAxisHour(h, "en-US"))).toEqual([
      "12 AM",
      "6 AM",
      "12 PM",
      "6 PM",
      "12 AM",
    ]);
    expect([0, 6, 12, 18, 24].map((h) => formatAxisHour(h, "sv-SE"))).toEqual([
      "00",
      "06",
      "12",
      "18",
      "24",
    ]);
  });

  it("numbers the dial in it, the half of the day beside the numeral", () => {
    const us = [0, 2, 6, 12, 14, 18, 22].map((h) => hourParts(h, "en-US"));
    expect(us.map((p) => p.numeral)).toEqual([
      "12",
      "2",
      "6",
      "12",
      "2",
      "6",
      "10",
    ]);
    expect(us.map((p) => p.period)).toEqual([
      "AM",
      "AM",
      "AM",
      "PM",
      "PM",
      "PM",
      "PM",
    ]);
    // A 24-hour dial is numbered as it always was: 0 at the top, 12 below.
    expect(hourParts(0, "sv-SE")).toEqual({ numeral: "0", period: null });
    expect(hourParts(14, "en-GB")).toEqual({ numeral: "14", period: null });
  });
});

describe("the components", () => {
  const app = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "app");

  it("never spell an hour out themselves, so every clock follows the locale", () => {
    for (const file of readdirSync(app).filter((f) => f.endsWith(".tsx"))) {
      const source = readFileSync(join(app, file), "utf8");
      expect(source, file).not.toMatch(/String\(h\)\.padStart/);
      expect(source, file).not.toMatch(/times\.join\(/);
    }
  });
});

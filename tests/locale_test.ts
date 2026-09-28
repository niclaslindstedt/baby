// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// One locale for every date: the language picks the words, the device the
// formats. The growth chart's readout once said "Sep 21" beside a list that
// said "21 Sept", because it formatted in the runtime's default while
// everything else named en-GB; now both take `localeFor`'s tag.

import { describe, expect, it } from "vitest";

import { formatClock, formatDay, formatDayYear } from "../src/app/format.ts";
import { DEFAULT_ENGLISH, localeFor } from "../src/app/locale.ts";

describe("localeFor", () => {
  it("is Sweden's formats for Swedish, whatever the device", () => {
    expect(localeFor("sv", ["en-US"])).toBe("sv-SE");
    expect(localeFor("sv", [])).toBe("sv-SE");
  });

  it("follows the device's own English", () => {
    expect(localeFor("en", ["en-US"])).toBe("en-US");
    expect(localeFor("en", ["en-GB"])).toBe("en-GB");
    expect(localeFor("en", ["sv-SE", "en-AU"])).toBe("en-AU");
    expect(localeFor("en", ["en-Latn-US"])).toBe("en-US");
  });

  it("keeps the British formats when the device names no English region", () => {
    expect(localeFor("en", ["sv-SE"])).toBe(DEFAULT_ENGLISH);
    expect(localeFor("en", ["en"])).toBe(DEFAULT_ENGLISH);
    expect(localeFor("en", [])).toBe(DEFAULT_ENGLISH);
    expect(localeFor("en", ["not a tag!"])).toBe(DEFAULT_ENGLISH);
  });
});

describe("a date, in the locale", () => {
  it("reads the US way on a US phone and the British way on a British one", () => {
    const us = localeFor("en", ["en-US"]);
    const gb = localeFor("en", ["en-GB"]);
    expect(formatDay("2026-09-21", us)).toBe("Sep 21");
    expect(formatDay("2026-09-21", gb)).toBe("21 Sept");
    expect(formatDayYear("2026-09-21", us)).toBe("Sep 21, 2026");
    expect(formatDayYear("2026-09-21", gb)).toBe("21 Sept 2026");
  });

  it("tells the time on the device's clock", () => {
    const iso = new Date(2026, 8, 21, 21, 3).toISOString();
    expect(formatClock(iso, localeFor("en", ["en-US"]))).toMatch(/^9:03\s?PM$/);
    expect(formatClock(iso, localeFor("en", ["en-GB"]))).toBe("21:03");
    expect(formatClock(iso, localeFor("sv", ["en-US"]))).toBe("21:03");
  });
});

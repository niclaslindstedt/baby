// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Age arithmetic: days for the tables, calendar months for the schedule, and
// the parts a parent says out loud.

import { describe, expect, it } from "vitest";

import {
  ageInDays,
  ageInMonths,
  ageParts,
  completedMonths,
} from "../src/app/age.ts";

describe("age", () => {
  it("counts days and WHO months", () => {
    expect(ageInDays("2026-01-15", "2026-09-12")).toBe(240);
    expect(ageInMonths("2026-01-15", "2026-09-12")).toBeCloseTo(
      240 / 30.4375,
      6,
    );
    expect(ageInDays("2026-01-15", "2026-01-01")).toBe(-14);
  });

  it("counts calendar months the way a birthday does", () => {
    expect(completedMonths("2026-01-15", "2026-04-14")).toBe(2);
    expect(completedMonths("2026-01-15", "2026-04-15")).toBe(3);
    expect(completedMonths("2026-01-31", "2026-02-28")).toBe(1);
    expect(completedMonths("2026-01-15", "2025-12-01")).toBe(0);
  });

  it("splits an age into years, months, weeks and days", () => {
    expect(ageParts("2026-01-15", "2026-09-12")).toEqual({
      years: 0,
      months: 7,
      weeks: 4,
      days: 0,
      totalDays: 240,
    });
    expect(ageParts("2024-03-10", "2026-09-12")).toMatchObject({
      years: 2,
      months: 6,
      days: 2,
    });
  });
});

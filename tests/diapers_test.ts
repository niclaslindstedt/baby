// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The diaper counts: per day in local time, wet and dirty, and the daily
// series the chart draws with its zero days present.

import { describe, expect, it } from "vitest";

import {
  assessDiapers,
  changesOn,
  dailyCounts,
  dayOfChange,
  diapersOn,
  hoursSinceDirty,
  lastChange,
  normFor,
  recentByDay,
  recentCounts,
} from "../src/app/diapers.ts";
import { emptyDoc, type AppData, type DiaperChange } from "../src/app/types.ts";

/** A change at a local wall-clock time on a day — the way a tap records it. */
function at(
  day: string,
  hour: number,
  kind: DiaperChange["kind"],
  id = `${day}-${hour}`,
): DiaperChange {
  const [y, m, d] = day.split("-").map(Number);
  return { id, kind, at: new Date(y!, m! - 1, d!, hour, 0, 0).toISOString() };
}

function docWith(changes: DiaperChange[]): AppData {
  return {
    ...emptyDoc(),
    diapers: Object.fromEntries(changes.map((c) => [c.id, c])),
  };
}

describe("diapers", () => {
  it("count a day's changes as wet and dirty", () => {
    const data = docWith([
      at("2026-09-11", 7, "pee"),
      at("2026-09-11", 10, "both"),
      at("2026-09-11", 14, "poo"),
      at("2026-09-11", 23, "pee"),
      at("2026-09-12", 1, "pee"),
    ]);
    expect(dayOfChange(at("2026-09-11", 23, "pee"))).toBe("2026-09-11");
    const c = diapersOn(data, "2026-09-11");
    expect(c).toMatchObject({
      pee: 2,
      poo: 1,
      both: 1,
      wet: 3,
      dirty: 2,
      total: 4,
    });
    expect(changesOn(data, "2026-09-11")).toHaveLength(4);
    expect(changesOn(data, "2026-09-11")[0]!.id).toBe("2026-09-11-23");
  });

  it("give every day in the window a row, zeros included", () => {
    const data = docWith([
      at("2026-09-10", 9, "pee"),
      at("2026-09-12", 9, "both"),
    ]);
    const series = dailyCounts(data, "2026-09-12", 4);
    expect(series.map((s) => s.day)).toEqual([
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
    ]);
    expect(series.map((s) => s.total)).toEqual([0, 1, 0, 1]);
  });

  it("find the latest change", () => {
    const data = docWith([
      at("2026-09-10", 9, "pee"),
      at("2026-09-12", 9, "both"),
    ]);
    expect(lastChange(data)?.id).toBe("2026-09-12-9");
    expect(lastChange(emptyDoc())).toBeNull();
  });
});

describe("norms", () => {
  it("ramp through the first days and settle at the Swedish floor", () => {
    expect(normFor(0)?.minWet).toBe(1);
    expect(normFor(3)?.minWet).toBe(4);
    expect(normFor(10)?.minWet).toBe(6);
    expect(normFor(100)?.minWet).toBe(5);
    expect(normFor(400)?.minWet).toBe(4);
    expect(normFor(-1)).toBeNull();
  });

  it("read the last 24 hours, not the calendar day", () => {
    const now = new Date(2026, 8, 12, 10, 0, 0);
    const data = docWith([
      at("2026-09-11", 12, "pee", "a"),
      at("2026-09-11", 18, "both", "b"),
      at("2026-09-11", 23, "pee", "c"),
      at("2026-09-12", 7, "pee", "d"),
      at("2026-09-11", 9, "pee", "e"), // 25 hours ago — outside the window
    ]);
    expect(recentCounts(data, now)).toEqual({ wet: 4, dirty: 1, total: 4 });
    expect(hoursSinceDirty(data, now)).toBeCloseTo(16, 6);
  });

  it("flag a thin day for a two-month-old and a long gap for a formula-fed one", () => {
    const now = new Date(2026, 8, 12, 10, 0, 0);
    const data = docWith([
      at("2026-09-11", 12, "pee", "a"),
      at("2026-09-12", 7, "pee", "b"),
      at("2026-09-08", 7, "poo", "c"),
    ]);
    const a = assessDiapers(data, 60, now, false)!;
    expect(a.fewWet).toBe(true);
    expect(a.norm.minWet).toBe(5);
    // Formula-fed at two months: the age band sets no gap limit at all.
    expect(a.longDirtyGap).toBe(false);
    const older = assessDiapers(data, 200, now, false)!;
    expect(older.dirtyGapLimitHours).toBe(96);
    expect(older.longDirtyGap).toBe(true);
    // Breastfed: the gap is not a signal until two weeks.
    const breastfed = assessDiapers(data, 200, now, true)!;
    expect(breastfed.dirtyGapLimitHours).toBe(14 * 24);
    expect(breastfed.longDirtyGap).toBe(false);
  });

  it("stay quiet on an empty log", () => {
    const a = assessDiapers(emptyDoc(), 60, new Date(2026, 8, 12, 10), true)!;
    expect(a.tooEarly).toBe(true);
    expect(a.fewWet).toBe(false);
    expect(a.longDirtyGap).toBe(false);
  });
});

// The list the Diapers tab shows: a bounded window, newest first on both
// axes, and no rows for days that saw nothing.
describe("recentByDay", () => {
  const data = docWith([
    at("2026-09-12", 7, "pee"),
    at("2026-09-12", 19, "both"),
    at("2026-09-10", 9, "poo"),
    // Outside a seven-day window ending on the 12th (which reaches the 6th).
    at("2026-09-04", 9, "pee"),
  ]);

  it("groups the window's changes by day, newest day first", () => {
    const days = recentByDay(data, "2026-09-12", 7);
    expect(days.map((d) => d.day)).toEqual(["2026-09-12", "2026-09-10"]);
    // Newest change first inside a day, so the row a mistap just wrote is
    // the first one to hand.
    expect(days[0]!.changes.map((c) => c.id)).toEqual([
      "2026-09-12-19",
      "2026-09-12-7",
    ]);
  });

  it("drops days with nothing logged, and anything older than the window", () => {
    const days = recentByDay(data, "2026-09-12", 7);
    expect(days).toHaveLength(2);
    expect(days.flatMap((d) => d.changes).map((c) => c.id)).not.toContain(
      "2026-09-04-9",
    );
    // Widen the window and the older change comes back.
    expect(recentByDay(data, "2026-09-12", 30).map((d) => d.day)).toEqual([
      "2026-09-12",
      "2026-09-10",
      "2026-09-04",
    ]);
  });

  it("is empty for a log with nothing in the window at all", () => {
    expect(recentByDay(emptyDoc(), "2026-09-12", 7)).toEqual([]);
    expect(recentByDay(data, "2026-09-30", 7)).toEqual([]);
  });
});

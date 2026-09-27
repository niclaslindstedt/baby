// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The 24-hour dial's arithmetic: where a time of day sits on the face, which
// time a finger is over, and what a drag does to a span — the ends landing
// on five minutes, stopping at now, and running on past midnight into the
// next day or the one before without a date ever being asked for.

import { describe, expect, it } from "vitest";

import {
  angleOf,
  arcPath,
  dragRange,
  minuteAtPoint,
  minuteOfDay,
  pointAt,
  shiftDays,
  snapInstant,
  wrapDelta,
} from "../src/app/dial.ts";

/** A local wall-clock instant: `day` at `h:m`, `h` past 24 running into the
 *  next morning. */
function at(day: string, h: number, m = 0): number {
  const [y, mo, d] = day.split("-").map(Number);
  return new Date(y!, mo! - 1, d!, h, m).getTime();
}

describe("the face", () => {
  it("puts midnight at the top, six on the right and noon at the bottom", () => {
    expect(angleOf(0)).toBe(0);
    const six = pointAt(150, 150, 100, 6 * 60);
    expect(six.x).toBeCloseTo(250);
    expect(six.y).toBeCloseTo(150);
    const noon = pointAt(150, 150, 100, 12 * 60);
    expect(noon.x).toBeCloseTo(150);
    expect(noon.y).toBeCloseTo(250);
  });

  it("reads back the time under a point", () => {
    for (const minute of [0, 90, 6 * 60, 13 * 60 + 25, 21 * 60 + 30]) {
      const p = pointAt(150, 150, 120, minute);
      expect(minuteAtPoint(150, 150, p.x, p.y)).toBeCloseTo(minute, 6);
    }
  });

  it("reads an instant as local minutes past midnight", () => {
    expect(minuteOfDay(at("2026-09-27", 21, 30))).toBe(21 * 60 + 30);
    expect(minuteOfDay(at("2026-09-27", 0, 0))).toBe(0);
  });

  it("goes the short way round across midnight", () => {
    expect(wrapDelta(23 * 60 + 50, 10)).toBe(20);
    expect(wrapDelta(10, 23 * 60 + 50)).toBe(-20);
    expect(wrapDelta(6 * 60, 18 * 60)).toBe(720);
  });

  it("draws an arc the long way round when the span is over half a day", () => {
    // 21:30 to 07:00: nine and a half hours, the large-arc flag off.
    expect(arcPath(150, 150, 120, 21 * 60 + 30, 7 * 60)).toMatch(/ 0 0 1 /);
    // 19:00 to 08:00: thirteen hours, the large-arc flag on.
    expect(arcPath(150, 150, 120, 19 * 60, 8 * 60)).toMatch(/ 0 1 1 /);
    expect(arcPath(150, 150, 120, 60, 60)).toBe("");
  });
});

describe("a drag", () => {
  const night = { start: at("2026-09-26", 21, 30), end: at("2026-09-27", 7) };
  const now = at("2026-09-27", 12, 44);

  it("moves one end on the five-minute grid", () => {
    // The wake handle dragged 17 minutes later lands on 7:15.
    expect(dragRange(night, "end", 17, { now })).toEqual({
      start: night.start,
      end: at("2026-09-27", 7, 15),
    });
    // The bedtime handle dragged 42 minutes earlier lands on 20:50.
    expect(dragRange(night, "start", -42, { now })).toEqual({
      start: at("2026-09-26", 20, 50),
      end: night.end,
    });
  });

  it("carries an end past midnight into the day before", () => {
    // Bedtime dragged from 21:30 round past 0 to 1:00 — the same night, not
    // the next evening.
    expect(dragRange(night, "start", 3.5 * 60, { now }).start).toBe(
      at("2026-09-27", 1, 0),
    );
  });

  it("moves the whole sleep with the arc, keeping its length", () => {
    const moved = dragRange(night, "both", -60, { now });
    expect(moved).toEqual({
      start: at("2026-09-26", 20, 30),
      end: at("2026-09-27", 6, 0),
    });
  });

  it("stops at now, and never lets the ends cross or wrap a whole turn", () => {
    const nap = { start: at("2026-09-27", 11, 0), end: at("2026-09-27", 12) };
    expect(dragRange(nap, "end", 120, { now }).end).toBe(now);
    expect(dragRange(nap, "both", 120, { now })).toEqual({
      start: now - 60 * 60_000,
      end: now,
    });
    // The end dragged back past the start stops five minutes after it.
    expect(dragRange(nap, "end", -90, { now }).end).toBe(
      at("2026-09-27", 11, 5),
    );
    // The start dragged back a whole day stops short of a full turn.
    expect(dragRange(nap, "start", -24 * 60, { now }).start).toBe(
      at("2026-09-26", 12, 5),
    );
  });

  it("steps a day by the calendar, so the wall clock reads the same", () => {
    // Across the end of summer time in Sweden (25 October 2026), where a
    // day is 25 hours long, a 21:30 stays a 21:30.
    const before = at("2026-10-24", 21, 30);
    expect(minuteOfDay(shiftDays(before, 1))).toBe(21 * 60 + 30);
    expect(snapInstant(at("2026-09-27", 7, 2), 5)).toBe(at("2026-09-27", 7, 0));
  });
});

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The "when?" sheet's arithmetic: the lags it offers, which of them a lower
// bound rules out, where its dial opens, and where a drag on the dial may
// land — on five minutes, never past now, never before the bound, never a
// whole day back.

import { describe, expect, it } from "vitest";

import {
  earliestOnGrid,
  LAGS,
  lagMoment,
  whenAllowed,
  whenDialStart,
  whenDrag,
  WHEN_REACH_MINUTES,
} from "../src/app/when.ts";

/** A local wall-clock instant: `day` at `h:m`, `h` past 24 running into the
 *  next morning. */
function at(day: string, h: number, m = 0, s = 0): number {
  const [y, mo, d] = day.split("-").map(Number);
  return new Date(y!, mo! - 1, d!, h, m, s).getTime();
}

describe("the lags", () => {
  it("offers five minutes to an hour, shortest first", () => {
    expect([...LAGS]).toEqual([5, 10, 15, 30, 45, 60]);
  });

  it("reads a lag back from the tap, to the second", () => {
    expect(lagMoment(at("2026-09-28", 12, 45, 20), 15)).toBe(
      at("2026-09-28", 12, 30, 20),
    );
    // Just after midnight, an hour ago is last night.
    expect(lagMoment(at("2026-09-28", 0, 20), 60)).toBe(
      at("2026-09-27", 23, 20),
    );
  });

  it("rules out what the bound or the clock would refuse", () => {
    const now = at("2026-09-28", 12, 45);
    // Asleep since 12:25: a wake 15 minutes ago is fine, 30 is not.
    const since = at("2026-09-28", 12, 25) + 1;
    expect(whenAllowed(lagMoment(now, 15), now, since)).toBe(true);
    expect(whenAllowed(lagMoment(now, 30), now, since)).toBe(false);
    // The bound itself is allowed; the future never is.
    expect(whenAllowed(since, now, since)).toBe(true);
    expect(whenAllowed(now + 1, now, null)).toBe(false);
    // Nor anything a whole day back, which the dial can't draw.
    expect(whenAllowed(now - WHEN_REACH_MINUTES * 60_000, now, null)).toBe(
      true,
    );
    expect(whenAllowed(now - 24 * 3_600_000, now, null)).toBe(false);
  });
});

describe("the dial", () => {
  it("opens an hour and a half back, on the grid", () => {
    expect(whenDialStart(at("2026-09-28", 12, 47), null)).toBe(
      at("2026-09-28", 11, 15),
    );
  });

  it("opens no earlier than the bound, rounded up to the grid", () => {
    const now = at("2026-09-28", 12, 47);
    // Asleep since 12:02: the first mark after it is 12:05.
    const since = at("2026-09-28", 12, 2) + 1;
    expect(earliestOnGrid(since, now)).toBe(at("2026-09-28", 12, 5));
    expect(whenDialStart(now, since)).toBe(at("2026-09-28", 12, 5));
    // A bound already on the grid stays where it is.
    expect(earliestOnGrid(at("2026-09-28", 10, 0), now)).toBe(
      at("2026-09-28", 10, 0),
    );
  });

  it("opens at now when no mark between the bound and now will do", () => {
    const now = at("2026-09-28", 12, 47);
    const since = at("2026-09-28", 12, 46);
    expect(earliestOnGrid(since, now)).toBeNull();
    expect(whenDialStart(now, since)).toBe(now);
  });

  it("lands a drag on five minutes and stops at now", () => {
    const now = at("2026-09-28", 12, 47);
    const origin = at("2026-09-28", 11, 15);
    expect(whenDrag(origin, -23, now, null)).toBe(at("2026-09-28", 10, 50));
    expect(whenDrag(origin, 12, now, null)).toBe(at("2026-09-28", 11, 25));
    expect(whenDrag(origin, 200, now, null)).toBe(now);
  });

  it("runs back past midnight into yesterday", () => {
    const now = at("2026-09-28", 0, 40);
    expect(whenDrag(at("2026-09-28", 0, 10), -30, now, null)).toBe(
      at("2026-09-27", 23, 40),
    );
  });

  it("stops at the bound and at a day's reach", () => {
    const now = at("2026-09-28", 12, 47);
    const since = at("2026-09-28", 11, 2) + 1;
    expect(whenDrag(at("2026-09-28", 11, 30), -60, now, since)).toBe(
      at("2026-09-28", 11, 5),
    );
    // A day less five minutes back from 12:47 is 12:52 yesterday; the
    // first mark on the grid after it is 12:55.
    expect(whenDrag(at("2026-09-28", 11, 30), -3000, now, null)).toBe(
      at("2026-09-27", 12, 55),
    );
  });
});

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// When a tapped thing happened: the arithmetic behind the "when?" sheet
// every logging button opens (`WhenModal.tsx`). A diaper is noticed on the
// changing table and a sleep in a pram, and the phone comes out later — so
// after the tap that says *what*, the sheet asks *when*: now, one of the
// usual lags, or any moment in the last day on the dial.
//
// A caller may bound the answer from below — a wake can't come before the
// sleep began — and every option the sheet offers is read against that
// bound before it is shown, so a time that can't be right is never offered
// rather than refused after the tap. Pure and clock-free: `now` is a
// parameter.

import { snapInstant } from "./dial.ts";

const MINUTE = 60_000;

/** The lags the sheet offers as one tap each, in minutes before the tap. */
export const LAGS = [5, 10, 15, 30, 45, 60] as const;

/** The grid the dial lands on, in minutes. */
export const WHEN_STEP = 5;

/** How far back the dial reaches: a day, less a step, so the arc from the
 *  picked time to now is never a whole turn the face can't tell from
 *  nothing. */
export const WHEN_REACH_MINUTES = 24 * 60 - WHEN_STEP;

/** The moment `minutes` before `tap`. */
export function lagMoment(tap: number, minutes: number): number {
  return tap - minutes * MINUTE;
}

/** Whether `at` can be the answer: not in the future, not before `earliest`
 *  (inclusive), and within the dial's reach. */
export function whenAllowed(
  at: number,
  now: number,
  earliest: number | null,
): boolean {
  if (at > now) return false;
  if (at < now - WHEN_REACH_MINUTES * MINUTE) return false;
  return earliest === null || at >= earliest;
}

/**
 * The earliest time on the dial's grid that is still allowed — `earliest`
 * rounded *up* to the next step, so the handle stops on the first mark
 * that passes, never one just short of it. Null when nothing on the grid
 * between `earliest` and `now` does.
 */
export function earliestOnGrid(
  earliest: number | null,
  now: number,
): number | null {
  const reach = now - WHEN_REACH_MINUTES * MINUTE;
  const floor = Math.max(earliest ?? reach, reach);
  const grid = WHEN_STEP * MINUTE;
  const first = Math.ceil(floor / grid) * grid;
  return first <= now ? first : null;
}

/**
 * Where the dial opens: an hour and a half back, on the grid — the first
 * time past the longest lag the sheet already offers, since a parent who
 * turns to the dial wants something further back than those. Never before
 * `earliest`; at `now` itself when even that is too early.
 */
export function whenDialStart(now: number, earliest: number | null): number {
  const grid = WHEN_STEP * MINUTE;
  const guess = Math.floor(now / grid) * grid - 90 * MINUTE;
  const first = earliestOnGrid(earliest, now);
  if (first === null) return now;
  return Math.max(guess, first);
}

/**
 * The dial's value after a drag: `origin` moved `delta` minutes round the
 * face (the sum of `wrapDelta`s, so it can run past midnight), on the grid,
 * held between the earliest allowed time and `now`.
 */
export function whenDrag(
  origin: number,
  delta: number,
  now: number,
  earliest: number | null,
): number {
  const moved = snapInstant(origin + delta * MINUTE, WHEN_STEP);
  const first = earliestOnGrid(earliest, now);
  if (first === null) return now;
  return Math.min(Math.max(moved, first), now);
}

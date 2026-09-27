// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The 24-hour dial: the one clock face the app draws a day on, and the
// arithmetic behind dragging a span around it.
//
// Midnight at the top and noon at the bottom, one turn a day, clockwise —
// the face the phone's own bedtime alarm uses, so a parent who has set that
// already knows how to read and drag this. A span is two instants; the dial
// shows them as an arc from the first to the second, and a drag moves one
// end, or both at once, by however far the finger travelled round the face.
//
// A drag is read as a *change* in angle, never as an absolute position: the
// finger's travel since the last move, wrapped into half a turn either way,
// added up. That is what lets an end be dragged past midnight into the next
// day (or back into the previous one) without the date ever being asked for,
// and why the arc never jumps when a finger crosses the top of the face.
//
// Pure and clock-free like the domain modules: `now` is a parameter, and
// every instant is milliseconds since the epoch read in local time. The
// components that draw the dial (`ClockDial.tsx`) and drag it
// (`SleepClock.tsx`) hold no arithmetic of their own.

export const MINUTES_PER_DAY = 24 * 60;
const MINUTE = 60_000;

/** Minutes past local midnight, fractional, 0 ≤ m < 1440. */
export function minuteOfDay(ms: number): number {
  const d = new Date(ms);
  return (
    d.getHours() * 60 +
    d.getMinutes() +
    d.getSeconds() / 60 +
    d.getMilliseconds() / MINUTE
  );
}

/** The angle a time of day sits at, in radians clockwise from the top. */
export function angleOf(minute: number): number {
  return (minute / MINUTES_PER_DAY) * 2 * Math.PI;
}

/** The point at `minute` on a circle round (`cx`, `cy`). */
export function pointAt(
  cx: number,
  cy: number,
  r: number,
  minute: number,
): { x: number; y: number } {
  const a = angleOf(minute);
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

/** The time of day under a point on the face, 0 ≤ m < 1440. */
export function minuteAtPoint(
  cx: number,
  cy: number,
  x: number,
  y: number,
): number {
  const a = Math.atan2(x - cx, cy - y);
  const m = (a / (2 * Math.PI)) * MINUTES_PER_DAY;
  return (m + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/** The shorter way round from one time of day to another, in minutes:
 *  −720 < Δ ≤ 720. A finger crossing midnight moves a few minutes, not a
 *  day. */
export function wrapDelta(from: number, to: number): number {
  const d =
    (((to - from) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return d > MINUTES_PER_DAY / 2 ? d - MINUTES_PER_DAY : d;
}

/**
 * An SVG path along the circle, clockwise from `from` to `to` (times of day,
 * in minutes). A span of a whole day or more draws the full circle; one of
 * nothing draws nothing.
 */
export function arcPath(
  cx: number,
  cy: number,
  r: number,
  from: number,
  to: number,
): string {
  let span =
    (((to - from) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  if (span === 0 && to !== from) span = MINUTES_PER_DAY;
  if (span <= 0) return "";
  if (span >= MINUTES_PER_DAY - 0.01) {
    // Two half circles: a single arc whose ends meet draws nothing.
    const top = pointAt(cx, cy, r, from);
    const bottom = pointAt(cx, cy, r, from + MINUTES_PER_DAY / 2);
    return `M${f(top.x)} ${f(top.y)}A${r} ${r} 0 1 1 ${f(bottom.x)} ${f(bottom.y)}A${r} ${r} 0 1 1 ${f(top.x)} ${f(top.y)}`;
  }
  const a = pointAt(cx, cy, r, from);
  const b = pointAt(cx, cy, r, from + span);
  const large = span > MINUTES_PER_DAY / 2 ? 1 : 0;
  return `M${f(a.x)} ${f(a.y)}A${r} ${r} 0 ${large} 1 ${f(b.x)} ${f(b.y)}`;
}

function f(n: number): string {
  return n.toFixed(2);
}

/** A span of time on the dial: two instants, in milliseconds. */
export type DialRange = { start: number; end: number };

/** Which part of a span a drag holds: one end, or the arc — both. */
export type DialGrip = "start" | "end" | "both";

export type DragLimits = {
  /** The latest either end may reach: a record is of something that has
   *  happened. */
  now: number;
  /** The grid the ends land on, in minutes — the five a parent reads a
   *  clock in. */
  step?: number;
  /** The shortest span a drag leaves, in minutes. */
  minMinutes?: number;
};

/** An instant rounded to the nearest `step` minutes. Local time and UTC
 *  agree on every five-minute boundary in every zone that matters here, so
 *  the epoch is as good a grid as the wall clock. */
export function snapInstant(ms: number, step: number): number {
  const grid = step * MINUTE;
  return Math.round(ms / grid) * grid;
}

/**
 * The span after a drag: `origin` is where it was when the finger came down,
 * `delta` the minutes the finger has travelled round the face since (the sum
 * of `wrapDelta`s, so it can run past a whole turn).
 *
 * The moved end lands on the `step` grid. It never reaches `now`'s future,
 * never crosses the other end (the span keeps `minMinutes`), and never
 * stretches the span to a whole turn, which the dial could not tell from
 * nothing. Moving both keeps the length and stops at `now`.
 */
export function dragRange(
  origin: DialRange,
  grip: DialGrip,
  delta: number,
  limits: DragLimits,
): DialRange {
  const step = limits.step ?? 5;
  const min = (limits.minMinutes ?? step) * MINUTE;
  const max = (MINUTES_PER_DAY - step) * MINUTE;
  const now = limits.now;
  const move = delta * MINUTE;

  if (grip === "both") {
    const length = origin.end - origin.start;
    let start = snapInstant(origin.start + move, step);
    if (start + length > now) start = now - length;
    return { start, end: start + length };
  }
  if (grip === "start") {
    let start = snapInstant(origin.start + move, step);
    start = Math.min(start, origin.end - min, now - min);
    start = Math.max(start, origin.end - max);
    return { start, end: origin.end };
  }
  let end = snapInstant(origin.end + move, step);
  end = Math.min(end, origin.start + max, now);
  end = Math.max(end, origin.start + min);
  return { start: origin.start, end };
}

/** The same wall-clock time `days` days later (or earlier): a calendar step,
 *  not 24 hours, so a span moved across a daylight-saving change keeps the
 *  times it read. */
export function shiftDays(ms: number, days: number): number {
  const d = new Date(ms);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

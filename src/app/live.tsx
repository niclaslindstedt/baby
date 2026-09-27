// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The moving parts: the clock that ticks on screen, and the two shapes it
// ticks in — a stopwatch and a ring. The sleep module is where they were
// first used and is the reference for the rest of the app: a record that is
// *running* (a sleep, and later a feed or a wake window) shows its clock
// running, to the second, rather than a sentence about it.
//
// Only what is on screen ticks. `useTick` re-renders the one component that
// holds it — a timer, never a screen — and stops while the page is hidden,
// so a phone in a pocket does no work and a phone taken back out is right
// the moment it is looked at. The derivations stay clock-free: a timer
// reads the wall clock itself, but every number that *means* something is
// still computed from a `now` a screen passes in (`useNow.ts`).
//
// Motion is decoration on a number that is already there, so every
// animation here is CSS (`styles.css`, "Live") and every one of them stops
// for a device that asks for reduced motion. The digits keep ticking: they
// are the reading, not the flourish.

import { useEffect, useState } from "react";

import { formatElapsed } from "./format.ts";

/** The wall clock, re-read every `ms` while the page is visible, and at
 *  once when it becomes visible again. */
export function useTick(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      setNow(Date.now());
      timer ??= setInterval(() => setNow(Date.now()), ms);
    };
    const stop = () => {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () =>
      document.visibilityState === "hidden" ? stop() : start();
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ms]);
  return now;
}

/**
 * A stopwatch: the time since `from`, to the second, ticking. With `to` it
 * counts down instead — the time left until it — and holds at zero.
 *
 * `role="timer"` is the element a screen reader knows not to announce on
 * every tick; `label` says what it is counting, since the digits alone
 * don't.
 */
export function Elapsed({
  from,
  to,
  label,
  className = "",
}: {
  from?: number;
  to?: number;
  label?: string;
  className?: string;
}) {
  const now = useTick(1000);
  const ms = to !== undefined ? to - now : now - (from ?? now);
  return (
    <span
      role="timer"
      aria-label={label}
      className={`tabular-nums ${className}`}
    >
      {formatElapsed(ms)}
    </span>
  );
}

/**
 * A ring that fills clockwise from the top: `value` of the way round, 0–1.
 * `spin` turns an orbiting dot round it once a minute instead of — or as
 * well as — the fill: the "still going" sign for a clock with no end yet.
 * The children sit in the middle.
 */
export function ProgressRing({
  value,
  size = 44,
  stroke = 4,
  spin = false,
  tone = "accent",
  children,
  className = "",
}: {
  value: number;
  size?: number;
  stroke?: number;
  spin?: boolean;
  tone?: "accent" | "warn";
  children?: React.ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  const color = tone === "warn" ? "var(--color-danger)" : "var(--color-accent)";
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={stroke}
          opacity={0.5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`}
          className="live-ring"
        />
      </svg>
      {spin && (
        <span aria-hidden="true" className="live-orbit absolute inset-0">
          <span
            className="absolute left-1/2 rounded-full bg-accent"
            style={{
              width: stroke + 2,
              height: stroke + 2,
              top: -1,
              marginLeft: -(stroke + 2) / 2,
            }}
          />
        </span>
      )}
      <span className="relative flex items-center justify-center">
        {children}
      </span>
    </span>
  );
}

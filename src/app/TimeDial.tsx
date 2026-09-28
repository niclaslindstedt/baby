// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import {
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { dayKeyOf } from "@niclaslindstedt/oss-framework/calendar";

import {
  ClockDial,
  DIAL_C,
  DIAL_SIZE,
  TRACK_R,
  arcColor,
} from "./ClockDial.tsx";
import { durationLabel, relativeDay } from "./copy.ts";
import {
  arcPath,
  minuteAtPoint,
  minuteOfDay,
  pointAt,
  wrapDelta,
} from "./dial.ts";
import { formatInstant } from "./format.ts";
import { useLang, useT } from "./i18n/index.ts";
import { useTick } from "./live.tsx";
import { WHEN_STEP, whenDrag } from "./when.ts";

// One moment, set on the clock: the "when?" sheet's answer for a time none
// of its one-tap lags covers. The same face as the sleep dials
// (`ClockDial.tsx`) with a single handle on it and an arc from the handle
// round to now — the stretch of the day that has passed since — so the
// parent drags back through the afternoon rather than typing a time.
//
// The handle lands on five minutes, stops at now and at the earliest time
// the caller allows, and runs on past midnight into yesterday. The time and
// how long ago it was are read out in the middle while it moves. To the
// keyboard and a screen reader the handle is a slider: arrows five minutes,
// Page Up and Down an hour. The arithmetic is `when.ts` and `dial.ts`.

type Props = {
  /** The picked moment, in milliseconds. */
  value: number;
  onChange: (value: number) => void;
  /** The earliest moment allowed, or null. */
  earliest: number | null;
  /** Drawn in the handle: the thing being logged. */
  icon: ReactNode;
  label: string;
};

const ARC_W = 34;
const HANDLE_R = ARC_W / 2;

/** The moment of a drag, read in the handler — never during a render. */
const wallClock = () => Date.now();

type Drag = { origin: number; last: number; delta: number };

export function TimeDial({ value, onChange, earliest, icon, label }: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const now = useTick(30_000);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);

  const move = (origin: number, delta: number) =>
    onChange(whenDrag(origin, delta, wallClock(), earliest));

  const read = (e: ReactPointerEvent<SVGSVGElement>) => {
    const box = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * DIAL_SIZE;
    const y = ((e.clientY - box.top) / box.height) * DIAL_SIZE;
    return {
      minute: minuteAtPoint(DIAL_C, DIAL_C, x, y),
      r: Math.hypot(x - DIAL_C, y - DIAL_C),
    };
  };

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    const { minute, r } = read(e);
    const onHandle = (e.target as Element).closest("[data-grip]") !== null;
    if (!onHandle && Math.abs(r - TRACK_R) > ARC_W) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    // A tap on the track brings the handle there — the shorter way round.
    const delta = onHandle ? 0 : wrapDelta(minuteOfDay(value), minute);
    drag.current = { origin: value, last: minute, delta };
    if (delta !== 0) move(value, delta);
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const { minute } = read(e);
    d.delta += wrapDelta(d.last, minute);
    d.last = minute;
    move(d.origin, d.delta);
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  const onKeyDown = (e: ReactKeyboardEvent<Element>) => {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? WHEN_STEP
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -WHEN_STEP
          : e.key === "PageUp"
            ? 60
            : e.key === "PageDown"
              ? -60
              : 0;
    if (step === 0) return;
    e.preventDefault();
    move(value, step);
  };

  const from = minuteOfDay(value);
  const to = minuteOfDay(now);
  const handle = pointAt(DIAL_C, DIAL_C, TRACK_R, from);
  const head = pointAt(DIAL_C, DIAL_C, TRACK_R, to);
  const time = formatInstant(value, locale);
  const ago = Math.max(0, (now - value) / 60_000);
  const today = dayKeyOf(new Date(now));
  const day = relativeDay(t, value, today, locale);

  const overlay = (
    <>
      {ago >= 1 && (
        <path
          d={arcPath(DIAL_C, DIAL_C, TRACK_R, from, to)}
          fill="none"
          stroke={arcColor("night")}
          strokeWidth={ARC_W}
          opacity={0.3}
          pointerEvents="none"
        />
      )}
      <circle
        cx={head.x}
        cy={head.y}
        r={6}
        fill="var(--color-fg-bright)"
        className="live-glow"
        pointerEvents="none"
      />
      <g
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={1439}
        aria-valuenow={Math.round(from)}
        aria-valuetext={`${day} ${time}`}
        data-grip="start"
        onKeyDown={onKeyDown}
        className="dial-handle cursor-grab outline-none"
      >
        <circle
          cx={handle.x}
          cy={handle.y}
          r={HANDLE_R + 8}
          fill="transparent"
        />
        <circle
          cx={handle.x}
          cy={handle.y}
          r={HANDLE_R + 4}
          fill="none"
          stroke="var(--color-fg-bright)"
          strokeWidth={2}
          className="dial-focus"
        />
        <circle
          cx={handle.x}
          cy={handle.y}
          r={HANDLE_R}
          fill="var(--color-accent)"
        />
        <g
          transform={`translate(${handle.x - 8} ${handle.y - 8})`}
          pointerEvents="none"
          className="text-page-bg"
        >
          {icon}
        </g>
      </g>
    </>
  );

  return (
    <ClockDial
      arcs={[]}
      now={now}
      arcWidth={ARC_W}
      overlay={overlay}
      label={label}
      className="max-w-[17rem]"
      svgRef={svgRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <span className="text-xs font-medium tracking-wide text-muted uppercase">
        {day}
      </span>
      <span className="text-3xl leading-tight font-bold text-fg-bright tabular-nums">
        {time}
      </span>
      <span className="text-xs text-muted tabular-nums">
        {ago < 1
          ? t("when.now")
          : t("when.ago", { duration: durationLabel(t, ago) })}
      </span>
    </ClockDial>
  );
}

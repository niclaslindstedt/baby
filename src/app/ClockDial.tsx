// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import type { PointerEvent as ReactPointerEvent, ReactNode, Ref } from "react";

import { arcPath, minuteOfDay, pointAt } from "./dial.ts";
import { MoonIcon, SunIcon } from "./icons.tsx";

// The 24-hour dial, drawn: a face with midnight at the top and noon at the
// bottom, a thick track round it, and arcs on the track for the spans of the
// day. The arithmetic is `dial.ts`; this is only the drawing, shared by the
// dial that *shows* the day (the Sleep tab, the view behind Today's card)
// and the one that *edits* a sleep (`SleepClock.tsx`), so the two are the
// same object to the eye — the one a parent drags is the one they read.
//
// Arcs come in three tones: a night, a nap, and a hint — the dashed stretch
// a suggestion covers, which is not a record and must not look like one. A
// `live` arc is the one still growing, and its head glows. `now`, when
// given, is a notch on the rim that pulses, so the face always says where
// in the day it is.
//
// The drawing is in a fixed 300-unit box and scales to the width it is
// given; the centre is ordinary HTML laid over it, for the numbers.

export const DIAL_SIZE = 300;
export const DIAL_C = DIAL_SIZE / 2;
/** The track's centre line, and its width. */
export const TRACK_R = 122;
export const TRACK_W = 38;
const FACE_R = TRACK_R - TRACK_W / 2 - 3;
const NUMERAL_R = FACE_R - 22;

export type DialArc = {
  key: string;
  /** Instants, in milliseconds. */
  from: number;
  to: number;
  tone: "night" | "nap" | "hint";
  /** Still growing: the head glows. */
  live?: boolean;
};

type Props = {
  arcs: DialArc[];
  /** Where the rim's notch sits. */
  now?: number;
  /** Arc stroke width: thinner for a dial that shows a day, full for one
   *  that is dragged. */
  arcWidth?: number;
  /** Drawn above the arcs — the editor's handles. */
  overlay?: ReactNode;
  /** In the middle of the face. */
  children?: ReactNode;
  label: string;
  desc?: string;
  className?: string;
  svgRef?: Ref<SVGSVGElement>;
  onPointerDown?: (e: ReactPointerEvent<SVGSVGElement>) => void;
  onPointerMove?: (e: ReactPointerEvent<SVGSVGElement>) => void;
  onPointerUp?: (e: ReactPointerEvent<SVGSVGElement>) => void;
};

/** The colour of a tone, as the other sleep charts use them: nights in the
 *  accent, naps in the lighter ink. */
export function arcColor(tone: DialArc["tone"]): string {
  return tone === "nap" ? "var(--color-fg-bright)" : "var(--color-accent)";
}

export function ClockDial({
  arcs,
  now,
  arcWidth = 26,
  overlay,
  children,
  label,
  desc,
  className = "",
  svgRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: Props) {
  const nowPoint =
    now === undefined
      ? null
      : pointAt(DIAL_C, DIAL_C, TRACK_R, minuteOfDay(now));
  return (
    <div className={`relative mx-auto aspect-square w-full ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`}
        role="img"
        aria-label={label}
        className="absolute inset-0 h-full w-full touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {desc && <desc>{desc}</desc>}
        {/* The track: a groove the arcs sit in. */}
        <circle
          cx={DIAL_C}
          cy={DIAL_C}
          r={TRACK_R}
          fill="none"
          stroke="var(--color-fg-bright)"
          strokeOpacity={0.09}
          strokeWidth={TRACK_W}
          data-grip="track"
        />
        <circle
          cx={DIAL_C}
          cy={DIAL_C}
          r={FACE_R}
          fill="var(--color-surface-2)"
          opacity={0.7}
        />
        <Face glyphs={!children} />
        {arcs.map((arc) => (
          <Arc key={arc.key} arc={arc} width={arcWidth} />
        ))}
        {nowPoint && (
          <g aria-hidden="true" pointerEvents="none">
            <circle
              cx={nowPoint.x}
              cy={nowPoint.y}
              r={6}
              fill="none"
              stroke="var(--color-fg-bright)"
              strokeWidth={1.5}
              className="live-pulse"
            />
            <circle
              cx={nowPoint.x}
              cy={nowPoint.y}
              r={3.5}
              fill="var(--color-fg-bright)"
            />
          </g>
        )}
        {overlay}
      </svg>
      {children && (
        <div className="pointer-events-none absolute inset-[29%] flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}

/** The face: an hour tick every hour and a quarter tick between, the even
 *  hours numbered, and — when nothing sits in the middle — the moon under
 *  midnight and the sun over noon. */
function Face({ glyphs }: { glyphs: boolean }) {
  const ticks = [];
  for (let q = 0; q < 96; q++) {
    const minute = q * 15;
    const hour = q % 4 === 0;
    const outer = pointAt(DIAL_C, DIAL_C, FACE_R - 3, minute);
    const inner = pointAt(DIAL_C, DIAL_C, FACE_R - (hour ? 10 : 6), minute);
    ticks.push(
      <line
        key={q}
        x1={outer.x}
        y1={outer.y}
        x2={inner.x}
        y2={inner.y}
        stroke="var(--color-muted)"
        strokeWidth={hour ? 1.4 : 0.8}
        opacity={hour ? 0.8 : 0.45}
      />,
    );
  }
  const numerals = [];
  for (let h = 0; h < 24; h += 2) {
    const p = pointAt(DIAL_C, DIAL_C, NUMERAL_R, h * 60);
    numerals.push(
      <text
        key={h}
        x={p.x}
        y={p.y}
        dy="0.35em"
        textAnchor="middle"
        className={`tabular-nums ${h % 6 === 0 ? "fill-fg-bright" : "fill-muted"}`}
        fontSize={h % 6 === 0 ? 14 : 11}
        fontWeight={h % 6 === 0 ? 600 : 400}
      >
        {h}
      </text>,
    );
  }
  const moon = pointAt(DIAL_C, DIAL_C, NUMERAL_R - 24, 0);
  const sun = pointAt(DIAL_C, DIAL_C, NUMERAL_R - 24, 720);
  return (
    <g aria-hidden="true" pointerEvents="none">
      {ticks}
      {numerals}
      {glyphs && (
        <>
          <g transform={`translate(${moon.x - 8} ${moon.y - 8})`}>
            <MoonIcon className="h-4 w-4 text-accent" />
          </g>
          <g transform={`translate(${sun.x - 8} ${sun.y - 8})`}>
            <SunIcon className="h-4 w-4 text-fg-bright" />
          </g>
        </>
      )}
    </g>
  );
}

function Arc({ arc, width }: { arc: DialArc; width: number }) {
  if (arc.to <= arc.from) return null;
  const from = minuteOfDay(arc.from);
  const whole = arc.to - arc.from >= 24 * 3_600_000;
  const to = whole ? from : minuteOfDay(arc.to);
  const d = whole
    ? arcPath(DIAL_C, DIAL_C, TRACK_R, from, from + 1440 - 0.001)
    : arcPath(DIAL_C, DIAL_C, TRACK_R, from, to);
  if (!d) return null;
  const color = arcColor(arc.tone);
  const head = pointAt(DIAL_C, DIAL_C, TRACK_R, to);
  if (arc.tone === "hint") {
    // A wash across the track with a marching line through it: somewhere
    // to aim, drawn so it can't be taken for a sleep that happened.
    return (
      <g pointerEvents="none">
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={width}
          opacity={0.22}
        />
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="3 4"
          className="dial-hint"
        />
      </g>
    );
  }
  return (
    <g pointerEvents="none">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="butt"
        opacity={arc.tone === "nap" ? 0.55 : 0.9}
        pathLength={1}
        className="dial-arc"
      />
      {arc.live && (
        <circle
          cx={head.x}
          cy={head.y}
          r={width / 2}
          fill={color}
          className="live-glow"
        />
      )}
    </g>
  );
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import {
  areaPath,
  linePath,
  linearScale,
  niceTicks,
  type PathPoint,
} from "@niclaslindstedt/oss-framework/charts";
import { useMeasuredSize } from "@niclaslindstedt/oss-framework/hooks";

import { useT } from "./i18n/index.ts";
import type { DayCoverage } from "./nutrition.ts";

// The day as a curve: energy accumulating from the morning to the evening
// against the line the regimen is held to.
//
// A stacked bar of five foods would show the same total, and show nothing
// about the day. What a parent wants to see here is *when* the day fills up:
// a regimen that reaches the line by lunch and then flattens looks different
// from one that only just gets there at bedtime, and one that never reaches
// it at all ends with a visible gap under the line rather than with a
// sentence about a number.
//
// The curve steps where the regimen names a time and slopes where it doesn't
// (see `dayCoverage` in `nutrition.ts`) — the slope is the honest drawing of
// "sometime during the day", and the difference between the two is why the
// legend names both.
//
// Built from the framework's chart primitives rather than its `LineChart`:
// the x axis is a clock rather than a category band, and the target line and
// the meal markers are annotations no finished chart component offers.

type Props = {
  coverage: DayCoverage;
  /** kcal as the screen names it. */
  formatValue: (kcal: number) => string;
  ariaLabel: string;
  desc: string;
  height?: number;
};

const PAD = { top: 14, right: 10, bottom: 26, left: 8 };
const FALLBACK_WIDTH = 340;
const TICK_GAP = 6;
const TICK_CHAR_WIDTH = 6;
const MAX_Y_TICKS = 4;
/** Hours between x labels; the wider step is for a phone-width plot. */
const HOUR_STEP_WIDE = 2;
const HOUR_STEP_NARROW = 4;
const NARROW_PLOT = 300;

export function DayCoverageChart({
  coverage,
  formatValue,
  ariaLabel,
  desc,
  height = 190,
}: Props) {
  const t = useT();
  const { ref, size } = useMeasuredSize<HTMLDivElement>();
  const width = Math.max(240, Math.round(size?.width ?? FALLBACK_WIDTH));
  const [cursor, setCursor] = useState<number | null>(null);

  const { from, to, points, meals, targetKcal, totalKcal } = coverage;
  const top = Math.max(targetKcal, totalKcal, 1) * 1.12;
  const axis = niceTicks([0, top], MAX_Y_TICKS);
  const gutter =
    axis.values.length === 0
      ? 0
      : Math.ceil(
          Math.max(...axis.values.map((v) => formatValue(v).length)) *
            TICK_CHAR_WIDTH,
        ) + TICK_GAP;
  const plot = {
    left: PAD.left + gutter,
    top: PAD.top,
    width: Math.max(1, width - PAD.left - gutter - PAD.right),
    height: Math.max(1, height - PAD.top - PAD.bottom),
  };
  const baseline = plot.top + plot.height;
  const x = linearScale([from, to], [plot.left, plot.left + plot.width]);
  const y = linearScale([0, top], [baseline, plot.top]);

  const projected: PathPoint[] = points.map((p) => [x(p.minutes), y(p.kcal)]);
  const targetY = y(targetKcal);

  const hourStep = plot.width < NARROW_PLOT ? HOUR_STEP_NARROW : HOUR_STEP_WIDE;
  const hours: number[] = [];
  for (
    let h = Math.ceil(from / 60 / hourStep) * hourStep;
    h * 60 <= to;
    h += hourStep
  ) {
    hours.push(h);
  }

  // What the curve reads at the pointer. A minute rather than a meal index:
  // the interesting question between two meals is "how far in is the day",
  // and the answer is on the slope, not on the nearest step.
  const at = cursor ?? to;
  const atKcal = kcalAt(coverage, at);

  return (
    <div ref={ref as React.Ref<HTMLDivElement>}>
      <div
        role="status"
        aria-live="polite"
        className="mb-1 flex min-h-6 flex-wrap items-baseline gap-x-2"
      >
        <span
          className={`text-sm font-bold tabular-nums ${
            cursor !== null ? "text-fg-bright" : "text-accent"
          }`}
        >
          {clockLabel(at)}
        </span>
        <span className="text-xs text-fg tabular-nums">
          {t("food.coverage.readout", {
            actual: formatValue(atKcal),
            target: formatValue(targetKcal),
          })}
        </span>
      </div>
      <div data-swipe-ignore>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={ariaLabel}
          className="block touch-pan-y select-none"
        >
          <desc>{desc}</desc>

          {axis.values.map((value) => {
            const ty = y(value);
            return (
              <g key={value}>
                {Math.abs(ty - baseline) > 0.5 && (
                  <line
                    x1={plot.left}
                    x2={plot.left + plot.width}
                    y1={ty}
                    y2={ty}
                    stroke="var(--color-line)"
                    strokeWidth={1}
                    opacity={0.5}
                  />
                )}
                <text
                  x={plot.left - TICK_GAP}
                  y={ty}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-muted text-[10px] tabular-nums"
                >
                  {formatValue(value)}
                </text>
              </g>
            );
          })}

          <path
            d={areaPath(projected, baseline)}
            fill="var(--color-accent)"
            opacity={0.16}
            className="chart-area"
          />
          <path
            d={linePath(projected)}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* The day's need, as the one line the curve is trying to reach. */}
          <line
            x1={plot.left}
            x2={plot.left + plot.width}
            y1={targetY}
            y2={targetY}
            stroke="var(--color-fg-bright)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            opacity={0.75}
            className="chart-marker"
          />

          {meals.map((meal) => (
            <circle
              key={meal.minutes}
              cx={x(meal.minutes)}
              cy={y(kcalAt(coverage, meal.minutes))}
              r={3}
              fill="var(--color-accent)"
              className="chart-marker"
            />
          ))}

          <line
            x1={plot.left}
            x2={plot.left + plot.width}
            y1={baseline}
            y2={baseline}
            stroke="var(--color-line)"
            strokeWidth={1}
          />
          {hours.map((h, i) => (
            // A centred label on the first or last tick hangs half of itself
            // off the plot and is clipped by the viewBox, so those two anchor
            // to the edge they sit on instead.
            <text
              key={h}
              x={x(h * 60)}
              y={height - 8}
              textAnchor={
                i === 0 ? "start" : i === hours.length - 1 ? "end" : "middle"
              }
              className="fill-muted text-[10px] tabular-nums"
            >
              {String(h).padStart(2, "0")}
            </text>
          ))}

          {cursor !== null && (
            <line
              x1={x(cursor)}
              x2={x(cursor)}
              y1={plot.top}
              y2={baseline}
              stroke="var(--color-fg-bright)"
              strokeWidth={1}
              opacity={0.35}
            />
          )}

          <rect
            x={plot.left}
            y={plot.top - 6}
            width={plot.width}
            height={plot.height + 6}
            fill="transparent"
            onPointerMove={(e) => {
              const box = e.currentTarget.getBoundingClientRect();
              const scale = box.width > 0 ? width / box.width : 1;
              const local = (e.clientX - box.left) * scale;
              const share = plot.width > 0 ? local / plot.width : 0;
              setCursor(
                Math.round(
                  from + Math.min(1, Math.max(0, share)) * (to - from),
                ),
              );
            }}
            onPointerLeave={() => setCursor(null)}
          />
        </svg>
      </div>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-accent/80" />
          {t("food.coverage.legendGiven")}
        </li>
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-0 w-4 border-t-2 border-dashed border-fg-bright/70"
          />
          {t("food.coverage.legendNeed")}
        </li>
      </ul>
    </div>
  );
}

/** The cumulative energy at a minute, read off the curve (linear inside a
 *  segment, so a point between two meals sits on the spread's slope). */
function kcalAt(coverage: DayCoverage, minutes: number): number {
  const { points } = coverage;
  const first = points[0];
  if (!first) return 0;
  if (minutes <= first.minutes) return first.kcal;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    if (minutes > b.minutes) continue;
    if (b.minutes === a.minutes) return b.kcal;
    const share = (minutes - a.minutes) / (b.minutes - a.minutes);
    return a.kcal + share * (b.kcal - a.kcal);
  }
  return points[points.length - 1]!.kcal;
}

/** Minutes past midnight as "08:00". A wall clock is the same shape in every
 *  locale this app ships, so it is spelled rather than formatted. */
export function clockLabel(minutes: number): string {
  const m = Math.round(minutes);
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

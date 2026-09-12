// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo, useState } from "react";

import {
  bandPath,
  linePath,
  linearScale,
  niceTicks,
  type PathPoint,
} from "@niclaslindstedt/oss-framework/charts";
import { useMeasuredSize } from "@niclaslindstedt/oss-framework/hooks";

import { DAYS_PER_MONTH } from "./age.ts";
import { formatDay } from "./format.ts";
import {
  curveAtZ,
  MAX_STANDARD_DAYS,
  type Forecast,
  type Reading,
} from "./growth.ts";
import type { WhoTable } from "./data/whoGrowth.ts";
import { useT } from "./i18n/index.ts";
import type { Sex } from "./types.ts";

// The growth chart: the child's readings on the WHO standard, drawn the way
// the BVC curves are — a median and the ±1 and ±2 SD channels as bands — with
// the projection ahead of the last reading as nested credible bands, the
// grammar the sibling cycle app's forecast chart uses (three shades of the
// one accent hue, rising opacity for rising certainty, because 95 → 80 → 50%
// is a magnitude, not a category).
//
// Built from the framework's chart primitives rather than its finished
// `LineChart`: the channel bands are region fills between two curves, which
// is `bandPath`'s exact job, and the x axis is age in days rather than a
// category band. The readout is pinned above the plot, not floated over it,
// because a card following the pointer covers the shape and on a touch
// screen sits under the finger that summoned it.

type Props = {
  table: WhoTable;
  sex: Sex;
  series: Reading[];
  forecast: Forecast | null;
  /** The reading's unit, for the readout and the axis. */
  formatValue: (value: number) => string;
  formatTick: (value: number) => string;
  ariaLabel: string;
  desc: string;
  height?: number;
};

const PAD = { top: 14, right: 12, bottom: 26, left: 8 };
const FALLBACK_WIDTH = 340;
const MAX_TICKS = 5;
const TICK_GAP = 6;
const TICK_CHAR_WIDTH = 6;
/** Days of standard drawn either side of the readings. */
const MARGIN_DAYS = 21;
/** The narrowest span the x axis is allowed — a single reading still gets a
 *  few months of curve to sit in. */
const MIN_SPAN_DAYS = 120;

const BAND_OPACITY: Record<number, number> = {
  0.95: 0.09,
  0.8: 0.12,
  0.5: 0.17,
};

export function GrowthChart({
  table,
  sex,
  series,
  forecast,
  formatValue,
  formatTick,
  ariaLabel,
  desc,
  height = 260,
}: Props) {
  const t = useT();
  const { ref, size } = useMeasuredSize<HTMLDivElement>();
  const width = Math.max(240, Math.round(size?.width ?? FALLBACK_WIDTH));
  const [cursor, setCursor] = useState<number | null>(null);

  // The age span: around the readings, plus the projection, clamped to the
  // standards' range and widened to a readable minimum.
  const placed = series.filter((r) => r.z !== null);
  const { from, to } = ageSpan(placed, forecast);

  // The channels, sampled weekly across the span.
  const channels = useMemo(() => {
    const step = Math.max(3, Math.round((to - from) / 60));
    return {
      m2: curveAtZ(table, sex, -2, from, to, step),
      m1: curveAtZ(table, sex, -1, from, to, step),
      z0: curveAtZ(table, sex, 0, from, to, step),
      p1: curveAtZ(table, sex, 1, from, to, step),
      p2: curveAtZ(table, sex, 2, from, to, step),
    };
  }, [table, sex, from, to]);

  // The y domain hugs what is drawn: the ±2 channels, the readings, and the
  // widest forecast band.
  const values: number[] = [
    ...channels.m2.map((p) => p.value),
    ...channels.p2.map((p) => p.value),
    ...placed.map((r) => r.value),
    ...(forecast?.points.flatMap((p) => p.bands.map((b) => b.upper)) ?? []),
    ...(forecast?.points.flatMap((p) => p.bands.map((b) => b.lower)) ?? []),
  ];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const margin = Math.max((hi - lo) * 0.06, 0.1);
  const domain: [number, number] = [lo - margin, hi + margin];
  const axis = niceTicks(domain, MAX_TICKS);
  const gutter =
    axis.values.length === 0
      ? 0
      : Math.ceil(
          Math.max(...axis.values.map((v) => formatTick(v).length)) *
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
  const y = linearScale(domain, [baseline, plot.top]);

  const toPoints = (pts: { ageDays: number; value: number }[]): PathPoint[] =>
    pts.map((p) => [x(p.ageDays), y(p.value)]);

  // Month ticks along the age axis: every month, or every 2/3/6 when the
  // span is long, so the labels never crowd.
  const monthTicks = useMemo(() => {
    const spanMonths = (to - from) / DAYS_PER_MONTH;
    const every =
      spanMonths <= 6 ? 1 : spanMonths <= 14 ? 2 : spanMonths <= 24 ? 3 : 6;
    const out: number[] = [];
    for (
      let m = Math.ceil(from / DAYS_PER_MONTH);
      m * DAYS_PER_MONTH <= to;
      m++
    ) {
      if (m % every === 0) out.push(m);
    }
    return out;
  }, [from, to]);

  const activeIndex = cursor ?? (placed.length > 0 ? placed.length - 1 : null);
  const active = activeIndex !== null ? placed[activeIndex] : undefined;

  const trackPointer = (e: {
    currentTarget: SVGRectElement;
    clientX: number;
  }) => {
    if (placed.length === 0) return;
    const box = e.currentTarget.getBoundingClientRect();
    const scale = box.width > 0 ? width / box.width : 1;
    const px = (e.clientX - box.left) * scale;
    let best = 0;
    let bestDist = Infinity;
    placed.forEach((r, i) => {
      const d = Math.abs(x(r.ageDays) - px);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setCursor(best);
  };

  return (
    <div ref={ref as React.Ref<HTMLDivElement>}>
      <div
        role="status"
        aria-live="polite"
        className="mb-1 flex min-h-6 flex-wrap items-baseline gap-x-2 gap-y-0.5"
      >
        {active ? (
          <>
            <span
              className={`text-sm font-bold ${cursor !== null ? "text-fg-bright" : "text-accent"}`}
            >
              {formatDay(active.date)}
            </span>
            <span className="text-xs text-fg">{formatValue(active.value)}</span>
            {active.z !== null && (
              <span className="text-xs text-muted">{formatSd(active.z)}</span>
            )}
          </>
        ) : (
          <span className="text-xs text-muted">{t("growth.legendMedian")}</span>
        )}
      </div>
      <div
        tabIndex={0}
        role="group"
        data-swipe-ignore
        aria-label={t("growth.keyboardHint")}
        className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          const delta = e.key === "ArrowRight" ? 1 : -1;
          setCursor((prev) => {
            const next = (prev ?? placed.length - 1) + delta;
            return Math.min(placed.length - 1, Math.max(0, next));
          });
        }}
        onBlur={() => setCursor(null)}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={ariaLabel}
          className="block touch-pan-y select-none"
        >
          <desc>{desc}</desc>

          {/* The channels: ±2 SD as the faint outer band, ±1 SD as a slightly
              stronger inner one, the median as a hairline. */}
          <path
            className="chart-band"
            d={bandPath(toPoints(channels.p2), toPoints(channels.m2))}
            fill="var(--color-fg-bright)"
            opacity={0.05}
          />
          <path
            className="chart-band"
            d={bandPath(toPoints(channels.p1), toPoints(channels.m1))}
            fill="var(--color-fg-bright)"
            opacity={0.07}
          />
          {[channels.m2, channels.m1, channels.p1, channels.p2].map((c, i) => (
            <path
              key={i}
              d={linePath(toPoints(c))}
              fill="none"
              stroke="var(--color-line)"
              strokeWidth={1}
              opacity={0.7}
            />
          ))}
          <path
            d={linePath(toPoints(channels.z0))}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />

          {/* The y axis. */}
          {axis.values.map((value) => {
            const ty = y(value);
            return (
              <text
                key={`y-${value}`}
                x={plot.left - TICK_GAP}
                y={ty}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted text-[10px] tabular-nums"
              >
                {formatTick(value)}
              </text>
            );
          })}

          {/* The projection: three nested bands and the dashed centre. */}
          {forecast &&
            [0.95, 0.8, 0.5].map((mass) => {
              const upper = forecast.points.map((p) => ({
                ageDays: p.ageDays,
                value: p.bands.find((b) => b.mass === mass)!.upper,
              }));
              const lower = forecast.points.map((p) => ({
                ageDays: p.ageDays,
                value: p.bands.find((b) => b.mass === mass)!.lower,
              }));
              return (
                <path
                  key={mass}
                  className="chart-band"
                  d={bandPath(toPoints(upper), toPoints(lower))}
                  fill="var(--color-accent)"
                  opacity={BAND_OPACITY[mass] ?? 0.1}
                  style={{ animationDelay: `${(1 - mass) * 260}ms` }}
                />
              );
            })}
          {forecast && (
            <path
              className="chart-marker"
              d={linePath(toPoints(forecast.points))}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
          )}

          {/* The readings: a line through them, and a disc each. */}
          {placed.length > 1 && (
            <path
              className="chart-area"
              d={linePath(toPoints(placed))}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {placed.map((r, i) => (
            <circle
              key={r.id}
              className="chart-marker"
              cx={x(r.ageDays)}
              cy={y(r.value)}
              r={cursor === i ? 5 : 3.5}
              fill="var(--color-accent)"
              stroke="var(--color-page-bg)"
              strokeWidth={1.5}
              style={{ animationDelay: `${i * 20}ms` }}
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
          {monthTicks.map((m) => (
            <text
              key={`m-${m}`}
              x={x(m * DAYS_PER_MONTH)}
              y={height - 8}
              textAnchor="middle"
              className="fill-muted text-[10px] tabular-nums"
            >
              {m}
            </text>
          ))}

          {active && (
            <line
              className="chart-cursor"
              x1={x(active.ageDays)}
              x2={x(active.ageDays)}
              y1={plot.top - 6}
              y2={baseline}
              stroke="var(--color-fg-bright)"
              strokeWidth={1}
              opacity={0.45}
            />
          )}

          <rect
            x={plot.left}
            y={plot.top - 8}
            width={plot.width}
            height={plot.height + 8}
            fill="transparent"
            onPointerMove={trackPointer}
            onPointerDown={trackPointer}
            onPointerLeave={() => setCursor(null)}
          />
        </svg>
      </div>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <li className="flex items-center gap-1.5">
          <span className="h-0 w-4 border-t border-dashed border-muted" />
          {t("growth.legendMedian")}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-sm bg-fg-bright/10" />
          {t("growth.legendChannels")}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-accent" />
          {t("growth.legendReadings")}
        </li>
        {forecast && (
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-4 rounded-sm bg-accent/30" />
            {t("growth.legendForecast")}
          </li>
        )}
      </ul>
    </div>
  );
}

/** The age span the chart draws: around the placed readings and the
 *  projection, clamped to the standards' range and widened to a readable
 *  minimum. */
function ageSpan(
  placed: Reading[],
  forecast: Forecast | null,
): { from: number; to: number } {
  const firstAge = placed[0]?.ageDays ?? 0;
  const lastAge =
    forecast?.points.at(-1)?.ageDays ?? placed.at(-1)?.ageDays ?? MIN_SPAN_DAYS;
  const from = Math.max(0, firstAge - MARGIN_DAYS);
  const to = Math.min(MAX_STANDARD_DAYS, lastAge + MARGIN_DAYS);
  if (to - from >= MIN_SPAN_DAYS) return { from, to };
  const wideTo = Math.min(MAX_STANDARD_DAYS, from + MIN_SPAN_DAYS);
  return { from: Math.max(0, wideTo - MIN_SPAN_DAYS), to: wideTo };
}

/** "+0.4 SD" for the readout. */
function formatSd(z: number): string {
  const sign = z < -0.05 ? "−" : z > 0.05 ? "+" : "±";
  return `${sign}${Math.abs(z).toFixed(1)} SD`;
}

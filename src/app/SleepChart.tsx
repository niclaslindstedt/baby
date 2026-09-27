// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import {
  bandScale,
  barPath,
  linearScale,
  niceTicks,
} from "@niclaslindstedt/oss-framework/charts";
import { useMeasuredSize } from "@niclaslindstedt/oss-framework/hooks";

import { durationLabel } from "./copy.ts";
import { useT } from "./i18n/index.ts";
import type { SleepDay } from "./sleep.ts";

// Two weeks of sleep: one column per sleep day, the night at the bottom and
// the naps stacked on it, over the recommended range for the age as a band.
// A day with nothing logged is an empty slot rather than a zero column — the
// child slept, nobody wrote it down — and a day whose night is still going
// is drawn faded, so a column that is only short because it isn't over yet
// doesn't read as a short day. The readout above the plot names the day
// under the pointer, the way the diaper chart's does.

type Props = {
  series: SleepDay[];
  labels: string[];
  /** The recommended hours for the age, drawn as a band. */
  recommended: [number, number] | null;
  ariaLabel: string;
  desc: string;
  height?: number;
};

const PAD = { top: 12, right: 8, bottom: 24, left: 8 };
const FALLBACK_WIDTH = 340;
const TICK_GAP = 6;
const TICK_CHAR_WIDTH = 6;

export function SleepChart({
  series,
  labels,
  recommended,
  ariaLabel,
  desc,
  height = 170,
}: Props) {
  const t = useT();
  const { ref, size } = useMeasuredSize<HTMLDivElement>();
  const width = Math.max(240, Math.round(size?.width ?? FALLBACK_WIDTH));
  const [cursor, setCursor] = useState<number | null>(null);

  const hours = (minutes: number) => minutes / 60;
  const max = Math.max(
    recommended ? recommended[1] : 0,
    ...series.map((d) => hours(d.totalMinutes)),
    1,
  );
  const domain: [number, number] = [0, max * 1.1];
  const axis = niceTicks(domain, 4);
  const gutter =
    axis.values.length === 0
      ? 0
      : Math.ceil(
          Math.max(...axis.values.map((v) => String(v).length)) *
            TICK_CHAR_WIDTH,
        ) + TICK_GAP;
  const plot = {
    left: PAD.left + gutter,
    top: PAD.top,
    width: Math.max(1, width - PAD.left - gutter - PAD.right),
    height: Math.max(1, height - PAD.top - PAD.bottom),
  };
  const baseline = plot.top + plot.height;
  const bands = bandScale(series.length, [plot.left, plot.left + plot.width], {
    paddingInner: 0.3,
  });
  const y = linearScale(domain, [baseline, plot.top]);
  const step = series.length > 0 ? plot.width / series.length : plot.width;
  // Every other day's label on a narrow plot, so two weeks of "12 Sep"s
  // don't overprint.
  const labelEvery = bands.bandwidth < 22 ? 2 : 1;

  const active = cursor ?? series.length - 1;
  const day = series[active];

  return (
    <div ref={ref as React.Ref<HTMLDivElement>}>
      <div
        role="status"
        aria-live="polite"
        className="mb-1 flex min-h-6 flex-wrap items-baseline gap-x-2"
      >
        <span
          className={`text-sm font-bold ${cursor !== null ? "text-fg-bright" : "text-accent"}`}
        >
          {labels[active]}
        </span>
        {day && (
          <span className="text-xs text-fg">
            {day.logged
              ? t(
                  day.ongoing
                    ? "sleep.chartReadoutSoFar"
                    : "sleep.chartReadout",
                  {
                    total: durationLabel(t, day.totalMinutes),
                    night: durationLabel(t, day.nightMinutes),
                    day: durationLabel(t, day.dayMinutes),
                  },
                )
              : t("sleep.chartNothing")}
          </span>
        )}
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
          {recommended && (
            <rect
              x={plot.left}
              y={y(recommended[1])}
              width={plot.width}
              height={Math.max(0, y(recommended[0]) - y(recommended[1]))}
              fill="var(--color-accent)"
              opacity={0.1}
            />
          )}
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
                  {value}
                </text>
              </g>
            );
          })}
          {series.map((d, i) => {
            if (!d.logged) return null;
            const x = bands.position(i);
            const nightTop = y(hours(d.nightMinutes));
            const totalTop = y(hours(d.totalMinutes));
            const dim = (cursor !== null && cursor !== i) || d.ongoing;
            return (
              <g
                key={d.day}
                className="chart-bar"
                style={{ animationDelay: `${i * 20}ms` }}
              >
                {d.nightMinutes > 0 && (
                  <path
                    d={barPath(
                      x,
                      nightTop,
                      bands.bandwidth,
                      baseline - nightTop,
                      d.dayMinutes > 0 ? 0 : 3,
                      "top",
                    )}
                    fill="var(--color-accent)"
                    opacity={dim ? 0.4 : 0.9}
                  />
                )}
                {d.dayMinutes > 0 && (
                  <path
                    d={barPath(
                      x,
                      totalTop,
                      bands.bandwidth,
                      nightTop - totalTop,
                      3,
                      "top",
                    )}
                    fill="var(--color-fg-bright)"
                    opacity={dim ? 0.25 : 0.5}
                  />
                )}
              </g>
            );
          })}
          <line
            x1={plot.left}
            x2={plot.left + plot.width}
            y1={baseline}
            y2={baseline}
            stroke="var(--color-line)"
            strokeWidth={1}
          />
          {series.map((_, i) =>
            (series.length - 1 - i) % labelEvery === 0 ? (
              <text
                key={i}
                x={bands.position(i) + bands.bandwidth / 2}
                y={height - 8}
                textAnchor="middle"
                className="fill-muted text-[10px]"
              >
                {labels[i]}
              </text>
            ) : null,
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
              const local = (e.clientX - box.left) * scale - plot.left;
              setCursor(
                Math.min(
                  series.length - 1,
                  Math.max(0, Math.floor(local / step)),
                ),
              );
            }}
            onPointerLeave={() => setCursor(null)}
          />
        </svg>
      </div>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-accent/90" />
          {t("sleep.legendNight")}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-fg-bright/50" />
          {t("sleep.legendDay")}
        </li>
        {recommended && (
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-accent/15" />
            {t("sleep.legendRecommended")}
          </li>
        )}
      </ul>
    </div>
  );
}

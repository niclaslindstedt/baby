// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import {
  bandScale,
  barPath,
  linearScale,
  niceTicks,
} from "@niclaslindstedt/oss-framework/charts";
import { useMeasuredSize } from "@niclaslindstedt/oss-framework/hooks";

import type { DiaperCount } from "./diapers.ts";
import { useT } from "./i18n/index.ts";

// A week of diapers: one pair of columns per day, wet beside dirty, on the
// same hairline frame the sibling apps' charts share. A zero day is a real
// column of zero height — the day happened, nothing was logged — and the
// pinned readout above the plot names the day under the pointer.

type Props = {
  series: DiaperCount[];
  labels: string[];
  ariaLabel: string;
  desc: string;
  height?: number;
};

const PAD = { top: 12, right: 8, bottom: 24, left: 8 };
const FALLBACK_WIDTH = 340;
const TICK_GAP = 6;
const TICK_CHAR_WIDTH = 6;

export function DiaperChart({
  series,
  labels,
  ariaLabel,
  desc,
  height = 150,
}: Props) {
  const t = useT();
  const { ref, size } = useMeasuredSize<HTMLDivElement>();
  const width = Math.max(240, Math.round(size?.width ?? FALLBACK_WIDTH));
  const [cursor, setCursor] = useState<number | null>(null);

  const max = Math.max(1, ...series.map((d) => Math.max(d.wet, d.dirty)));
  const domain: [number, number] = [0, max * 1.15];
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
  const half = bands.bandwidth / 2;
  const step = series.length > 0 ? plot.width / series.length : plot.width;

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
            {t("today.wet", { count: String(day.wet) })} ·{" "}
            {t("today.dirty", { count: String(day.dirty) })}
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
            const x = bands.position(i);
            const wetTop = y(d.wet);
            const dirtyTop = y(d.dirty);
            const dim = cursor !== null && cursor !== i;
            return (
              <g
                key={d.day}
                className="chart-bar"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {d.wet > 0 && (
                  <path
                    d={barPath(
                      x,
                      wetTop,
                      half - 1,
                      baseline - wetTop,
                      3,
                      "top",
                    )}
                    fill="var(--color-accent)"
                    opacity={dim ? 0.4 : 0.9}
                  />
                )}
                {d.dirty > 0 && (
                  <path
                    d={barPath(
                      x + half + 1,
                      dirtyTop,
                      half - 1,
                      baseline - dirtyTop,
                      3,
                      "top",
                    )}
                    fill="var(--color-fg-bright)"
                    opacity={dim ? 0.25 : 0.55}
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
          {series.map((_, i) => (
            <text
              key={i}
              x={bands.position(i) + half}
              y={height - 8}
              textAnchor="middle"
              className="fill-muted text-[10px]"
            >
              {labels[i]}
            </text>
          ))}
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
      <ul className="mt-1 flex gap-4 text-xs text-muted">
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-accent/90" />
          {t("today.legendWet")}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-fg-bright/55" />
          {t("today.legendDirty")}
        </li>
      </ul>
    </div>
  );
}

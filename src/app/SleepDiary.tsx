// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { linearScale } from "@niclaslindstedt/oss-framework/charts";
import { useMeasuredSize } from "@niclaslindstedt/oss-framework/hooks";

import { formatAxisHour } from "./format.ts";
import { useLocale, useT } from "./i18n/index.ts";
import type { DiaryDay } from "./sleep.ts";

// The sleep diary: one row per calendar day, midnight to midnight, with each
// sleep drawn where it fell. It is the chart a sleep diary on paper is — the
// clock across, the days down — and the one that shows what no total can:
// the nights lengthening and the naps settling into the same places day
// after day. Nights in the accent, naps in the lighter ink the other sleep
// chart uses, and the sleep running now fades toward its growing end.

type Props = {
  days: DiaryDay[];
  labels: string[];
  ariaLabel: string;
  desc: string;
};

const ROW = 14;
const GAP = 8;
const LABEL_WIDTH = 48;
const AXIS = 18;
const FALLBACK_WIDTH = 340;
const HOURS = [0, 6, 12, 18, 24];

export function SleepDiary({ days, labels, ariaLabel, desc }: Props) {
  const t = useT();
  const locale = useLocale();
  const { ref, size } = useMeasuredSize<HTMLDivElement>();
  const width = Math.max(240, Math.round(size?.width ?? FALLBACK_WIDTH));
  const plotLeft = LABEL_WIDTH;
  const plotRight = width - 8;
  const x = linearScale([0, 1440], [plotLeft, plotRight]);
  const height = days.length * (ROW + GAP) + AXIS;

  return (
    <div ref={ref as React.Ref<HTMLDivElement>}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="block select-none"
      >
        <desc>{desc}</desc>
        {HOURS.map((h) => (
          <g key={h}>
            <line
              x1={x(h * 60)}
              x2={x(h * 60)}
              y1={0}
              y2={height - AXIS + 2}
              stroke="var(--color-line)"
              strokeWidth={1}
              opacity={h === 0 || h === 24 ? 0.8 : 0.4}
            />
            <text
              x={x(h * 60)}
              y={height - 4}
              textAnchor={h === 0 ? "start" : h === 24 ? "end" : "middle"}
              className="fill-muted text-[10px] tabular-nums"
            >
              {formatAxisHour(h, locale)}
            </text>
          </g>
        ))}
        {days.map((day, i) => {
          const top = i * (ROW + GAP) + GAP / 2;
          return (
            <g key={day.day}>
              <text
                x={0}
                y={top + ROW / 2}
                dy="0.32em"
                className="fill-muted text-[10px]"
              >
                {labels[i]}
              </text>
              <rect
                x={plotLeft}
                y={top}
                width={Math.max(0, plotRight - plotLeft)}
                height={ROW}
                rx={3}
                fill="var(--color-line)"
                opacity={0.18}
              />
              {day.segments.map((seg, k) => (
                <rect
                  key={k}
                  x={x(seg.from)}
                  y={top}
                  width={Math.max(1.5, x(seg.to) - x(seg.from))}
                  height={ROW}
                  rx={3}
                  fill={
                    seg.kind === "night"
                      ? "var(--color-accent)"
                      : "var(--color-fg-bright)"
                  }
                  opacity={
                    (seg.kind === "night" ? 0.9 : 0.5) * (seg.ongoing ? 0.7 : 1)
                  }
                />
              ))}
            </g>
          );
        })}
      </svg>
      <ul className="mt-1 flex gap-4 text-xs text-muted">
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-accent/90" />
          {t("sleep.legendNight")}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-fg-bright/50" />
          {t("sleep.legendDay")}
        </li>
      </ul>
    </div>
  );
}

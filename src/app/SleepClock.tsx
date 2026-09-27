// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useRef, type PointerEvent as ReactPointerEvent } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@niclaslindstedt/oss-framework/components";

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
  dragRange,
  minuteAtPoint,
  minuteOfDay,
  pointAt,
  shiftDays,
  wrapDelta,
  type DialGrip,
  type DialRange,
} from "./dial.ts";
import { formatInstant } from "./format.ts";
import { MoonIcon, SunIcon, SunriseIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import { Elapsed, useTick } from "./live.tsx";
import type { SleepDraft, SleepEditProblem } from "./sleepEdit.ts";

// A sleep, set on the clock: the phone's bedtime dial, turned to the past.
//
// The two times sit over the dial as the alarm screen puts them — when the
// child fell asleep on the left, when they woke on the right, each with the
// day it fell on — and the dial below draws the sleep as an arc between two
// handles. Drag a handle to move that end, drag the arc to move the whole
// sleep, or tap the track to bring the nearer end there. Every move lands on
// five minutes, stops at now, and can run on past midnight into the day
// before or after; the chevrons step the whole sleep a day at a time for one
// further back than a drag is worth. The length is read out underneath, so
// the parent sees "9 h 30 min" while they drag rather than working it out.
//
// A sleep still going has no end handle: its arc runs to now and keeps
// growing, the end reads as a running clock, and only the start can move.
//
// The handles are sliders to the keyboard and to a screen reader — arrows
// five minutes, Page Up and Down an hour — so the dial is never the only way
// to a time. The arithmetic is `dial.ts`; the rules a time must pass are
// `sleepEdit.ts`, read by the sheet around this (`SleepForm.tsx`).

type Props = {
  draft: SleepDraft;
  onChange: (range: { start: number; end: number | null }) => void;
  today: DayKey;
  problem: SleepEditProblem | null;
};

/** The arc's width: the handles sit on it, as wide as it is. */
const ARC_W = 34;
const HANDLE_R = ARC_W / 2;
const STEP = 5;

/** The moment of a drag, read in the handler — never during a render. */
const wallClock = () => Date.now();

type Drag = {
  grip: DialGrip;
  origin: DialRange;
  last: number;
  delta: number;
};

export function SleepClock({ draft, onChange, today, problem }: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  // The open end grows with the clock; a half-minute is fine enough for an
  // arc and the notch, and the running digits tick on their own.
  const now = useTick(30_000);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const open = draft.end === null;
  const end = draft.end ?? now;

  const apply = (grip: DialGrip, origin: DialRange, delta: number) => {
    const next = dragRange(origin, grip, delta, {
      now: wallClock(),
      step: STEP,
    });
    onChange({ start: next.start, end: open ? null : next.end });
  };

  /** The time of day under the pointer, and how far from the centre. */
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
    const hit = (e.target as Element).closest("[data-grip]");
    let grip = hit?.getAttribute("data-grip") as DialGrip | "track" | null;
    if (!grip && Math.abs(r - TRACK_R) <= ARC_W) grip = "track";
    if (!grip) return;
    const origin = { start: draft.start, end };
    let delta = 0;
    if (grip === "track") {
      // The nearer end comes to the finger.
      const toStart = wrapDelta(minuteOfDay(draft.start), minute);
      const toEnd = wrapDelta(minuteOfDay(end), minute);
      grip = open || Math.abs(toStart) <= Math.abs(toEnd) ? "start" : "end";
      delta = grip === "start" ? toStart : toEnd;
    }
    if (open && grip !== "start") grip = "start";
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { grip, origin, last: minute, delta };
    if (delta !== 0) apply(grip, origin, delta);
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const { minute } = read(e);
    d.delta += wrapDelta(d.last, minute);
    d.last = minute;
    apply(d.grip, d.origin, d.delta);
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  const onKey = (grip: DialGrip) => (e: React.KeyboardEvent<Element>) => {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? STEP
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -STEP
          : e.key === "PageUp"
            ? 60
            : e.key === "PageDown"
              ? -60
              : 0;
    if (step === 0) return;
    e.preventDefault();
    apply(grip, { start: draft.start, end }, step);
  };

  const from = minuteOfDay(draft.start);
  const to = minuteOfDay(end);
  const color = arcColor(draft.kind);
  const startPoint = pointAt(DIAL_C, DIAL_C, TRACK_R, from);
  const endPoint = pointAt(DIAL_C, DIAL_C, TRACK_R, to);
  const minutes = (end - draft.start) / 60_000;

  // Ribs across the arc every quarter hour, the texture that says it can
  // be taken hold of.
  const ribs = [];
  const first = 15 - (from % 15) || 15;
  for (let o = first; o < minutes - 10; o += 15) {
    const a = pointAt(DIAL_C, DIAL_C, TRACK_R - ARC_W / 2 + 9, from + o);
    const b = pointAt(DIAL_C, DIAL_C, TRACK_R + ARC_W / 2 - 9, from + o);
    ribs.push(
      <line
        key={o}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke="var(--color-page-bg)"
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={0.35}
      />,
    );
  }

  const StartIcon = draft.kind === "night" ? MoonIcon : SunIcon;
  const shiftable = !open;
  const later = shiftDays(end, 1) <= now;

  const overlay = (
    <>
      <path
        d={arcPath(DIAL_C, DIAL_C, TRACK_R, from, to)}
        fill="none"
        stroke={color}
        strokeWidth={ARC_W}
        strokeLinecap="round"
        opacity={draft.kind === "nap" ? 0.75 : 0.95}
        data-grip="both"
        className="cursor-grab"
      />
      <g pointerEvents="none">{ribs}</g>
      <Handle
        x={startPoint.x}
        y={startPoint.y}
        grip="start"
        label={t("sleep.form.start")}
        value={formatInstant(draft.start, locale)}
        minute={from}
        onKeyDown={onKey("start")}
      >
        <StartIcon className="h-4 w-4 text-page-bg" />
      </Handle>
      {open ? (
        <circle
          cx={endPoint.x}
          cy={endPoint.y}
          r={6}
          fill="var(--color-fg-bright)"
          className="live-glow"
          pointerEvents="none"
        />
      ) : (
        <Handle
          x={endPoint.x}
          y={endPoint.y}
          grip="end"
          label={t("sleep.form.end")}
          value={formatInstant(end, locale)}
          minute={to}
          onKeyDown={onKey("end")}
        >
          <SunriseIcon className="h-4 w-4 text-page-bg" />
        </Handle>
      )}
    </>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="grid w-full grid-cols-2 gap-2 text-center">
        <TimeColumn
          icon={<StartIcon className="h-3.5 w-3.5" />}
          label={t("sleep.form.start")}
          time={formatInstant(draft.start, locale)}
          day={relativeDay(t, draft.start, today, locale)}
          invalid={problem === "future"}
        />
        {open ? (
          <div className="flex flex-col items-center">
            <span className="flex items-center gap-1 text-xs font-bold tracking-wide text-accent uppercase">
              <SunriseIcon className="h-3.5 w-3.5" />
              {t("sleep.form.stillAsleep")}
            </span>
            <Elapsed
              from={draft.start}
              label={t("sleep.clock.asleepFor")}
              className="text-3xl font-bold text-fg-bright"
            />
            <span className="text-sm text-muted">{t("sleep.clock.now")}</span>
          </div>
        ) : (
          <TimeColumn
            icon={<SunriseIcon className="h-3.5 w-3.5" />}
            label={t("sleep.form.end")}
            time={formatInstant(end, locale)}
            day={relativeDay(t, end, today, locale)}
            invalid={problem === "future" || problem === "endBeforeStart"}
          />
        )}
      </div>

      <ClockDial
        arcs={[]}
        now={now}
        arcWidth={ARC_W}
        overlay={overlay}
        label={t("sleep.clock.label", {
          start: formatInstant(draft.start, locale),
          end: open ? t("sleep.clock.now") : formatInstant(end, locale),
        })}
        className="max-w-[20rem]"
        svgRef={svgRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />

      <div className="flex w-full items-center justify-between gap-2">
        <DayButton
          hidden={!shiftable}
          label={t("sleep.clock.dayEarlier")}
          onClick={() =>
            onChange({
              start: shiftDays(draft.start, -1),
              end: shiftDays(end, -1),
            })
          }
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </DayButton>
        <div className="flex min-w-0 flex-col items-center">
          <span
            className={`text-2xl font-bold tabular-nums ${problem ? "text-danger" : "text-fg-bright"}`}
          >
            {open ? (
              <Elapsed from={draft.start} label={t("sleep.clock.asleepFor")} />
            ) : (
              durationLabel(t, minutes)
            )}
          </span>
          <span
            role={problem ? "alert" : undefined}
            className={`text-center text-sm ${problem ? "text-danger" : "text-muted"}`}
          >
            {problem
              ? t(`sleep.form.problem.${problem}` as const)
              : t(`sleep.clock.kind.${draft.kind}` as const)}
          </span>
        </div>
        <DayButton
          hidden={!shiftable}
          disabled={!later}
          label={t("sleep.clock.dayLater")}
          onClick={() =>
            onChange({
              start: shiftDays(draft.start, 1),
              end: shiftDays(end, 1),
            })
          }
        >
          <ChevronRightIcon className="h-5 w-5" />
        </DayButton>
      </div>
    </div>
  );
}

function TimeColumn({
  icon,
  label,
  time,
  day,
  invalid,
}: {
  icon: React.ReactNode;
  label: string;
  time: string;
  day: string;
  invalid?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="flex items-center gap-1 text-xs font-bold tracking-wide text-accent uppercase">
        {icon}
        {label}
      </span>
      <span
        className={`text-3xl font-bold tabular-nums ${invalid ? "text-danger" : "text-fg-bright"}`}
      >
        {time}
      </span>
      <span className="text-sm text-muted">{day}</span>
    </div>
  );
}

/** A handle on the dial: the grip, and a slider to the keyboard. */
function Handle({
  x,
  y,
  grip,
  label,
  value,
  minute,
  onKeyDown,
  children,
}: {
  x: number;
  y: number;
  grip: DialGrip;
  label: string;
  value: string;
  minute: number;
  onKeyDown: (e: React.KeyboardEvent<Element>) => void;
  children: React.ReactNode;
}) {
  return (
    <g
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={1439}
      aria-valuenow={Math.round(minute)}
      aria-valuetext={value}
      data-grip={grip}
      onKeyDown={onKeyDown}
      className="dial-handle cursor-grab outline-none"
    >
      {/* A larger, invisible target: a fingertip is wider than the handle. */}
      <circle cx={x} cy={y} r={HANDLE_R + 8} fill="transparent" />
      <circle
        cx={x}
        cy={y}
        r={HANDLE_R + 4}
        fill="none"
        stroke="var(--color-fg-bright)"
        strokeWidth={2}
        className="dial-focus"
      />
      <circle
        cx={x}
        cy={y}
        r={HANDLE_R - 3}
        fill="var(--color-fg-bright)"
        opacity={0.25}
      />
      <g transform={`translate(${x - 8} ${y - 8})`} pointerEvents="none">
        {children}
      </g>
    </g>
  );
}

function DayButton({
  hidden,
  disabled,
  label,
  onClick,
  children,
}: {
  hidden: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  if (hidden) return <span className="h-10 w-10" />;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-fg hover:border-accent disabled:opacity-30 disabled:hover:border-line"
    >
      {children}
    </button>
  );
}

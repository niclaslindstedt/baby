// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo } from "react";

import { ClockDial, type DialArc } from "./ClockDial.tsx";
import { sleepNowLine } from "./copy.ts";
import { formatInstant } from "./format.ts";
import { MoonIcon, SunIcon, SunriseIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import { Elapsed, FillRing, ProgressRing } from "./live.tsx";
import {
  currentSleep,
  lastEndedSleep,
  spansInLast,
  sleepRing,
  STALE_SLEEP_HOURS,
  type NextSleep,
  type SleepNorm,
} from "./sleep.ts";
import type { AppData } from "./types.ts";

// The top of the Sleep tab: where the child is, on a clock that is running.
//
// The last 24 hours are drawn on the same dial a sleep is corrected on, so
// the day's shape — the night across the top, the naps below — is there
// without a word, and the sleep going on now grows round the face with a
// glowing head. In the middle, a stopwatch: how long the child has been
// asleep, or awake since the last sleep ended, ticking to the second.
//
// Nothing here is a verdict. The dial draws what was tapped and the clock
// counts from it; what those add up to against the age is on Today, behind
// the Sleep card.

type Props = {
  data: AppData;
  /** The screen's clock, a minute at a time — the digits tick on their own. */
  now: Date;
  name: string;
};

export function SleepNow({ data, now, name }: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const current = currentSleep(data, now);
  const lastEnd = lastEndedSleep(data, now);
  const awakeSince =
    !current &&
    lastEnd !== null &&
    now.getTime() - lastEnd <= STALE_SLEEP_HOURS * 3_600_000
      ? lastEnd
      : null;

  const arcs = useMemo<DialArc[]>(
    () =>
      spansInLast(data, now).map((span) => ({
        key: span.id,
        from: span.start,
        to: span.end,
        tone: span.kind,
        live: span.ongoing,
      })),
    [data, now],
  );

  const state = current
    ? current.kind === "night"
      ? t("sleep.live.night")
      : t("sleep.live.nap")
    : awakeSince !== null
      ? t("sleep.live.awake")
      : null;
  const Icon = current
    ? current.kind === "night"
      ? MoonIcon
      : SunIcon
    : SunriseIcon;

  return (
    <ClockDial
      arcs={arcs}
      now={now.getTime()}
      label={t("sleep.live.dialLabel")}
      desc={t("sleep.live.dialDesc")}
      className="max-w-[17rem]"
    >
      {/* Keyed on the state so a tap that changes it lands with a pop. */}
      <div
        key={current ? `asleep-${current.id}` : `awake-${awakeSince}`}
        className="live-pop flex flex-col items-center"
      >
        <Icon
          className={`h-5 w-5 text-accent ${current ? "live-breathe" : ""}`}
        />
        {state === null ? (
          <p className="mt-1 text-xs leading-snug text-muted">
            {t("sleep.live.idle", { name })}
          </p>
        ) : (
          <>
            <span className="mt-0.5 text-[0.65rem] font-bold tracking-wide text-accent uppercase">
              {state}
            </span>
            <Elapsed
              from={current ? Date.parse(current.start) : awakeSince!}
              label={state}
              className="text-2xl leading-tight font-bold text-fg-bright"
            />
            <span className="text-xs text-muted tabular-nums">
              {t("sleep.live.since", {
                time: formatInstant(
                  current ? Date.parse(current.start) : awakeSince!,
                  locale,
                ),
              })}
            </span>
          </>
        )}
      </div>
    </ClockDial>
  );
}

/**
 * Today's Sleep card, alive: a ring beside the headline. While the child
 * sleeps a dot orbits it, once a minute; while they are awake it fills
 * toward the suggested next sleep, and turns warm once that has passed.
 * The fill is a reading of `nextSleep`, so it lives on Today, never on the
 * tab.
 */
export function SleepRing({
  next,
  now,
  size = 48,
}: {
  next: NextSleep;
  now: Date;
  size?: number;
}) {
  const stroke = size < 44 ? 3 : 4;
  if (next.state === "asleep") {
    const Icon = next.kind === "night" ? MoonIcon : SunIcon;
    return (
      <ProgressRing value={1} spin size={size} stroke={stroke}>
        <Icon className="live-breathe h-5 w-5 text-accent" />
      </ProgressRing>
    );
  }
  const s = next.state === "awake" ? next.suggestion : null;
  const total = s ? s.at - next.since : 0;
  const value = s && total > 0 ? (now.getTime() - next.since) / total : 0;
  return (
    <ProgressRing
      value={value}
      tone={s?.overdue ? "warn" : "accent"}
      size={size}
      stroke={stroke}
    >
      <SunriseIcon
        className={`h-5 w-5 ${s?.overdue ? "text-danger" : "text-accent"}`}
      />
    </ProgressRing>
  );
}

/** Where the child is, with the clock running: "Asleep since 12:40 ·
 *  1:05:23". A night waking keeps its sentence — its point is that no time
 *  is suggested, not how long it has lasted. */
export function SleepNowLive({
  next,
  locale,
}: {
  next: NextSleep;
  locale: string;
}) {
  const t = useT();
  if (next.state === "nightWaking") return <>{sleepNowLine(t, next, locale)}</>;
  const label = t(
    next.state === "asleep"
      ? "sleep.live.asleepSince"
      : "sleep.live.awakeSince",
    { time: formatInstant(next.since, locale) },
  );
  return (
    <>
      {label} ·{" "}
      <Elapsed from={next.since} className="font-bold text-fg-bright" />
    </>
  );
}

/** The time left to the suggested sleep, counting down — or nothing once it
 *  has passed, when the line already says "any time now". */
export function SleepCountdown({ next }: { next: NextSleep }) {
  const t = useT();
  if (next.state !== "awake" || !next.suggestion || next.suggestion.overdue) {
    return null;
  }
  return (
    <span className="text-xs font-normal text-muted">
      {t("sleep.live.in")}{" "}
      <Elapsed to={next.suggestion.at} className="text-accent" />
    </span>
  );
}

/**
 * Sleep filling a ring against the recommendation for the age: the night in
 * the accent, the naps lighter on top of it, and the recommended stretch
 * washed onto the track with a tick where it begins — so a ring that
 * reaches the wash has reached the low end of the recommendation, and one
 * that closes has reached its top (`sleepRing` in `sleep.ts`). Fed by the
 * screen's clock, it fills while the child sleeps.
 */
export function SleepFill({
  norm,
  nightMinutes,
  dayMinutes,
  size,
  stroke,
  label,
  children,
}: {
  norm: SleepNorm;
  nightMinutes: number;
  dayMinutes: number;
  size: number;
  stroke: number;
  label?: string;
  children?: React.ReactNode;
}) {
  const ring = sleepRing(norm, nightMinutes, dayMinutes);
  return (
    <FillRing
      segments={[
        { value: ring.night, color: "var(--color-accent)" },
        { value: ring.day, color: "var(--color-fg-bright)", opacity: 0.6 },
      ]}
      band={[ring.bandFrom, 1]}
      size={size}
      stroke={stroke}
      label={label}
    >
      {children}
    </FillRing>
  );
}

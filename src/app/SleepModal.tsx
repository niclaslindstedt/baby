// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo } from "react";

import { addDays, type DayKey } from "@niclaslindstedt/oss-framework/calendar";

import { ageInDays } from "./age.ts";
import {
  childName,
  durationLabel,
  sleepNextLine,
  sleepNowLine,
} from "./copy.ts";
import { formatAmount, formatDay, formatInstant } from "./format.ts";
import { MoonIcon } from "./icons.tsx";
import { useLang, useT, type TFn } from "./i18n/index.ts";
import {
  averageSleep,
  nextSleep,
  sleepDays,
  sleepDiary,
  sleepNormFor,
  sleepStatus,
  sleptInLast,
  sleepRing,
  spansInLast,
  type SleepAverage,
  type SleepNorm,
  type SleepSuggestion,
} from "./sleep.ts";
import { ClockDial, type DialArc } from "./ClockDial.tsx";
import { Elapsed } from "./live.tsx";
import { SleepChart } from "./SleepChart.tsx";
import { SleepCountdown, SleepFill } from "./SleepNow.tsx";
import { SleepDiary } from "./SleepDiary.tsx";
import type { AppData } from "./types.ts";
import { Card, Heading } from "./ui.tsx";
import { ViewModal } from "./ViewModal.tsx";

// Sleep, read rather than logged: where the child is right now and when the
// next sleep is likely to suit, the last 24 hours, the averages over 30 and
// 90 days against the recommendation for the age, two weeks of totals, and
// the last week as a diary.
//
// The suggestion is a suggestion. It says what it is built from — the age
// band, the child's own last two weeks, the last nap's length — so a parent
// can weigh it against the child in front of them, and it defers to tired
// signs in so many words (see `nextSleep` in `sleep.ts`).
//
// Sleeps are logged on the Sleep tab behind this, and from the top bar's
// `+`; nothing here writes.

/** The window the totals chart draws. */
const CHART_DAYS = 14;
/** The window the diary draws — the same week the tab's list reaches back. */
const DIARY_DAYS = 7;

type Props = {
  open: boolean;
  onClose: () => void;
  data: AppData;
  today: DayKey;
  /** The clock, ticking on the screen behind this one so the two agree. */
  now: Date;
};

export function SleepModal({ open, onClose, data, today, now }: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const child = data.child;
  const name = childName(t, child);
  const ageDays = child ? ageInDays(child.birthDate, today) : -1;

  const next = useMemo(
    () => nextSleep(data, ageDays, now),
    [data, ageDays, now],
  );
  const norm = sleepNormFor(ageDays);
  const avg30 = useMemo(() => averageSleep(data, now, 30), [data, now]);
  const avg90 = useMemo(() => averageSleep(data, now, 90), [data, now]);
  const status = norm ? sleepStatus(norm, avg30) : "tooEarly";
  const last24 = useMemo(() => sleptInLast(data, now), [data, now]);
  const series = useMemo(
    () => sleepDays(data, addDays(today, -CHART_DAYS), addDays(today, -1), now),
    [data, today, now],
  );
  // The dial: the sleeps of the last day, and the window the next one is
  // suggested in, dashed. The past is drawn short of a full turn by as much
  // as the window reaches ahead, so the two never land on the same stretch
  // of the face.
  const arcs = useMemo<DialArc[]>(() => {
    const t0 = now.getTime();
    const hint =
      next?.state === "awake" && next.suggestion && next.suggestion.latest > t0
        ? {
            from: Math.max(next.suggestion.earliest, t0),
            to: next.suggestion.latest,
          }
        : null;
    const ahead = hint ? (hint.to - t0) / 3_600_000 + 0.5 : 0;
    const past: DialArc[] = spansInLast(data, now, Math.max(1, 24 - ahead)).map(
      (span) => ({
        key: span.id,
        from: span.start,
        to: span.end,
        tone: span.kind,
        live: span.ongoing,
      }),
    );
    return hint ? [...past, { key: "hint", tone: "hint", ...hint }] : past;
  }, [data, now, next]);
  const diary = useMemo(
    () => sleepDiary(data, addDays(today, -(DIARY_DAYS - 1)), today, now),
    [data, today, now],
  );

  if (!child) return null;

  const nextLine = next ? sleepNextLine(t, next, locale) : null;
  const hours = (h: number) => formatAmount(h, locale);

  return (
    <ViewModal
      open={open}
      onClose={onClose}
      title={t("sleep.title")}
      icon={<MoonIcon className="h-4 w-4" />}
      summary={
        next
          ? sleepNowLine(t, next, locale)
          : Object.keys(data.sleeps).length === 0
            ? t("sleep.noneYet", { name })
            : t("sleep.quiet")
      }
    >
      <Card>
        <Heading>{t("sleep.now")}</Heading>
        {next === null ? (
          <p className="mt-2 text-sm text-muted">
            {t("sleep.nothingToSuggest")}
          </p>
        ) : (
          <>
            <div className="mt-3">
              <ClockDial
                arcs={arcs}
                now={now.getTime()}
                label={t("sleep.live.dialLabel")}
                desc={t("sleep.live.viewDialDesc")}
                className="max-w-[17rem]"
              >
                <span className="text-[0.65rem] font-bold tracking-wide text-accent uppercase">
                  {next.state === "asleep"
                    ? t(
                        next.kind === "night"
                          ? "sleep.live.night"
                          : "sleep.live.nap",
                      )
                    : t("sleep.live.awake")}
                </span>
                <Elapsed
                  from={next.since}
                  className="text-2xl leading-tight font-bold text-fg-bright"
                />
                <span className="text-xs text-muted tabular-nums">
                  {t("sleep.live.since", {
                    time: formatInstant(next.since, locale),
                  })}
                </span>
              </ClockDial>
            </div>
            {nextLine && (
              <div className="mt-3 text-center">
                <p className="text-lg font-bold text-fg-bright">{nextLine}</p>
                {next.state === "awake" && next.suggestion && (
                  <p className="flex items-baseline justify-center gap-2 text-xs text-muted tabular-nums">
                    {formatInstant(next.suggestion.earliest, locale)}–
                    {formatInstant(next.suggestion.latest, locale)}
                    <SleepCountdown next={next} />
                  </p>
                )}
              </div>
            )}
            {next.state === "nightWaking" && (
              <p className="mt-3 text-xs text-muted">
                {t("sleep.nightWakingNote")}
              </p>
            )}
            {next.state === "awake" && next.suggestion === null && (
              <p className="mt-3 text-xs text-muted">
                {t("sleep.noSuggestionAge")}
              </p>
            )}
            {next.state === "awake" && next.suggestion && (
              <details className="group mt-3 text-xs text-muted">
                <summary className="cursor-pointer list-none text-center font-medium text-accent">
                  {t("sleep.live.how")}
                </summary>
                <div className="mt-2 flex flex-col gap-2">
                  <Explanation
                    suggestion={next.suggestion}
                    name={name}
                    t={t}
                    locale={locale}
                  />
                </div>
              </details>
            )}
          </>
        )}
      </Card>

      <Card>
        <Heading>{t("sleep.last24")}</Heading>
        {norm ? (
          <div className="mt-3 flex items-center gap-3">
            <SleepFill
              norm={norm}
              nightMinutes={last24.nightMinutes}
              dayMinutes={last24.dayMinutes}
              size={120}
              stroke={12}
              label={t("sleep.ring.label", {
                total: durationLabel(t, last24.totalMinutes),
                low: hours(norm.recommended.hours[0]),
                high: hours(norm.recommended.hours[1]),
              })}
            >
              <span className="text-sm leading-tight font-bold text-fg-bright tabular-nums">
                {durationLabel(t, last24.totalMinutes)}
              </span>
              <span className="text-[0.65rem] text-muted">
                {t("sleep.ring.of", {
                  low: hours(norm.recommended.hours[0]),
                  high: hours(norm.recommended.hours[1]),
                })}
              </span>
            </SleepFill>
            <div className="flex min-w-0 flex-col gap-1.5 text-sm">
              <Legend
                swatch="bg-accent"
                label={t("sleep.legendNight")}
                value={durationLabel(t, last24.nightMinutes)}
              />
              <Legend
                swatch="bg-fg-bright/60"
                label={t("sleep.legendDay")}
                value={durationLabel(t, last24.dayMinutes)}
              />
              <Legend
                swatch="bg-accent/20"
                label={t("sleep.legendRecommended")}
                value={`${hours(norm.recommended.hours[0])}–${hours(norm.recommended.hours[1])} h`}
              />
              <p className="mt-1 text-xs text-muted">
                {t(
                  `sleep.ring.place.${sleepRing(norm, last24.nightMinutes, last24.dayMinutes).place}` as const,
                )}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-fg-bright">
            {t("sleep.last24Line", {
              total: durationLabel(t, last24.totalMinutes),
              night: durationLabel(t, last24.nightMinutes),
              day: durationLabel(t, last24.dayMinutes),
            })}
          </p>
        )}
      </Card>

      <Card tone={status === "short" || status === "long" ? "warn" : "default"}>
        <Heading>{t("sleep.averages")}</Heading>
        <div className="mt-2 flex flex-col gap-3">
          <AverageRow
            label={t("sleep.avg30")}
            average={avg30}
            norm={norm}
            t={t}
            locale={locale}
          />
          <AverageRow
            label={t("sleep.avg90")}
            average={avg90}
            norm={norm}
            t={t}
            locale={locale}
          />
        </div>
        {norm && (
          <div className="mt-3 flex flex-col gap-2 text-xs text-muted">
            <p>
              {t("sleep.recommended", {
                low: hours(norm.recommended.hours[0]),
                high: hours(norm.recommended.hours[1]),
                mean: hours(norm.observed.mean),
                obsLow: hours(norm.observed.range[0]),
                obsHigh: hours(norm.observed.range[1]),
              })}
            </p>
            <p>{t(`sleep.band.${norm.recommended.band}` as const)}</p>
            <p
              className={
                status === "short" || status === "long"
                  ? "text-fg"
                  : status === "within"
                    ? "text-accent"
                    : undefined
              }
            >
              {t(`sleep.status.${status}` as const, { name })}
            </p>
            <p>{t("sleep.loggedNote")}</p>
          </div>
        )}
      </Card>

      {series.some((d) => d.logged) && (
        <Card>
          <Heading>{t("sleep.chart")}</Heading>
          <div className="mt-2">
            <SleepChart
              series={series}
              labels={series.map((d) => formatDay(d.day, locale))}
              recommended={norm ? norm.recommended.hours : null}
              ariaLabel={t("sleep.chart")}
              desc={t("sleep.chartDesc")}
            />
          </div>
        </Card>
      )}

      {diary.some((d) => d.segments.length > 0) && (
        <Card>
          <Heading>{t("sleep.diary")}</Heading>
          <div className="mt-2">
            <SleepDiary
              days={diary}
              labels={diary.map((d) => formatDay(d.day, locale))}
              ariaLabel={t("sleep.diary")}
              desc={t("sleep.diaryDesc")}
            />
          </div>
        </Card>
      )}

      <p className="px-1 text-xs text-muted">{t("sleep.sources")}</p>
    </ViewModal>
  );
}

/** One window's average: the total, the split, and how many days it is
 *  from. */
function AverageRow({
  label,
  average,
  norm,
  t,
  locale,
}: {
  label: string;
  average: SleepAverage | null;
  norm: SleepNorm | null;
  t: TFn;
  locale: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {norm && average && (
        <SleepFill
          norm={norm}
          nightMinutes={average.nightMinutes}
          dayMinutes={average.dayMinutes}
          size={64}
          stroke={7}
          label={t("sleep.ring.avgLabel", {
            total: durationLabel(t, average.totalMinutes),
            low: formatAmount(norm.recommended.hours[0], locale),
            high: formatAmount(norm.recommended.hours[1], locale),
          })}
        >
          <span className="text-xs font-bold text-fg-bright tabular-nums">
            {formatAmount(average.totalMinutes / 60, locale)}
            <span className="font-normal text-muted"> h</span>
          </span>
        </SleepFill>
      )}
      <div className="min-w-0">
        <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
        {average === null ? (
          <p className="text-sm text-muted">{t("sleep.avgNone")}</p>
        ) : (
          <>
            <p className="text-sm font-bold text-fg-bright tabular-nums">
              {t("sleep.avgTotal", {
                duration: durationLabel(t, average.totalMinutes),
              })}{" "}
              <span className="text-xs font-normal text-muted">
                {t("sleep.avgDays", { count: String(average.loggedDays) })}
              </span>
            </p>
            <p className="text-xs text-fg tabular-nums">
              {t("sleep.avgSplit", {
                night: durationLabel(t, average.nightMinutes),
                day: durationLabel(t, average.dayMinutes),
                naps: formatAmount(average.napsPerDay, locale),
              })}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/** What a suggestion was built from, said in the order it was built: the
 *  band for the age, the child's own windows (or their absence), the last
 *  nap's length, bedtime, and — whatever the clock says — the tired signs. */
function Explanation({
  suggestion: s,
  name,
  t,
  locale,
}: {
  suggestion: SleepSuggestion;
  name: string;
  t: TFn;
  locale: string;
}) {
  return (
    <>
      <p>
        {t("sleep.window", {
          min: durationLabel(t, s.band.min),
          max: durationLabel(t, s.band.max),
        })}{" "}
        {s.own !== null
          ? t("sleep.basisHistory", {
              name,
              window: durationLabel(t, s.own),
            })
          : t("sleep.basisAge", { name })}
      </p>
      {s.lastNap === "short" && <p>{t("sleep.shortNap")}</p>}
      {s.lastNap === "long" && <p>{t("sleep.longNap", { name })}</p>}
      {s.kind === "night" && (
        <p>
          {t("sleep.bedtimeNote", {
            name,
            time: formatInstant(s.at, locale),
          })}
        </p>
      )}
      {s.overdue && <p>{t("sleep.overdue")}</p>}
      <p>{t("sleep.suggestionHint", { name })}</p>
    </>
  );
}

/** One line of a ring's key: the swatch, what it is, and how much. */
function Legend({
  swatch,
  label,
  value,
}: {
  swatch: string;
  label: string;
  value: string;
}) {
  return (
    <p className="flex items-center gap-2">
      <span className={`h-3 w-3 shrink-0 rounded-sm ${swatch}`} />
      <span className="text-muted">{label}</span>
      <span className="ml-auto font-bold whitespace-nowrap text-fg-bright tabular-nums">
        {value}
      </span>
    </p>
  );
}

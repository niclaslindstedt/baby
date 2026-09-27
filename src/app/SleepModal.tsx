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
  type SleepAverage,
  type SleepSuggestion,
} from "./sleep.ts";
import { SleepChart } from "./SleepChart.tsx";
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
            <p className="mt-2 text-sm text-fg">
              {sleepNowLine(t, next, locale)}
            </p>
            {nextLine && (
              <p className="mt-1 text-lg font-bold text-fg-bright">
                {nextLine}
              </p>
            )}
            {next.state === "awake" && next.suggestion && (
              <p className="text-xs text-muted tabular-nums">
                {formatInstant(next.suggestion.earliest, locale)}–
                {formatInstant(next.suggestion.latest, locale)}
              </p>
            )}
            <div className="mt-3 flex flex-col gap-2 text-xs text-muted">
              {next.state === "nightWaking" && (
                <p>{t("sleep.nightWakingNote")}</p>
              )}
              {next.state === "awake" && next.suggestion === null && (
                <p>{t("sleep.noSuggestionAge")}</p>
              )}
              {next.state === "awake" && next.suggestion && (
                <Explanation
                  suggestion={next.suggestion}
                  name={name}
                  t={t}
                  locale={locale}
                />
              )}
            </div>
          </>
        )}
      </Card>

      <Card>
        <Heading>{t("sleep.last24")}</Heading>
        <p className="mt-2 text-sm text-fg-bright">
          {t("sleep.last24Line", {
            total: durationLabel(t, last24.totalMinutes),
            night: durationLabel(t, last24.nightMinutes),
            day: durationLabel(t, last24.dayMinutes),
          })}
        </p>
      </Card>

      <Card tone={status === "short" || status === "long" ? "warn" : "default"}>
        <Heading>{t("sleep.averages")}</Heading>
        <div className="mt-2 flex flex-col gap-3">
          <AverageRow
            label={t("sleep.avg30")}
            average={avg30}
            t={t}
            locale={locale}
          />
          <AverageRow
            label={t("sleep.avg90")}
            average={avg90}
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
  t,
  locale,
}: {
  label: string;
  average: SleepAverage | null;
  t: TFn;
  locale: string;
}) {
  return (
    <div>
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

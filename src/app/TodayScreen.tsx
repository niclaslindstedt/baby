// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useEffect, useMemo, useState } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";
import { Button, CloseIcon } from "@niclaslindstedt/oss-framework/components";

import { ageInDays } from "./age.ts";
import { ageLabel, childName } from "./copy.ts";
import { DiaperButtons } from "./DiaperButtons.tsx";
import { DiaperChart } from "./DiaperChart.tsx";
import {
  assessDiapers,
  changesOn,
  dailyCounts,
  lastChange,
} from "./diapers.ts";
import {
  formatClock,
  formatCm,
  formatDay,
  formatDayYear,
  formatKg,
  formatWhole,
  formatZ,
} from "./format.ts";
import { readings, trend, type GrowthStandards } from "./growth.ts";
import { AlertIcon, BowlIcon, GrowthIcon, SyringeIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import { FoodModal } from "./FoodModal.tsx";
import { GrowthModal } from "./GrowthModal.tsx";
import { assess, outgrown, regimenApplies } from "./nutrition.ts";
import { sortedMeasurements, type AppData, type DiaperKind } from "./types.ts";
import type { Features } from "./useAppSettings.ts";
import { Card, Heading } from "./ui.tsx";
import { nextDose, timeline } from "./vaccines.ts";
import { VaccinesModal } from "./VaccinesModal.tsx";

// The front page, and the only page that answers anything.
//
// The four tabs are where things go *in* — a reading, a food, a dose marked
// given. What those things add up to is here: the child's age, the diaper log,
// and the three headline answers, each of which opens its own view (see
// `ViewModal.tsx`) rather than sending the parent off to a tab. That split is
// the whole shape of the app. A tab you navigate to is a place you then have
// to navigate out of; a view you open over Today closes back onto the screen
// you were already reading, which is the right cost for "let me look at the
// curve for a second".
//
// The diaper buttons are the top of the screen because they are the reason it
// is opened most often. Under them the last 24 hours as two numbers, and the
// norm's verdict when a day looks thin.
//
// Every block below the age line belongs to a tracker, and a tracker a parent
// has switched off in Settings takes its block with it — the diaper log and
// its chart, or one of the three headline cards. The age line always stays:
// with everything off, Today is the one true sentence the app can still say.

const CHART_DAYS = 7;

type Props = {
  data: AppData;
  today: DayKey;
  standards: GrowthStandards | null;
  /** Which trackers are on. Each one owns a block of this screen. */
  features: Features;
  onLogDiaper: (kind: DiaperKind) => void;
  onRemoveDiaper: (id: string) => void;
};

/** Which headline answer is open over the screen, if any. */
type View = "growth" | "food" | "vaccines";

export function TodayScreen({
  data,
  today,
  standards,
  features,
  onLogDiaper,
  onRemoveDiaper,
}: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const child = data.child!;
  const name = childName(t, child);
  const ageDays = ageInDays(child.birthDate, today);

  // The clock, read at the edge: the "last 24 hours" window moves with it,
  // so it ticks once a minute while the screen is up. The derivation stays
  // clock-free — `now` is a parameter to it.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => setNow(new Date()), [data]);

  const breastfed = data.milk.kind === "breast" || data.milk.kind === "mixed";
  const diapers = useMemo(
    () => assessDiapers(data, ageDays, now, breastfed),
    [data, ageDays, now, breastfed],
  );
  const todays = useMemo(() => changesOn(data, today), [data, today]);
  const series = useMemo(
    () => dailyCounts(data, today, CHART_DAYS),
    [data, today],
  );
  const last = lastChange(data);

  const food = useMemo(
    () => (standards ? assess(data, today, standards.weight) : null),
    [data, today, standards],
  );
  const grownOut = useMemo(
    () => (standards ? outgrown(data, today, standards.weight) : false),
    [data, today, standards],
  );
  const weightTrend = useMemo(() => {
    if (!standards) return null;
    return trend(readings(data, standards, "weight"));
  }, [data, standards]);
  const latestMeasurement = sortedMeasurements(data).at(-1) ?? null;
  const next = useMemo(() => nextDose(timeline(data, today)), [data, today]);

  const [view, setView] = useState<View | null>(null);

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      <Card>
        <Heading>{t("today.title")}</Heading>
        <p className="mt-1 text-lg font-bold text-fg-bright">
          {t("age.line", {
            name,
            age: ageLabel(t, child.birthDate, today, locale),
          })}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {formatDayYear(today, locale)}
        </p>
      </Card>

      {features.diapers && (
        <Card>
          <Heading>{t("today.diapers")}</Heading>
          <div className="mt-3">
            <DiaperButtons onLog={onLogDiaper} />
          </div>
          {diapers && (
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
              <span className="text-xs tracking-wide text-muted uppercase">
                {t("today.last24")}
              </span>
              <span className="font-bold text-fg-bright tabular-nums">
                {t("today.wet", { count: String(diapers.wet) })}
              </span>
              <span className="font-bold text-fg-bright tabular-nums">
                {t("today.dirty", { count: String(diapers.dirty) })}
              </span>
              {last && (
                <span className="text-xs text-muted">
                  {t("today.lastChange", {
                    time: formatClock(last.at, locale),
                  })}
                </span>
              )}
            </div>
          )}
          {diapers?.tooEarly && (
            <p className="mt-2 text-xs text-muted">{t("today.noneYet")}</p>
          )}
          {diapers?.fewWet && (
            <Notice
              text={t("today.fewWet", {
                wet: String(diapers.wet),
                diapers:
                  diapers.wet === 1
                    ? t("today.diaper")
                    : t("today.diapersPlural"),
                min: String(diapers.norm.minWet),
              })}
              source={t(`today.norm.${diapers.norm.source}` as const)}
            />
          )}
          {diapers?.longDirtyGap && diapers.dirtyGapHours !== null && (
            <Notice
              text={t("today.longGap", {
                days: String(Math.floor(diapers.dirtyGapHours / 24)),
              })}
            />
          )}
        </Card>
      )}

      {features.diapers && todays.length > 0 && (
        <Card>
          <Heading>{t("today.todayLog")}</Heading>
          <ul className="mt-2 flex flex-col gap-1">
            {todays.map((change) => (
              <li
                key={change.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="text-fg">
                  <span className="mr-2 text-xs text-muted tabular-nums">
                    {formatClock(change.at, locale)}
                  </span>
                  {t(`today.${change.kind}` as const)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveDiaper(change.id)}
                  aria-label={t("today.removeChange")}
                  title={t("today.removeChange")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {features.diapers && series.some((d) => d.total > 0) && (
        <Card>
          <Heading>{t("today.chart")}</Heading>
          <div className="mt-2">
            <DiaperChart
              series={series}
              labels={series.map((d) => formatDay(d.day, locale))}
              ariaLabel={t("today.chart")}
              desc={t("today.chartDesc")}
            />
          </div>
        </Card>
      )}

      {/* The headline answers — one per tracker that is on. */}
      {features.food && (
        <HeadlineCard
          icon={<BowlIcon className="h-4 w-4" />}
          title={t("today.foodCard")}
          tone={
            grownOut
              ? "warn"
              : food && regimenApplies(food) && food.energy.status === "covered"
                ? "accent"
                : "default"
          }
          onOpen={() => setView("food")}
          openLabel={t("today.view")}
        >
          {food === null
            ? t("common.noData")
            : food.requirements.stage === "milkOnly"
              ? t("food.milkOnly", { name })
              : food.requirements.stage === "tastes"
                ? t("food.tastes")
                : food.empty
                  ? t("food.energyUnknown")
                  : grownOut
                    ? t("food.outgrown", { name })
                    : food.energy.status === "covered"
                      ? t("food.covered")
                      : t("food.low")}
          {food &&
            regimenApplies(food) &&
            !food.empty &&
            food.energy.actual !== null && (
              <span className="mt-1 block text-xs text-muted">
                {t("food.energyLine", {
                  actual: formatWhole(food.energy.actual, locale),
                  target: formatWhole(food.energy.target, locale),
                })}
              </span>
            )}
        </HeadlineCard>
      )}

      {features.growth && (
        <HeadlineCard
          icon={<GrowthIcon className="h-4 w-4" />}
          title={t("today.growthCard")}
          onOpen={() => setView("growth")}
          openLabel={t("today.view")}
        >
          {latestMeasurement === null
            ? t("today.noReadings")
            : latestMeasurement.weightKg !== null && weightTrend
              ? t("today.latestReading", {
                  value: formatKg(latestMeasurement.weightKg, locale),
                  date: formatDay(latestMeasurement.date, locale),
                  z: formatZ(weightTrend.latest, locale),
                })
              : latestMeasurement.lengthCm !== null
                ? t("today.latestReading", {
                    value: formatCm(latestMeasurement.lengthCm, locale),
                    date: formatDay(latestMeasurement.date, locale),
                    z: "",
                  })
                : formatDay(latestMeasurement.date, locale)}
          {weightTrend &&
            weightTrend.verdict !== "single" &&
            weightTrend.delta !== null && (
              <span className="mt-1 block text-xs text-muted">
                {t(
                  weightTrend.verdict === "up"
                    ? "growth.trendUp"
                    : weightTrend.verdict === "down"
                      ? "growth.trendDown"
                      : "growth.trendSteady",
                  {
                    z: formatZ(weightTrend.latest, locale),
                    delta: formatZ(weightTrend.delta, locale),
                    days: "60",
                  },
                )}
              </span>
            )}
        </HeadlineCard>
      )}

      {features.vaccines && (
        <HeadlineCard
          icon={<SyringeIcon className="h-4 w-4" />}
          title={t("today.vaccinesCard")}
          tone={next?.status === "due" ? "warn" : "default"}
          onOpen={() => setView("vaccines")}
          openLabel={t("today.view")}
        >
          {next === null
            ? t("today.allGiven")
            : t(
                next.status === "due" ? "today.nextDue" : "today.nextUpcoming",
                {
                  dose: doseName(
                    t,
                    next.dose.group,
                    next.dose.doseNumber,
                    next.dose.diseases.length,
                  ),
                  date: formatDayYear(next.due, locale),
                },
              )}
        </HeadlineCard>
      )}

      {/* The views. Mounted here rather than in the shell because every one
          of them reads the same derivations this screen already summarises —
          the card is the headline and the modal is the rest of the sentence. */}
      <GrowthModal
        open={view === "growth" && features.growth}
        onClose={() => setView(null)}
        data={data}
        today={today}
        standards={standards}
      />
      <FoodModal
        open={view === "food" && features.food}
        onClose={() => setView(null)}
        data={data}
        today={today}
        standards={standards}
      />
      <VaccinesModal
        open={view === "vaccines" && features.vaccines}
        onClose={() => setView(null)}
        data={data}
        today={today}
      />
    </div>
  );
}

/** A warning line under the diaper tally: the text, and the source of the
 *  floor it rests on. */
function Notice({ text, source }: { text: string; source?: string }) {
  return (
    <div className="mt-3 flex gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-fg">
      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
      <div>
        <p>{text}</p>
        {source && <p className="mt-1 text-xs text-muted">{source}</p>}
      </div>
    </div>
  );
}

function HeadlineCard({
  icon,
  title,
  tone = "default",
  children,
  onOpen,
  openLabel,
}: {
  icon: React.ReactNode;
  title: string;
  tone?: "default" | "accent" | "warn";
  children: React.ReactNode;
  onOpen: () => void;
  openLabel: string;
}) {
  return (
    <Card tone={tone}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-accent uppercase">
            {icon}
            {title}
          </p>
          <p className="mt-1 text-sm text-fg">{children}</p>
        </div>
        <Button onClick={onOpen}>{openLabel}</Button>
      </div>
    </Card>
  );
}

/** The name of a programme dose group, with the dose number. Exported for
 *  the Vaccines screen, which spells the same rows. */
export function doseName(
  t: ReturnType<typeof useT>,
  group: "dtp" | "pneumococcal" | "rotavirus" | "mpr" | "hpv" | "varicella",
  doseNumber: number,
  diseaseCount: number,
): string {
  const label =
    group === "dtp"
      ? diseaseCount >= 6
        ? t("vaccines.group.dtp")
        : diseaseCount === 4
          ? t("vaccines.group.dtpLate")
          : t("vaccines.group.dtpBooster")
      : t(`vaccines.group.${group}` as const);
  return `${label} · ${t("vaccines.dose", { n: String(doseNumber) })}`;
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useEffect, useMemo, useState } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";
import { ChevronRightIcon } from "@niclaslindstedt/oss-framework/components";

import { ageInDays } from "./age.ts";
import { ageLabel, childName } from "./copy.ts";
import { assessDiapers } from "./diapers.ts";
import { DiapersModal } from "./DiapersModal.tsx";
import {
  formatDay,
  formatDayYear,
  formatWhole,
  formatZ,
  measurementValues,
} from "./format.ts";
import { readings, trend, type GrowthStandards } from "./growth.ts";
import { BowlIcon, DiaperIcon, GrowthIcon, SyringeIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import { FoodModal } from "./FoodModal.tsx";
import { GrowthModal } from "./GrowthModal.tsx";
import { assess, outgrown, regimenApplies } from "./nutrition.ts";
import { sortedMeasurements, type AppData } from "./types.ts";
import type { Features } from "./useAppSettings.ts";
import { Card, Heading } from "./ui.tsx";
import { nextDose, timeline } from "./vaccines.ts";
import { VaccinesModal } from "./VaccinesModal.tsx";

// The front page, and the only page that answers anything.
//
// The tabs are where things go *in* — a diaper, a reading, a food, a dose
// marked given. What those things add up to is here: the child's age, and one
// headline answer per tracker, each of which opens its own view (see
// `ViewModal.tsx`) rather than sending the parent off to a tab. That split is
// the whole shape of the app. A tab you navigate to is a place you then have
// to navigate out of; a view you open over Today closes back onto the screen
// you were already reading, which is the right cost for "let me look at the
// curve for a second".
//
// The diaper buttons used to be the top of this screen, and are the Diapers
// tab's now — the one place a diaper is logged from besides the top bar's
// `+`, which is still a tap away from here and from everywhere else. What
// Today keeps of them is the answer: the last 24 hours in a line, warm when
// the day is thin.
//
// Every card below the age line belongs to a tracker, and a tracker a parent
// has switched off in Settings takes its card with it. The age line always
// stays: with everything off, Today is the one true sentence the app can
// still say.

type Props = {
  data: AppData;
  today: DayKey;
  standards: GrowthStandards | null;
  /** Which trackers are on. Each one owns a card of this screen. */
  features: Features;
};

/** Which headline answer is open over the screen, if any. */
type View = "diapers" | "growth" | "food" | "vaccines";

export function TodayScreen({ data, today, standards, features }: Props) {
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

  const food = useMemo(
    () => (standards ? assess(data, today, standards.weight) : null),
    [data, today, standards],
  );
  const grownOut = useMemo(
    () => (standards ? outgrown(data, today, standards.weight) : false),
    [data, today, standards],
  );
  const weightSeries = useMemo(
    () => (standards ? readings(data, standards, "weight") : []),
    [data, standards],
  );
  const weightTrend = useMemo(() => trend(weightSeries), [weightSeries]);
  // The trend sentence, when there is one: two weight readings far enough
  // apart for the difference between them to be read as a trend. It names
  // the z-score itself, so the headline above it doesn't repeat it.
  const trendLine =
    weightTrend !== null &&
    weightTrend.verdict !== "single" &&
    weightTrend.delta !== null
      ? { ...weightTrend, delta: weightTrend.delta }
      : null;

  // The newest reading, said the way the Growth tab says one: every value it
  // carries, and the z-score only when it is the weight of *this* reading
  // that the standards place. A length-only visit therefore reads
  // "80.5 cm on 3 Jun" with nothing dangling after it, and the SD beside a
  // weight is always that weight's own.
  const latest = useMemo(() => {
    const m = sortedMeasurements(data).at(-1) ?? null;
    if (!m) return null;
    const last = weightSeries.at(-1);
    return {
      date: m.date,
      values: measurementValues(m, locale),
      z: last && last.id === m.id ? last.z : null,
    };
  }, [data, weightSeries, locale]);
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

      {/* The headline answers — one per tracker that is on. */}
      {features.diapers && (
        <HeadlineCard
          icon={<DiaperIcon className="h-4 w-4" />}
          title={t("today.diapersCard")}
          tone={
            diapers && (diapers.fewWet || diapers.longDirtyGap)
              ? "warn"
              : "default"
          }
          onOpen={() => setView("diapers")}
        >
          {diapers === null || diapers.tooEarly
            ? t("diapers.noneYet")
            : t("diapers.last24Line", {
                wet: String(diapers.wet),
                dirty: String(diapers.dirty),
              })}
        </HeadlineCard>
      )}

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
        >
          {latest === null || latest.values.length === 0
            ? t("today.noReadings")
            : latest.z !== null && !trendLine
              ? t("today.latestReadingZ", {
                  value: latest.values.join(" · "),
                  date: formatDay(latest.date, locale),
                  z: formatZ(latest.z, locale),
                })
              : t("today.latestReading", {
                  value: latest.values.join(" · "),
                  date: formatDay(latest.date, locale),
                })}
          {trendLine && (
            <span className="mt-1 block text-xs text-muted">
              {t(
                trendLine.verdict === "up"
                  ? "growth.trendUp"
                  : trendLine.verdict === "down"
                    ? "growth.trendDown"
                    : "growth.trendSteady",
                {
                  z: formatZ(trendLine.latest, locale),
                  delta: formatZ(trendLine.delta, locale),
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
      <DiapersModal
        open={view === "diapers" && features.diapers}
        onClose={() => setView(null)}
        data={data}
        today={today}
        now={now}
      />
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

/**
 * One answer, and the way into the rest of it.
 *
 * The whole card is the control — see `Card`'s `onClick`. It used to carry a
 * **View** button in its corner, which said "this opens something" at the
 * cost of being the only part of the card that did: everything the card is
 * about sat outside the tap target. The chevron says the same thing and
 * takes nothing, because the target is now the card.
 */
function HeadlineCard({
  icon,
  title,
  tone = "default",
  children,
  onOpen,
}: {
  icon: React.ReactNode;
  title: string;
  tone?: "default" | "accent" | "warn";
  children: React.ReactNode;
  onOpen: () => void;
}) {
  return (
    <Card tone={tone} onClick={onOpen}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-accent uppercase">
            {icon}
            {title}
          </p>
          <p className="mt-1 text-sm text-fg">{children}</p>
        </div>
        <ChevronRightIcon
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-muted"
        />
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

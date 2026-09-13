// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";

import { childName } from "./copy.ts";
import { clockLabel, DayCoverageChart } from "./DayCoverageChart.tsx";
import {
  formatAmount,
  formatKg,
  formatPercent,
  formatWhole,
} from "./format.ts";
import type { GrowthStandards } from "./growth.ts";
import { AlertIcon, BowlIcon, ClockIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import {
  assess,
  dayCoverage,
  foodKcal,
  outgrown,
  regimenApplies,
  type NutrientLine,
} from "./nutrition.ts";
import { sortedFoods, type AppData } from "./types.ts";
import { Card, Heading } from "./ui.tsx";
import { ViewModal } from "./ViewModal.tsx";

// Does the regimen cover the day, and how does the day fill up?
//
// The first question is one number against another and always was. The second
// is what this view adds: the coverage curve puts the clock on the x axis, so
// the answer stops being "396 of about 805" and becomes a shape — filling
// steadily, front-loaded and then flat all afternoon, or never reaching the
// line at all.
//
// Read-only, like every view modal. Foods, their amounts and the times they
// are given are edited on the Food tab behind this one.

type Props = {
  open: boolean;
  onClose: () => void;
  data: AppData;
  today: DayKey;
  standards: GrowthStandards | null;
};

export function FoodModal({ open, onClose, data, today, standards }: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const name = childName(t, data.child);

  const assessment = useMemo(
    () => (standards ? assess(data, today, standards.weight) : null),
    [data, today, standards],
  );
  const grownOut = useMemo(
    () => (standards ? outgrown(data, today, standards.weight) : false),
    [data, today, standards],
  );
  const foods = sortedFoods(data);
  const coverage = useMemo(
    () =>
      assessment
        ? dayCoverage(foods, data.milk, assessment.requirements.targetKcal)
        : null,
    [foods, data.milk, assessment],
  );

  const applies = assessment ? regimenApplies(assessment) : false;
  const req = assessment?.requirements ?? null;
  const nursing = data.milk.kind === "breast" || data.milk.kind === "mixed";
  const kcal = (value: number) => formatWhole(value, locale);

  // The same sentence the Food tab used to carry: which part of the day the
  // target covers, and why the bottles move it.
  const targetText =
    req === null
      ? null
      : nursing && req.formulaKcal > 0
        ? t("food.targetMixed", {
            months: String(Math.floor(req.ageMonths)),
            milkShare: formatPercent(req.milkEnergyShare, locale),
            ml: kcal(data.milk.formulaMlPerDay ?? 0),
            formulaKcal: kcal(req.formulaKcal),
            target: kcal(req.targetKcal),
            total: kcal(req.kcalPerDay),
            weight: formatKg(req.weightKg, locale),
          })
        : nursing
          ? t("food.targetBreast", {
              months: String(Math.floor(req.ageMonths)),
              share: formatPercent(req.targetKcal / req.kcalPerDay, locale),
              target: kcal(req.targetKcal),
              total: kcal(req.kcalPerDay),
              weight: formatKg(req.weightKg, locale),
            })
          : t(
              data.milk.kind === "formula"
                ? "food.targetFormula"
                : "food.targetWholeDay",
              {
                total: kcal(req.kcalPerDay),
                weight: formatKg(req.weightKg, locale),
              },
            );

  const verdict =
    assessment === null
      ? t("common.noData")
      : !applies
        ? assessment.requirements.stage === "milkOnly"
          ? t("food.milkOnly", { name })
          : t("food.tastes")
        : assessment.empty
          ? t("food.energyUnknown")
          : grownOut
            ? t("food.outgrown", { name })
            : assessment.energy.status === "covered"
              ? t("food.covered")
              : t("food.low");

  return (
    <ViewModal
      open={open}
      onClose={onClose}
      title={t("food.assessment")}
      icon={<BowlIcon className="h-4 w-4" />}
      summary={
        <span className="flex gap-2">
          {grownOut && (
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          )}
          <span>{verdict}</span>
        </span>
      }
    >
      {applies && assessment && !assessment.empty && coverage && (
        <Card
          tone={
            grownOut
              ? "warn"
              : assessment.energy.status === "covered"
                ? "accent"
                : "default"
          }
        >
          <Heading>{t("food.coverage.title")}</Heading>
          <p className="mt-1 text-lg font-bold text-fg-bright tabular-nums">
            {t("food.energyLine", {
              actual: kcal(coverage.totalKcal),
              target: kcal(coverage.targetKcal),
            })}
          </p>
          <div className="mt-3">
            <DayCoverageChart
              coverage={coverage}
              formatValue={kcal}
              ariaLabel={t("food.coverage.title")}
              desc={t("food.coverage.chartDesc")}
            />
          </div>
          <p className="mt-2 text-sm text-fg">
            {coverage.metAtMinutes === null
              ? t("food.coverage.short", {
                  kcal: kcal(
                    Math.max(0, coverage.targetKcal - coverage.totalKcal),
                  ),
                })
              : t("food.coverage.metAt", {
                  time: clockLabel(coverage.metAtMinutes),
                })}
          </p>
          {coverage.spreadKcal > 0 && (
            <p className="mt-1 text-xs text-muted">
              {t("food.coverage.spreadNote", {
                kcal: kcal(coverage.spreadKcal),
              })}
            </p>
          )}
        </Card>
      )}

      {applies && req !== null && (
        <Card>
          <Heading>{t("food.target")}</Heading>
          <p className="mt-1 text-xs text-muted">
            {targetText}
            {req.weightSource === "reference" && (
              <> {t("food.weightReference", { name })}</>
            )}
          </p>
        </Card>
      )}

      <Card>
        <Heading>{t("food.regimen")}</Heading>
        {foods.length === 0 ? (
          <p className="mt-1 text-sm text-muted">{t("food.empty")}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {foods.map((food) => (
              <li
                key={food.id}
                className="flex items-baseline justify-between gap-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate text-fg-bright">
                    {food.name}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted tabular-nums">
                    {food.times.length > 0 ? (
                      <>
                        <ClockIcon className="h-3 w-3" />
                        {food.times.join(" · ")}
                      </>
                    ) : (
                      t("food.coverage.anytime")
                    )}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-fg tabular-nums">
                  {t("food.amountLine", {
                    amount: formatAmount(food.amount, locale),
                    unit: food.unit,
                    kcal: kcal(foodKcal(food)),
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {applies && assessment && !assessment.empty && (
        <Card>
          <Heading>{t("food.nutrients")}</Heading>
          <p className="mt-1 text-xs text-muted">
            {t("food.nutrientsHint")}
            {nursing && <> {t("food.nutrientsBreastNote")}</>}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {assessment.lines.map((line) => (
              <NutrientRow key={line.key} line={line} locale={locale} />
            ))}
          </ul>
        </Card>
      )}
    </ViewModal>
  );
}

function NutrientRow({ line, locale }: { line: NutrientLine; locale: string }) {
  const t = useT();
  const unit =
    line.key === "ironMg" || line.key === "dhaG"
      ? t("food.unit.mg")
      : line.key === "vitaminDUg"
        ? t("food.unit.ug")
        : t("food.unit.e");
  const isMax = line.key === "saturatedE";
  const tone =
    line.status === "covered"
      ? "text-accent"
      : line.status === "low" || line.status === "high"
        ? "text-danger"
        : "text-muted";
  return (
    <li className="flex items-baseline justify-between gap-2 text-sm">
      <span className="min-w-0 text-fg">
        {t(`food.nutrient.${line.key}` as Parameters<typeof t>[0])}
      </span>
      <span className="shrink-0 text-right">
        <span className="text-xs text-fg tabular-nums">
          {line.actual === null
            ? t("common.noData")
            : isMax
              ? t("food.lineMax", {
                  actual: formatAmount(line.actual, locale),
                  target: formatAmount(line.target, locale),
                  unit,
                })
              : t("food.line", {
                  actual: formatAmount(line.actual, locale),
                  target: formatAmount(line.target, locale),
                  unit,
                })}
        </span>
        <span className={`block text-xs ${tone}`}>
          {t(`food.status.${line.status}` as const)}
        </span>
      </span>
    </li>
  );
}

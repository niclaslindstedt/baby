// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo, useState } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";
import { SegmentedControl } from "@niclaslindstedt/oss-framework/components";

import { ageInMonths } from "./age.ts";
import { channelKey, childName } from "./copy.ts";
import {
  formatCm,
  formatDayYear,
  formatKg,
  formatPercent,
  formatZ,
} from "./format.ts";
import {
  adultHeightProjection,
  forecast as projectForecast,
  readings,
  targetHeight,
  trend,
  TREND_SPAN_DAYS,
  type GrowthStandards,
  type Indicator,
} from "./growth.ts";
import { GrowthChart } from "./GrowthChart.tsx";
import { GrowthIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import { sortedMeasurements, type AppData } from "./types.ts";
import { Card, Heading } from "./ui.tsx";
import { ViewModal } from "./ViewModal.tsx";

// Growth, read rather than entered: the curve for each of the three
// indicators, the trend across the SD channels, where the next readings are
// likely to land, and — for length — the two adult-height estimates.
//
// One modal with three tabs rather than three cards stacked, because the
// question is always "how is *this* measure going" and answering all three at
// once on a phone means scrolling past two charts to reach the one you came
// for. The tabs sit in the modal's pinned header, so switching never costs
// the scroll position of the card you were reading.
//
// Readings are added on the Growth tab behind this; nothing here writes.

type Props = {
  open: boolean;
  onClose: () => void;
  data: AppData;
  today: DayKey;
  standards: GrowthStandards | null;
};

export function GrowthModal({ open, onClose, data, today, standards }: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const child = data.child;
  const [indicator, setIndicator] = useState<Indicator>("weight");

  const series = useMemo(
    () => (standards && child ? readings(data, standards, indicator) : []),
    [data, standards, indicator, child],
  );
  const seriesTrend = useMemo(() => trend(series), [series]);
  const projection = useMemo(
    () =>
      standards && child
        ? projectForecast(series, standards[indicator], child.sex)
        : null,
    [series, standards, indicator, child],
  );
  const adultProjection = useMemo(() => {
    if (!standards || !child) return null;
    const lengths = readings(data, standards, "length");
    const fitted = projectForecast(lengths, standards.length, child.sex);
    const zNow =
      fitted?.zNow ?? lengths.filter((r) => r.z !== null).at(-1)?.z ?? null;
    return adultHeightProjection(
      child,
      zNow,
      ageInMonths(child.birthDate, today),
    );
  }, [data, standards, child, today]);

  if (!child) return null;
  const name = childName(t, child);
  const target = targetHeight(child);
  const all = sortedMeasurements(data);
  const format = (value: number) =>
    indicator === "weight" ? formatKg(value, locale) : formatCm(value, locale);
  const tick = (value: number) =>
    indicator === "weight" ? value.toFixed(1) : String(Math.round(value));

  return (
    <ViewModal
      open={open}
      onClose={onClose}
      title={t("growth.title")}
      icon={<GrowthIcon className="h-4 w-4" />}
      summary={
        seriesTrend
          ? t(`growth.channel.${channelKey(seriesTrend.latest)}` as const)
          : t("growth.empty")
      }
      toolbar={
        <SegmentedControl<Indicator>
          value={indicator}
          options={[
            { value: "weight", label: t("growth.weight") },
            { value: "length", label: t("growth.length") },
            { value: "head", label: t("growth.head") },
          ]}
          onChange={setIndicator}
          ariaLabel={t("growth.title")}
          fullWidth
        />
      }
    >
      {all.length === 0 || !standards ? (
        <Card>
          <p className="text-sm text-muted">{t("growth.empty")}</p>
        </Card>
      ) : (
        <>
          <Card>
            <GrowthChart
              table={standards[indicator]}
              sex={child.sex}
              series={series}
              forecast={projection}
              formatValue={format}
              formatTick={tick}
              ariaLabel={t(`growth.${indicator}` as const)}
              desc={t("growth.chartDesc", {
                indicator: t(`growth.${indicator}` as const),
              })}
            />
          </Card>

          {seriesTrend && (
            <Card
              tone={seriesTrend.verdict === "steady" ? "accent" : "default"}
            >
              <Heading>{t("growth.trend")}</Heading>
              <p className="mt-1 text-sm text-fg">
                {seriesTrend.verdict === "single" || seriesTrend.delta === null
                  ? t("growth.trendSingle", { name })
                  : t(
                      seriesTrend.verdict === "up"
                        ? "growth.trendUp"
                        : seriesTrend.verdict === "down"
                          ? "growth.trendDown"
                          : "growth.trendSteady",
                      {
                        z: formatZ(seriesTrend.latest, locale),
                        delta: formatZ(seriesTrend.delta, locale),
                        days: String(TREND_SPAN_DAYS),
                      },
                    )}
              </p>
              <p className="mt-1 text-xs text-muted">
                {t(`growth.channel.${channelKey(seriesTrend.latest)}` as const)}
              </p>
            </Card>
          )}

          {projection && projection.points.length > 1 && (
            <Card>
              <Heading>{t("growth.forecast")}</Heading>
              <p className="mt-1 text-sm text-fg">
                {Math.abs(projection.driftPerMonth) < 0.05
                  ? t("growth.forecastHolding", {
                      z: formatZ(projection.zNow, locale),
                    })
                  : t("growth.forecastDrift", {
                      z: formatZ(projection.zNow, locale),
                      drift: formatZ(projection.driftPerMonth, locale).replace(
                        " SD",
                        "",
                      ),
                    })}
              </p>
              {(() => {
                const last = projection.points[projection.points.length - 1]!;
                const band = last.bands.find((b) => b.mass === 0.8)!;
                const date = addDaysToKey(child.birthDate, last.ageDays);
                return (
                  <p className="mt-1 text-sm text-fg-bright">
                    {t("growth.forecastAt", {
                      date: formatDayYear(date, locale),
                      value: format(last.value),
                      low: format(band.lower),
                      high: format(band.upper),
                    })}
                  </p>
                );
              })()}
              <p className="mt-2 text-xs text-muted">
                {t("growth.forecastDesc")}
              </p>
            </Card>
          )}
        </>
      )}

      {indicator === "length" && (
        <>
          <Card>
            <Heading>{t("growth.target")}</Heading>
            {target ? (
              <>
                <p className="mt-1 text-sm text-fg-bright">
                  {t("growth.targetValue", {
                    cm: formatCm(target.cm, locale),
                    low: formatCm(target.low, locale),
                    high: formatCm(target.high, locale),
                  })}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t("growth.targetHint")}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted">
                {t("growth.targetMissing")}
              </p>
            )}
          </Card>

          <Card>
            <Heading>{t("growth.projection", { name })}</Heading>
            {adultProjection ? (
              <>
                <p className="mt-1 text-sm text-fg-bright">
                  {t("growth.projectionValue", {
                    cm: formatCm(adultProjection.cm, locale),
                    low: formatCm(adultProjection.low, locale),
                    high: formatCm(adultProjection.high, locale),
                  })}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t(
                    adultProjection.withParents
                      ? "growth.projectionHint"
                      : "growth.projectionHintNoParents",
                    {
                      z: formatZ(adultProjection.fromZ, locale),
                      share: formatPercent(adultProjection.correlation, locale),
                    },
                  )}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted">
                {t("growth.projectionMissing")}
              </p>
            )}
          </Card>
        </>
      )}
    </ViewModal>
  );
}

/** A day key `days` after the birth date. Local; the same arithmetic the
 *  calendar helpers do, inlined to keep the import list short. */
function addDaysToKey(birthDate: DayKey, days: number): DayKey {
  const [y, m, d] = birthDate.split("-").map(Number);
  const date = new Date(y!, m! - 1, d! + Math.round(days));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

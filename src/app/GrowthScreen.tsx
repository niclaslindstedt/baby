// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo, useState } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";
import {
  Button,
  ConfirmDialog,
  PencilIcon,
  PlusIcon,
  SegmentedControl,
} from "@niclaslindstedt/oss-framework/components";

import { ageInDays, ageInMonths } from "./age.ts";
import { ageLabel, channelKey, childName } from "./copy.ts";
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
import { GrowthIcon, TrashIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import { MeasurementForm } from "./MeasurementForm.tsx";
import { sortedMeasurements, type AppData, type Measurement } from "./types.ts";
import { Card, EmptyState, Heading } from "./ui.tsx";

// Growth: the readings on the standard curve, the trend across it, where the
// next readings are likely to land, and the expected adult height.
//
// The trend is the headline, not the latest number: Swedish child health
// care reads movement across the SD channels over time, and a single
// reading a channel low is a fact about that morning as often as about the
// child. The chart draws the channels behind the readings for exactly that
// reason — a reading is read against where the last ones sat.
//
// Readings can be added as often as a parent likes — a home scale every
// morning is fine — and the forecast's recency weighting means a run of daily
// weighings sharpens the channel estimate without letting one wet nappy's
// worth of grams swing it.

type Props = {
  data: AppData;
  today: DayKey;
  standards: GrowthStandards | null;
  onSave: (m: Measurement) => void;
  onRemove: (id: string) => void;
  onNotice: (message: string) => void;
};

export function GrowthScreen({
  data,
  today,
  standards,
  onSave,
  onRemove,
  onNotice,
}: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const child = data.child!;
  const name = childName(t, child);
  const [indicator, setIndicator] = useState<Indicator>("weight");
  const [editing, setEditing] = useState<Measurement | null | "new">(null);
  const [confirmDelete, setConfirmDelete] = useState<Measurement | null>(null);

  const series = useMemo(
    () => (standards ? readings(data, standards, indicator) : []),
    [data, standards, indicator],
  );
  const seriesTrend = useMemo(() => trend(series), [series]);
  const projection = useMemo(
    () =>
      standards
        ? projectForecast(series, standards[indicator], child.sex)
        : null,
    [series, standards, indicator, child.sex],
  );
  const target = targetHeight(child);
  const all = sortedMeasurements(data);
  // The adult-height projection reads the *length* channel whichever
  // indicator is showing, so it is computed from its own series.
  const adultProjection = useMemo(() => {
    if (!standards) return null;
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

  const format = (value: number) =>
    indicator === "weight" ? formatKg(value, locale) : formatCm(value, locale);
  const tick = (value: number) =>
    indicator === "weight" ? value.toFixed(1) : String(Math.round(value));

  if (editing !== null) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-3 px-3 py-3">
        <Card>
          <Heading>
            {editing === "new"
              ? t("growth.form.addTitle")
              : t("growth.form.editTitle")}
          </Heading>
          <div className="mt-3">
            <MeasurementForm
              initial={editing === "new" ? null : editing}
              today={today}
              onSave={(m) => {
                onSave(m);
                onNotice(t("growth.saved"));
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
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
      </div>

      {all.length === 0 ? (
        <EmptyState
          icon={<GrowthIcon className="h-8 w-8" />}
          text={t("growth.empty")}
          action={
            <Button variant="primary" onClick={() => setEditing("new")}>
              {t("growth.add")}
            </Button>
          }
        />
      ) : (
        <>
          <Card>
            {standards ? (
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
            ) : (
              <p className="text-sm text-muted">{t("common.noData")}</p>
            )}
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
      )}

      {indicator === "length" && (
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
      )}

      {all.length > 0 && (
        <Card>
          <div className="flex items-center justify-between gap-2">
            <Heading>{t("growth.readings")}</Heading>
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-accent hover:bg-surface-2"
            >
              <PlusIcon className="h-4 w-4" />
              {t("growth.add")}
            </button>
          </div>
          <ul className="mt-2 flex flex-col gap-2">
            {[...all].reverse().map((m) => {
              const placed = series.find((r) => r.id === m.id);
              return (
                <li
                  key={m.id}
                  className="flex items-start justify-between gap-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="text-fg-bright">
                      {t("growth.reading", {
                        date: formatDayYear(m.date, locale),
                        age: ageLabel(t, child.birthDate, m.date, locale),
                      })}
                    </p>
                    <p className="text-xs text-muted">
                      {[
                        m.weightKg !== null
                          ? formatKg(m.weightKg, locale)
                          : null,
                        m.lengthCm !== null
                          ? formatCm(m.lengthCm, locale)
                          : null,
                        m.headCm !== null
                          ? `${formatCm(m.headCm, locale)} ↺`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      {placed?.z !== null &&
                        placed?.z !== undefined &&
                        ` · ${formatZ(placed.z, locale)}`}
                      {placed &&
                        placed.z === null &&
                        ageInDays(child.birthDate, m.date) > 0 &&
                        ` · ${t("growth.channel.outside")}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(m)}
                      aria-label={t("common.edit")}
                      title={t("common.edit")}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(m)}
                      aria-label={t("common.delete")}
                      title={t("common.delete")}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-danger"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title={t("growth.form.deleteConfirm")}
        confirmLabel={t("common.delete")}
        tone="danger"
        labels={{ cancel: t("common.cancel"), close: t("common.close") }}
        onConfirm={() => {
          if (confirmDelete) onRemove(confirmDelete.id);
          setConfirmDelete(null);
          onNotice(t("growth.deleted"));
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
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

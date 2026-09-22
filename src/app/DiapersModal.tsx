// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";

import { ageInDays } from "./age.ts";
import { assessDiapers, dailyCounts, lastChange } from "./diapers.ts";
import { DiaperChart } from "./DiaperChart.tsx";
import { formatClock, formatDay } from "./format.ts";
import { AlertIcon, DiaperIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import type { AppData } from "./types.ts";
import { Card, Heading } from "./ui.tsx";
import { ViewModal } from "./ViewModal.tsx";

// Diapers, read rather than logged: the last 24 hours against the floor for
// the age, the source that floor comes from, and the week as a chart.
//
// The window is a rolling day, not the calendar one — "two wet diapers so
// far today" at ten in the morning is not a warning, and the question a
// nurse asks is "how many since this time yesterday?" (see `diapers.ts`).
//
// Changes are logged on the Diapers tab behind this, and from the top bar's
// `+`; nothing here writes.

/** The window the chart draws — the same week the tab's list reaches back. */
const CHART_DAYS = 7;

type Props = {
  open: boolean;
  onClose: () => void;
  data: AppData;
  today: DayKey;
  /** The clock the rolling window is read against, ticking on the screen
   *  behind this one so the two never disagree. */
  now: Date;
};

export function DiapersModal({ open, onClose, data, today, now }: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const child = data.child;
  const breastfed = data.milk.kind === "breast" || data.milk.kind === "mixed";

  const assessment = useMemo(
    () =>
      child
        ? assessDiapers(data, ageInDays(child.birthDate, today), now, breastfed)
        : null,
    [data, child, today, now, breastfed],
  );
  const series = useMemo(
    () => dailyCounts(data, today, CHART_DAYS),
    [data, today],
  );
  const last = lastChange(data);

  if (!child) return null;

  return (
    <ViewModal
      open={open}
      onClose={onClose}
      title={t("diapers.title")}
      icon={<DiaperIcon className="h-4 w-4" />}
      summary={
        assessment && !assessment.tooEarly
          ? t("diapers.last24Line", {
              wet: String(assessment.wet),
              dirty: String(assessment.dirty),
            })
          : t("diapers.noneYet")
      }
    >
      {assessment && (
        <Card
          tone={
            assessment.fewWet || assessment.longDirtyGap ? "warn" : "default"
          }
        >
          <Heading>{t("diapers.last24")}</Heading>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
            <span className="font-bold text-fg-bright tabular-nums">
              {t("diapers.wet", { count: String(assessment.wet) })}
            </span>
            <span className="font-bold text-fg-bright tabular-nums">
              {t("diapers.dirty", { count: String(assessment.dirty) })}
            </span>
            {last && (
              <span className="text-xs text-muted">
                {t("diapers.lastChange", {
                  time: formatClock(last.at, locale),
                })}
              </span>
            )}
          </div>
          {assessment.tooEarly ? (
            <p className="mt-2 text-xs text-muted">{t("diapers.noneYet")}</p>
          ) : (
            <p className="mt-2 text-xs text-muted">
              {t(`diapers.norm.${assessment.norm.source}` as const)}
            </p>
          )}
          {assessment.fewWet && (
            <Notice
              text={t("diapers.fewWet", {
                wet: String(assessment.wet),
                diapers:
                  assessment.wet === 1
                    ? t("diapers.diaper")
                    : t("diapers.diapersPlural"),
                min: String(assessment.norm.minWet),
              })}
            />
          )}
          {assessment.longDirtyGap && assessment.dirtyGapHours !== null && (
            <Notice
              text={t("diapers.longGap", {
                days: String(Math.floor(assessment.dirtyGapHours / 24)),
              })}
            />
          )}
        </Card>
      )}

      {series.some((d) => d.total > 0) && (
        <Card>
          <Heading>{t("diapers.chart")}</Heading>
          <div className="mt-2">
            <DiaperChart
              series={series}
              labels={series.map((d) => formatDay(d.day, locale))}
              ariaLabel={t("diapers.chart")}
              desc={t("diapers.chartDesc")}
            />
          </div>
        </Card>
      )}
    </ViewModal>
  );
}

/** A warning line under the tally: the number, the floor, and the sign to
 *  look for — never a verdict. */
function Notice({ text }: { text: string }) {
  return (
    <div className="mt-3 flex gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-fg">
      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
      <p>{text}</p>
    </div>
  );
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";
import { CheckIcon } from "@niclaslindstedt/oss-framework/components";

import { formatDayYear } from "./format.ts";
import { SyringeIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import type { AppData } from "./types.ts";
import { Card, Heading } from "./ui.tsx";
import {
  extraRecords,
  nextDose,
  timeline,
  type DoseTiming,
  type TimelineEntry,
  type VaccineGroup,
} from "./vaccines.ts";
import { ViewModal } from "./ViewModal.tsx";

// The vaccination card at a glance: every visit the programme schedules, in
// order, with a tick against what has been recorded.
//
// Deliberately thinner than the tab behind it. The Vaccines tab is where a
// dose is marked given, and it carries everything that costs: the route, the
// notes, the product name, the extras outside the programme with their
// offers. What a parent wants *here* is the overview — how much of the card
// is done and what the next visit is for — so the rows collapse to a tick, a
// name, and a date, and the doses that share an appointment are grouped
// under it rather than repeating the same age five times.

type Props = {
  open: boolean;
  onClose: () => void;
  data: AppData;
  today: DayKey;
};

type Visit = { due: DayKey; timing: DoseTiming; entries: TimelineEntry[] };

export function VaccinesModal({ open, onClose, data, today }: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";

  const entries = useMemo(() => timeline(data, today), [data, today]);
  const extras = useMemo(() => extraRecords(data), [data]);
  const next = useMemo(() => nextDose(entries), [entries]);

  // One row per appointment: the programme books several doses at the same
  // age, and on the card they are one visit.
  const visits: Visit[] = [];
  for (const entry of entries) {
    const last = visits[visits.length - 1];
    if (last && last.due === entry.due) last.entries.push(entry);
    else
      visits.push({
        due: entry.due,
        timing: entry.dose.timing,
        entries: [entry],
      });
  }

  const given = entries.filter((e) => e.status === "given").length;

  const timingLabel = (timing: DoseTiming) => {
    switch (timing.kind) {
      case "weeks":
        return t("vaccines.at.weeks", { count: String(timing.weeks) });
      case "months":
        return t("vaccines.at.months", { count: String(timing.months) });
      case "years":
        return t("vaccines.at.years", { count: String(timing.years) });
      case "school":
        return t("vaccines.at.school", { grade: timing.grade });
    }
  };

  return (
    <ViewModal
      open={open}
      onClose={onClose}
      title={t("vaccines.title")}
      icon={<SyringeIcon className="h-4 w-4" />}
      summary={
        next === null
          ? t("today.allGiven")
          : t(next.status === "due" ? "today.nextDue" : "today.nextUpcoming", {
              dose: `${t(`vaccines.short.${shortKey(next.dose.group, next.dose.diseases.length)}` as const)} · ${t("vaccines.dose", { n: String(next.dose.doseNumber) })}`,
              date: formatDayYear(next.due, locale),
            })
      }
    >
      <Card>
        <div className="flex items-baseline justify-between gap-2">
          <Heading>{t("vaccines.programme")}</Heading>
          <span className="shrink-0 text-xs whitespace-nowrap text-muted tabular-nums">
            {t("vaccines.recordedCount", {
              given: String(given),
              total: String(entries.length),
            })}
          </span>
        </div>
        <ul className="mt-3 flex flex-col gap-3">
          {visits.map((visit) => {
            const allGiven = visit.entries.every((e) => e.status === "given");
            const anyDue = visit.entries.some((e) => e.status === "due");
            return (
              <li key={visit.due}>
                <p
                  className={`flex flex-wrap items-baseline gap-x-2 text-xs font-medium ${
                    anyDue
                      ? "text-danger"
                      : allGiven
                        ? "text-accent"
                        : "text-fg"
                  }`}
                >
                  <span>{timingLabel(visit.timing)}</span>
                  <span className="text-muted tabular-nums">
                    {formatDayYear(visit.due, locale)}
                  </span>
                </p>
                <ul className="mt-1 flex flex-col gap-1">
                  {visit.entries.map((entry) => (
                    <li
                      key={entry.dose.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Tick given={entry.status === "given"} />
                      <span
                        className={
                          entry.status === "given"
                            ? "text-fg"
                            : "text-fg-bright"
                        }
                      >
                        {t(
                          `vaccines.short.${shortKey(entry.dose.group, entry.dose.diseases.length)}` as const,
                        )}
                        <span className="text-muted">
                          {" · "}
                          {t("vaccines.dose", {
                            n: String(entry.dose.doseNumber),
                          })}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted">{t("vaccines.sources")}</p>
      </Card>

      {extras.length > 0 && (
        <Card>
          <Heading>{t("vaccines.extras")}</Heading>
          <ul className="mt-2 flex flex-col gap-1">
            {extras.map((v) => (
              <li key={v.id} className="flex items-center gap-2 text-sm">
                <Tick given />
                <span className="min-w-0 text-fg">
                  {v.doseId === "other"
                    ? v.label || t("vaccines.extra.other")
                    : t(
                        `vaccines.extra.${v.doseId}` as Parameters<typeof t>[0],
                      )}
                  <span className="text-muted tabular-nums">
                    {" · "}
                    {formatDayYear(v.date, locale)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </ViewModal>
  );
}

/** The overview's one mark: a filled tick for a recorded dose, an empty ring
 *  for one still ahead.
 *
 *  The empty ring is drawn in the foreground colour at low alpha rather than
 *  in `--line`. A hairline token disappears against the card on the light
 *  theme, and a row whose mark you cannot see reads as a row the list forgot
 *  to align — the whole point of the column is that "not yet" is a visible
 *  answer, not an absence. */
function Tick({ given }: { given: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
        given
          ? "border-accent bg-accent text-page-bg"
          : "border-fg/25 text-transparent"
      }`}
    >
      <CheckIcon className="h-3 w-3" />
    </span>
  );
}

/** The short name of a dose group — "DTP-polio-Hib-HepB" rather than the six
 *  diseases spelled out. The overview trades the full names for rows a parent
 *  can scan; the Vaccines tab still spells them. */
type ShortKey = Exclude<VaccineGroup, "dtp"> | "dtp" | "dtpLate" | "dtpBooster";

function shortKey(group: VaccineGroup, diseaseCount: number): ShortKey {
  if (group !== "dtp") return group;
  return diseaseCount >= 6
    ? "dtp"
    : diseaseCount === 4
      ? "dtpLate"
      : "dtpBooster";
}

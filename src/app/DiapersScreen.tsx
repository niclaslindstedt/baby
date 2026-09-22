// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";
import { CloseIcon } from "@niclaslindstedt/oss-framework/components";

import { DiaperButtons } from "./DiaperButtons.tsx";
import { recentByDay } from "./diapers.ts";
import { formatClock, formatDay } from "./format.ts";
import { useLang, useT } from "./i18n/index.ts";
import type { AppData, DiaperKind } from "./types.ts";
import { Card, Heading } from "./ui.tsx";

// Diapers, the input side: the three buttons, and the changes they wrote.
//
// This used to be the top of Today. It is a tab now for the same reason
// Growth, Food and Vaccines are: a tracker you switch on gets a place to put
// records into. What the log *means* — the last 24 hours against the floor
// for the age, the week's chart, the norm the warning rests on — is an
// answer, and answers are on Today behind the Diapers card
// (`DiapersModal.tsx`). Nothing on this screen is derived.
//
// The buttons are still reachable from anywhere without coming here: the
// top bar's `+` opens the same three (see `DiaperSheet.tsx`), and both write
// through the same `addDiaper` edit. This screen is where you come to *look*
// at what was logged and take back a mistap.
//
// The list is a week deep, not the whole history. A mistap is noticed the
// same day or the next morning, and a diaper log is the one record in the
// app that grows by several rows a day — a full history would be a scroll
// with nothing at the bottom of it.

/** How far back the correctable list reaches. The same week the chart in the
 *  view draws, so the two agree about what "recently" means. */
const LIST_DAYS = 7;

type Props = {
  data: AppData;
  today: DayKey;
  onLog: (kind: DiaperKind) => void;
  onRemove: (id: string) => void;
};

export function DiapersScreen({ data, today, onLog, onRemove }: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";

  const days = useMemo(
    () => recentByDay(data, today, LIST_DAYS),
    [data, today],
  );
  const hasToday = days[0]?.day === today;

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      <Card>
        <Heading>{t("diapers.log")}</Heading>
        <p className="mt-1 text-xs text-muted">{t("diapers.logHint")}</p>
        <div className="mt-3">
          <DiaperButtons onLog={onLog} />
        </div>
      </Card>

      <Card>
        <Heading>{t("diapers.recent")}</Heading>
        <p className="mt-1 text-xs text-muted">{t("diapers.recentHint")}</p>
        {/* Today always gets a line, even with nothing under it: an empty
            today is a prompt to tap, not a gap in the list. */}
        {!hasToday && (
          <p className="mt-3 text-sm text-muted">{t("diapers.noneToday")}</p>
        )}
        {days.length === 0 ? (
          <p className="mt-1 text-xs text-muted">{t("diapers.noneYet")}</p>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {days.map(({ day, changes }) => (
              <div key={day}>
                <p className="text-xs tracking-wide text-muted uppercase">
                  {day === today
                    ? t("diapers.dayToday")
                    : formatDay(day, locale)}
                </p>
                <ul className="mt-1 flex flex-col gap-1">
                  {changes.map((change) => (
                    <li
                      key={change.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="text-fg">
                        <span className="mr-2 text-xs text-muted tabular-nums">
                          {formatClock(change.at, locale)}
                        </span>
                        {t(`diapers.${change.kind}` as const)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemove(change.id)}
                        aria-label={t("diapers.removeChange")}
                        title={t("diapers.removeChange")}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

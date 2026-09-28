// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { Button, Modal } from "@niclaslindstedt/oss-framework/components";

import { DiaperButtons } from "./DiaperButtons.tsx";
import { useT } from "./i18n/index.ts";
import { SleepButtons } from "./SleepButtons.tsx";
import type { AppData, DiaperKind, SleepKind } from "./types.ts";

// The sheet behind the top bar's `+`: the two things logged several times a
// day — a diaper and a sleep — from any screen. A modal rather than a screen
// on purpose: logging a change must not cost the chart someone was reading
// on Growth. A tap on a button asks when (`WhenModal.tsx`, over this
// sheet), and the answer logs and closes both.
//
// Each half is a tracker a parent can switch off, and a switched-off one
// takes its half with it; with both off the `+` is not on the bar at all
// (see `TopBar.tsx`). The buttons are the same components the Diapers and
// Sleep tabs render, writing through the same edits.

type Props = {
  open: boolean;
  /** Which halves to show — the trackers that are on. */
  diapers: boolean;
  sleep: boolean;
  onLogDiaper: (kind: DiaperKind, at: Date) => void;
  /** The document, which the sleep half reads its state from. */
  data: AppData;
  onStartSleep: (kind: SleepKind, at: Date) => void;
  onWake: (at: Date) => void;
  onClose: () => void;
};

const TITLE_ID = "quick-log-title";

export function QuickLogSheet({
  open,
  diapers,
  sleep,
  onLogDiaper,
  data,
  onStartSleep,
  onWake,
  onClose,
}: Props) {
  const t = useT();
  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={TITLE_ID}
      centered
      closeLabel={t("common.close")}
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-3 px-4 py-3">
          <Button onClick={onClose}>{t("common.cancel")}</Button>
        </div>
      }
    >
      <div className="shrink-0 border-b border-line bg-surface-3 px-4 py-3">
        <h2
          id={TITLE_ID}
          className="text-xs font-bold tracking-wide text-accent uppercase"
        >
          {diapers && sleep
            ? t("quickLog.title")
            : sleep
              ? t("quickLog.titleSleep")
              : t("quickLog.titleDiaper")}
        </h2>
        <p className="mt-0.5 text-sm text-fg-bright">
          {t("quickLog.subtitle")}
        </p>
      </div>
      <div className="flex flex-col gap-4 px-4 py-4">
        {diapers && (
          <section className="flex flex-col gap-2">
            {sleep && (
              <h3 className="text-xs font-medium text-muted">
                {t("quickLog.diaper")}
              </h3>
            )}
            <DiaperButtons
              onLog={(kind, at) => {
                onLogDiaper(kind, at);
                onClose();
              }}
              large
            />
          </section>
        )}
        {sleep && (
          <section className="flex flex-col gap-2">
            {diapers && (
              <h3 className="text-xs font-medium text-muted">
                {t("quickLog.sleep")}
              </h3>
            )}
            <SleepButtons
              data={data}
              onStart={(kind, at) => {
                onStartSleep(kind, at);
                onClose();
              }}
              onWake={(at) => {
                onWake(at);
                onClose();
              }}
              large
            />
          </section>
        )}
      </div>
    </Modal>
  );
}

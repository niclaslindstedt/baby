// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo, useState } from "react";

import { dayKeyOf, type DayKey } from "@niclaslindstedt/oss-framework/calendar";
import {
  ChevronRightIcon,
  ConfirmDialog,
  PlusIcon,
} from "@niclaslindstedt/oss-framework/components";

import { childName, durationLabel } from "./copy.ts";
import { formatClock, formatDay } from "./format.ts";
import { AlertIcon, MoonIcon, SunIcon } from "./icons.tsx";
import { useLocale, useT } from "./i18n/index.ts";
import { Elapsed } from "./live.tsx";
import { currentSleep, recentSleepsByDay, unfinishedSleeps } from "./sleep.ts";
import { SleepButtons } from "./SleepButtons.tsx";
import { SleepForm } from "./SleepForm.tsx";
import { SleepNow } from "./SleepNow.tsx";
import type { AppData, SleepKind, SleepSession } from "./types.ts";
import { Card, Heading } from "./ui.tsx";
import { useNow } from "./useNow.ts";

// Sleep, the input side — and the reference for how every tracker's tab
// should feel: the record running on a live clock at the top, the buttons
// that write it under that, and the week's records under those, each one a
// tap from being put right. Shapes and running numbers rather than
// paragraphs about them.
//
// A sleep is two taps — **Nap** or **Night** when the child falls asleep,
// **Woke up** when they wake — and the same buttons sit behind the top bar's
// `+`. The dial above them (`SleepNow.tsx`) draws the last 24 hours as they
// were tapped, and counts the sleep or the waking going on now to the
// second. What the log adds up to — the averages against the age, when the
// next sleep is likely to suit — is an answer, and answers are on Today
// behind the Sleep card (`SleepModal.tsx`).
//
// Unlike a diaper change, a sleep can be *corrected*: a "fell asleep"
// noticed ten minutes late, a "woke up" tapped at breakfast, a nap nobody
// logged. Tapping a row, or **Add**, opens the sleep on the dial
// (`SleepForm.tsx`), a week deep, grouped by the day each sleep belongs to
// — a night counts toward the evening it began (see `sleep.ts`).

/** How far back the correctable list reaches. */
const LIST_DAYS = 7;

type Editing = { sleep: SleepSession | null; finish: boolean };

type Props = {
  data: AppData;
  today: DayKey;
  onStart: (kind: SleepKind, at: Date) => void;
  onWake: (at: Date) => void;
  onRemoveMistaps: (ids: string[]) => void;
  onSave: (sleep: SleepSession) => void;
  onRemove: (id: string) => void;
};

export function SleepScreen({
  data,
  today,
  onStart,
  onWake,
  onRemoveMistaps,
  onSave,
  onRemove,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const name = childName(t, data.child);
  const now = useNow(data);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SleepSession | null>(null);

  const current = useMemo(() => currentSleep(data, now), [data, now]);
  const unfinished = useMemo(() => unfinishedSleeps(data, now), [data, now]);
  const days = useMemo(
    () => recentSleepsByDay(data, today, LIST_DAYS),
    [data, today],
  );

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      <Card>
        <SleepNow data={data} now={now} name={name} />
        <div className="mt-4">
          <SleepButtons
            data={data}
            onStart={onStart}
            onWake={onWake}
            onRemoveMistaps={onRemoveMistaps}
            showStatus={false}
          />
        </div>
      </Card>

      {/* A "woke up" that was never tapped. Its end is unknown, so nothing
          counts it until a parent says when it was. */}
      {unfinished.map((s) => (
        <Card key={s.id} tone="warn">
          <div className="flex gap-2 text-sm text-fg">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <div className="min-w-0">
              <p>
                {t("sleep.unfinished", {
                  date: formatDay(dayKeyOf(new Date(s.start)), locale),
                  time: formatClock(s.start, locale),
                  name,
                })}
              </p>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditing({ sleep: s, finish: true })}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {t("sleep.finish")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(s)}
                  className="text-sm text-muted hover:text-danger"
                >
                  {t("common.remove")}
                </button>
              </div>
            </div>
          </div>
        </Card>
      ))}

      <Card>
        <div className="flex items-center justify-between gap-2">
          <Heading>{t("sleep.recent")}</Heading>
          <button
            type="button"
            onClick={() => setEditing({ sleep: null, finish: false })}
            className="flex items-center gap-1.5 rounded-full border border-accent/50 px-3 py-1.5 text-sm text-accent hover:bg-accent/10"
          >
            <PlusIcon className="h-4 w-4" />
            {t("sleep.add")}
          </button>
        </div>
        {days.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            {t("sleep.noneYet", { name })}
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {days.map(({ day, sleeps }) => (
              <div key={day}>
                <p className="text-xs tracking-wide text-muted uppercase">
                  {day === today ? t("sleep.dayToday") : formatDay(day, locale)}
                </p>
                <ul className="mt-1 flex flex-col gap-1">
                  {sleeps.map((s) => (
                    <li key={s.id}>
                      <SleepRow
                        sleep={s}
                        running={s.end === null && s.id === current?.id}
                        locale={locale}
                        onOpen={() =>
                          setEditing({
                            sleep: s,
                            finish: s.end === null && s.id !== current?.id,
                          })
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      {editing && (
        <SleepForm
          key={editing.sleep?.id ?? "new"}
          initial={editing.sleep}
          finish={editing.finish}
          today={today}
          onSave={(sleep) => {
            onSave(sleep);
            setEditing(null);
          }}
          onDelete={
            editing.sleep
              ? () => {
                  setConfirmDelete(editing.sleep);
                  setEditing(null);
                }
              : undefined
          }
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title={t("sleep.form.deleteConfirm")}
        confirmLabel={t("common.delete")}
        tone="danger"
        labels={{ cancel: t("common.cancel"), close: t("common.close") }}
        onConfirm={() => {
          if (confirmDelete) onRemove(confirmDelete.id);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

/** One sleep in the week's list: the kind, the times, and how long — the
 *  running one on a live clock — and the whole row opens it on the dial. */
function SleepRow({
  sleep: s,
  running,
  locale,
  onOpen,
}: {
  sleep: SleepSession;
  running: boolean;
  locale: string;
  onOpen: () => void;
}) {
  const t = useT();
  const start = formatClock(s.start, locale);
  const Icon = s.kind === "night" ? MoonIcon : SunIcon;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t("sleep.editRow", {
        kind: t(`sleep.${s.kind}` as const),
        span:
          s.end === null
            ? t("sleep.spanOpen", { start })
            : t("sleep.span", { start, end: formatClock(s.end, locale) }),
      })}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition-colors hover:bg-surface-2 active:bg-surface-2"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          s.kind === "night"
            ? "bg-accent/20 text-accent"
            : "bg-fg-bright/10 text-fg-bright"
        }`}
      >
        <Icon className={`h-4 w-4 ${running ? "live-breathe" : ""}`} />
      </span>
      <span className="min-w-0 flex-1 text-fg-bright tabular-nums">
        {s.end === null
          ? t("sleep.spanOpen", { start })
          : t("sleep.span", { start, end: formatClock(s.end, locale) })}
      </span>
      <span className="shrink-0 text-xs text-muted tabular-nums">
        {running ? (
          <span className="flex items-center gap-1.5 text-accent">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />
            <Elapsed from={Date.parse(s.start)} />
          </span>
        ) : s.end === null ? (
          t("sleep.notEnded")
        ) : (
          durationLabel(t, (Date.parse(s.end) - Date.parse(s.start)) / 60_000)
        )}
      </span>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
    </button>
  );
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo, useState } from "react";

import { dayKeyOf, type DayKey } from "@niclaslindstedt/oss-framework/calendar";
import {
  ConfirmDialog,
  PencilIcon,
  PlusIcon,
} from "@niclaslindstedt/oss-framework/components";

import { childName } from "./copy.ts";
import { formatClock, formatDay } from "./format.ts";
import { AlertIcon, MoonIcon, SunIcon, TrashIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import { currentSleep, recentSleepsByDay, unfinishedSleeps } from "./sleep.ts";
import { SleepButtons } from "./SleepButtons.tsx";
import { SleepForm } from "./SleepForm.tsx";
import type { AppData, SleepKind, SleepSession } from "./types.ts";
import { Card, Heading } from "./ui.tsx";
import { useNow } from "./useNow.ts";

// Sleep, the input side: the buttons, and the sleeps they wrote.
//
// A sleep is two taps — **Nap** or **Night** when the child falls asleep,
// **Woke up** when they wake — and the same buttons sit behind the top bar's
// `+`, so a sleep can be started from whatever screen is open. What the log
// adds up to — how long the child has been awake, when the next sleep is
// likely to suit, the averages against the recommendation for the age — is
// an answer, and answers are on Today behind the Sleep card
// (`SleepModal.tsx`). Nothing on this screen is derived; the list shows the
// times as they were recorded.
//
// Unlike a diaper change, a sleep can be *edited*: a "fell asleep" noticed
// ten minutes late, a "woke up" tapped at breakfast, a nap nobody logged.
// The list is where that happens, a week deep, grouped by the day each sleep
// belongs to — a night counts toward the evening it began (see `sleep.ts`).

/** How far back the correctable list reaches. */
const LIST_DAYS = 7;

type Props = {
  data: AppData;
  today: DayKey;
  onStart: (kind: SleepKind) => void;
  onWake: () => void;
  onSave: (sleep: SleepSession) => void;
  onRemove: (id: string) => void;
};

export function SleepScreen({
  data,
  today,
  onStart,
  onWake,
  onSave,
  onRemove,
}: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const name = childName(t, data.child);
  const now = useNow(data);
  const [editing, setEditing] = useState<SleepSession | null | "new">(null);
  const [confirmDelete, setConfirmDelete] = useState<SleepSession | null>(null);

  const current = useMemo(() => currentSleep(data, now), [data, now]);
  const unfinished = useMemo(() => unfinishedSleeps(data, now), [data, now]);
  const days = useMemo(
    () => recentSleepsByDay(data, today, LIST_DAYS),
    [data, today],
  );

  if (editing !== null) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-3 px-3 py-3">
        <Card>
          <Heading>
            {editing === "new"
              ? t("sleep.form.addTitle")
              : t("sleep.form.editTitle")}
          </Heading>
          <div className="mt-3">
            <SleepForm
              initial={editing === "new" ? null : editing}
              today={today}
              onSave={(sleep) => {
                onSave(sleep);
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          </div>
        </Card>
      </div>
    );
  }

  const span = (s: SleepSession) =>
    s.end === null
      ? t("sleep.spanOpen", { start: formatClock(s.start, locale) })
      : t("sleep.span", {
          start: formatClock(s.start, locale),
          end: formatClock(s.end, locale),
        });

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      <Card>
        <Heading>{t("sleep.log")}</Heading>
        <p className="mt-1 text-xs text-muted">
          {t("sleep.logHint", { name })}
        </p>
        <div className="mt-3">
          <SleepButtons current={current} onStart={onStart} onWake={onWake} />
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
                  onClick={() => setEditing(s)}
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
            onClick={() => setEditing("new")}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-accent hover:bg-surface-2"
          >
            <PlusIcon className="h-4 w-4" />
            {t("sleep.add")}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">{t("sleep.recentHint")}</p>
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
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-fg">
                        {s.kind === "night" ? (
                          <MoonIcon className="h-4 w-4 shrink-0 text-accent" />
                        ) : (
                          <SunIcon className="h-4 w-4 shrink-0 text-accent" />
                        )}
                        <span className="tabular-nums">{span(s)}</span>
                        <span className="truncate text-xs text-muted">
                          {s.end === null && s.id === current?.id
                            ? t("sleep.stillAsleep")
                            : t(`sleep.${s.kind}` as const)}
                        </span>
                      </span>
                      <span className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(s)}
                          aria-label={t("common.edit")}
                          title={t("common.edit")}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(s)}
                          aria-label={t("common.delete")}
                          title={t("common.delete")}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-danger"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

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

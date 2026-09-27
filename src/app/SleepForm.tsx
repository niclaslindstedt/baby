// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useId, useState } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";
import {
  CheckIcon,
  CloseIcon,
  Modal,
  SegmentedControl,
} from "@niclaslindstedt/oss-framework/components";

import { useT } from "./i18n/index.ts";
import { TrashIcon } from "./icons.tsx";
import { useTick } from "./live.tsx";
import { SleepClock } from "./SleepClock.tsx";
import { sleepDraft, sleepEditProblem, type SleepDraft } from "./sleepEdit.ts";
import { newId, type SleepKind, type SleepSession } from "./types.ts";

// One sleep, set after the fact: the sleep nobody tapped, the one tapped
// late, the "woke up" that never was. The buttons are the normal way in
// (`SleepButtons.tsx`); this is the correction, and it asks for exactly what
// the buttons would have recorded — the kind, and the two ends — on the
// dial (`SleepClock.tsx`) rather than in two date fields and two time
// fields.
//
// A sheet over the Sleep tab, shaped like the phone's own alarm editor:
// cancel on the left, the title, save on the right. It never closes on a
// swipe down — that gesture is the dial's. Save stays greyed while the dial
// holds a sleep that can't be saved, and the line under the dial says why,
// so nothing is refused after the tap.

type Props = {
  /** The sleep being corrected, or null for a new one. */
  initial: SleepSession | null;
  /** An open sleep being ended: the dial opens with an end to drag. */
  finish?: boolean;
  today: DayKey;
  onSave: (sleep: SleepSession) => void;
  /** Present for a sleep that exists — the sheet's own way to remove it. */
  onDelete?: () => void;
  onClose: () => void;
};

export function SleepForm({
  initial,
  finish = false,
  today,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const t = useT();
  const titleId = useId();
  const now = useTick(30_000);
  const [draft, setDraft] = useState<SleepDraft>(() =>
    sleepDraft(initial, Date.now(), finish),
  );
  const problem = sleepEditProblem(draft, now);

  const setOpen = (open: boolean) => {
    if (open) {
      setDraft({ ...draft, end: null });
      return;
    }
    const guess = sleepDraft(
      {
        id: "",
        kind: draft.kind,
        start: new Date(draft.start).toISOString(),
        end: null,
        updatedAt: "",
      },
      Date.now(),
      true,
    );
    setDraft({ ...draft, end: guess.end });
  };

  const save = () => {
    if (sleepEditProblem(draft, Date.now()) !== null) return;
    onSave({
      id: initial?.id ?? newId(),
      kind: draft.kind,
      start: new Date(draft.start).toISOString(),
      end: draft.end === null ? null : new Date(draft.end).toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy={titleId}
      closeLabel={t("common.close")}
      swipeToClose={false}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-surface-3 px-3 py-2">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.cancel")}
          title={t("common.cancel")}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-fg hover:border-accent"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
        <h2 id={titleId} className="text-base font-bold text-fg-bright">
          {initial === null
            ? t("sleep.form.addTitle")
            : finish
              ? t("sleep.form.finishTitle")
              : t("sleep.form.editTitle")}
        </h2>
        <button
          type="button"
          onClick={save}
          disabled={problem !== null}
          aria-label={t("sleep.form.save")}
          title={t("sleep.form.save")}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-page-bg transition-opacity hover:brightness-110 disabled:opacity-30"
        >
          <CheckIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-page-bg px-4 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          <SegmentedControl<SleepKind>
            value={draft.kind}
            options={[
              { value: "nap", label: t("sleep.nap") },
              { value: "night", label: t("sleep.night") },
            ]}
            onChange={(kind) => setDraft({ ...draft, kind })}
            ariaLabel={t("sleep.form.kind")}
            fullWidth
          />

          <div className="rounded-2xl border border-line bg-surface-3 p-4">
            <SleepClock
              draft={draft}
              onChange={(range) => setDraft({ ...draft, ...range })}
              today={today}
              problem={problem}
            />
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={draft.end === null}
            onClick={() => setOpen(draft.end !== null)}
            className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface-3 px-4 py-3 text-left text-sm text-fg-bright"
          >
            {t("sleep.form.stillAsleep")}
            <span
              aria-hidden="true"
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                draft.end === null ? "bg-accent" : "bg-muted/40"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left] ${
                  draft.end === null ? "left-[1.375rem]" : "left-0.5"
                }`}
              />
            </span>
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface-3 px-4 py-3 text-sm text-danger hover:border-danger"
            >
              <TrashIcon className="h-4 w-4" />
              {t("sleep.form.delete")}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

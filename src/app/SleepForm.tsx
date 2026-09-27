// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import {
  addDays,
  dayKeyOf,
  type DayKey,
} from "@niclaslindstedt/oss-framework/calendar";
import {
  Button,
  SegmentedControl,
} from "@niclaslindstedt/oss-framework/components";

import { useT } from "./i18n/index.ts";
import { STALE_SLEEP_HOURS } from "./sleep.ts";
import {
  isClockTime,
  newId,
  type SleepKind,
  type SleepSession,
} from "./types.ts";
import { DateField, INPUT_CLASS, INPUT_INVALID_CLASS } from "./ui.tsx";

// One sleep, typed in: for the sleep nobody tapped, and for the one tapped
// late. The buttons are the normal way in (`SleepButtons.tsx`); this form is
// the correction, so it asks for exactly what a button would have recorded —
// the kind, when it began, and when it ended or that it hasn't yet.

type Props = {
  initial: SleepSession | null;
  today: DayKey;
  onSave: (sleep: SleepSession) => void;
  onCancel: () => void;
};

/** `HH:MM` of an ISO timestamp, in local time. */
function clockOf(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** A local day and `HH:MM` as an instant. */
function instantOf(day: string, time: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !isClockTime(time)) return null;
  const [y, m, d] = day.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y!, m! - 1, d!, h!, min!).getTime();
}

export function SleepForm({ initial, today, onSave, onCancel }: Props) {
  const t = useT();
  const [kind, setKind] = useState<SleepKind>(initial?.kind ?? "nap");
  const [startDay, setStartDay] = useState<string>(
    initial ? dayKeyOf(new Date(initial.start)) : today,
  );
  const [startTime, setStartTime] = useState(
    initial ? clockOf(initial.start) : "",
  );
  const [open, setOpen] = useState(initial !== null && initial.end === null);
  // An open sleep being finished most likely ended the morning after, if it
  // was a night, and the same day if it was a nap.
  const [endDay, setEndDay] = useState<string>(() => {
    if (!initial) return today;
    if (initial.end) return dayKeyOf(new Date(initial.end));
    const startDay = dayKeyOf(new Date(initial.start));
    const next = initial.kind === "night" ? addDays(startDay, 1) : startDay;
    return next > today ? today : next;
  });
  const [endTime, setEndTime] = useState(
    initial?.end ? clockOf(initial.end) : "",
  );
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const start = instantOf(startDay, startTime);
    if (start === null) {
      setError(t("sleep.form.startMissing"));
      return;
    }
    const now = Date.now();
    if (start > now) {
      setError(t("sleep.form.inFuture"));
      return;
    }
    let end: number | null = null;
    if (!open) {
      end = instantOf(endDay, endTime);
      if (end === null) {
        setError(t("sleep.form.endMissing"));
        return;
      }
      if (end > now) {
        setError(t("sleep.form.inFuture"));
        return;
      }
      if (end <= start) {
        setError(t("sleep.form.endBeforeStart"));
        return;
      }
    }
    // Longer than any one sleep: almost always a date left on the wrong day.
    if ((end ?? now) - start > STALE_SLEEP_HOURS * 3_600_000) {
      setError(t("sleep.form.tooLong"));
      return;
    }
    onSave({
      id: initial?.id ?? newId(),
      kind,
      start: new Date(start).toISOString(),
      end: end === null ? null : new Date(end).toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const timeInput = (
    value: string,
    onChange: (next: string) => void,
    label: string,
  ) => (
    <input
      type="time"
      value={value}
      aria-label={label}
      onInput={(e) => {
        onChange(e.currentTarget.value);
        setError(null);
      }}
      className={
        error && !isClockTime(value) ? INPUT_INVALID_CLASS : INPUT_CLASS
      }
    />
  );

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <SegmentedControl<SleepKind>
        value={kind}
        options={[
          { value: "nap", label: t("sleep.nap") },
          { value: "night", label: t("sleep.night") },
        ]}
        onChange={setKind}
        ariaLabel={t("sleep.form.kind")}
        fullWidth
      />
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-fg">
          {t("sleep.form.start")}
        </span>
        <div className="grid grid-cols-[3fr_2fr] gap-2">
          <DateField
            label={t("sleep.form.start")}
            value={startDay}
            max={today}
            onChange={(day) => {
              setStartDay(day);
              // An end still on the old day follows the start, so a sleep
              // moved to yesterday doesn't suddenly span a day.
              if (endDay === startDay) setEndDay(day);
              setError(null);
            }}
          />
          {timeInput(startTime, setStartTime, t("sleep.form.startTime"))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-fg">
        <input
          type="checkbox"
          checked={open}
          onChange={(e) => {
            setOpen(e.currentTarget.checked);
            setError(null);
          }}
          className="h-4 w-4 accent-[var(--color-accent)]"
        />
        {t("sleep.form.stillAsleep")}
      </label>
      {!open && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg">
            {t("sleep.form.end")}
          </span>
          <div className="grid grid-cols-[3fr_2fr] gap-2">
            <DateField
              label={t("sleep.form.end")}
              value={endDay}
              max={today}
              onChange={(day) => {
                setEndDay(day);
                setError(null);
              }}
            />
            {timeInput(endTime, setEndTime, t("sleep.form.endTime"))}
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" variant="primary">
          {t("sleep.form.save")}
        </Button>
        <Button onClick={onCancel}>{t("common.cancel")}</Button>
      </div>
    </form>
  );
}

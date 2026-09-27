// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import { durationLabel } from "./copy.ts";
import { formatClock, formatInstant } from "./format.ts";
import { MoonIcon, SunIcon, SunriseIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import { Elapsed } from "./live.tsx";
import { currentSleep, lastEndedSleep } from "./sleep.ts";
import {
  latestClockTime,
  sleepTimeProblem,
  type SleepTimeProblem,
} from "./sleepEdit.ts";
import { isClockTime, type AppData, type SleepKind } from "./types.ts";
import { INPUT_CLASS } from "./ui.tsx";
import { useNow } from "./useNow.ts";

// The whole of sleep logging: **Nap** and **Night** while the child is awake,
// **Woke up** while they are asleep. Two places render it — the Sleep tab and
// the sheet behind the top bar's `+` — and both write through the same
// `saveSleep` edit; one component, as with `DiaperButtons`, so the two can't
// drift into two ways of claiming the same thing.
//
// Which of the two a sleep is, is the parent's tap rather than the app's
// guess (see `SleepKind`). The time is the moment of the tap — unless the
// **When** row above the buttons says otherwise. A sleep rarely starts with a
// hand free: the child drops off in a pram or on an arm, and the phone comes
// out twenty minutes later. So the row offers the usual lags as one tap
// each — five minutes ago to an hour ago — and a clock for anything else,
// and whichever is picked applies to the next tap, start or wake, and then
// goes back to **Now**. A time that can't be right (in the future, a wake
// before the sleep began, a start before the last one ended) is refused
// before anything is written. A whole sleep that was never tapped is **Add
// a sleep** on the Sleep tab.
//
// Big for the same reason the diaper buttons are: the tap happens in a dark
// room with a sleeping child on one arm.

type Props = {
  /** The document, for the sleep running now and the last one's end. */
  data: AppData;
  onStart: (kind: SleepKind, at: Date) => void;
  onWake: (at: Date) => void;
  /** Taller buttons, for the sheet. */
  large?: boolean;
  /** The running sleep's line, with its clock. Off on the Sleep tab, whose
   *  dial already says it (`SleepNow.tsx`). */
  showStatus?: boolean;
};

const KINDS: SleepKind[] = ["nap", "night"];

/** The lags the **When** row offers, in minutes; 0 is now. */
const AGO = [0, 5, 10, 15, 30, 45, 60];

type When = number | "pick";

export function SleepButtons({
  data,
  onStart,
  onWake,
  large,
  showStatus = true,
}: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const now = useNow(data);
  const current = currentSleep(data, now);
  const [when, setWhen] = useState<When>(0);
  const [picked, setPicked] = useState("");
  const [problem, setProblem] = useState<SleepTimeProblem | null>(null);

  /** The moment the next tap stands for, read at the tap. */
  const momentOf = (tap: Date): Date | null => {
    if (when === "pick") {
      return isClockTime(picked) ? latestClockTime(picked, tap) : null;
    }
    return new Date(tap.getTime() - when * 60_000);
  };

  const commit = (write: (at: Date) => void) => {
    const tap = new Date();
    const at = momentOf(tap);
    if (at === null) return;
    const trouble = sleepTimeProblem(data, at, tap);
    if (trouble) {
      setProblem(trouble);
      return;
    }
    write(at);
    setWhen(0);
    setProblem(null);
  };

  const button = `flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-accent bg-accent/10 font-medium text-fg-bright transition-colors hover:bg-accent/20 active:bg-accent/30 ${
    large ? "min-h-24 text-base" : "min-h-14 text-sm"
  }`;
  const icon = large ? "h-7 w-7" : "h-5 w-5";
  const preview = when === 0 ? null : momentOf(now);
  const lastEnd = lastEndedSleep(data, now);

  return (
    <div className="flex flex-col gap-2">
      {showStatus && current && (
        <p className="flex items-center gap-1.5 text-sm text-fg-bright">
          {current.kind === "night" ? (
            <MoonIcon className="live-breathe h-4 w-4 text-accent" />
          ) : (
            <SunIcon className="live-breathe h-4 w-4 text-accent" />
          )}
          <span className="min-w-0 flex-1">
            {t(
              current.kind === "night"
                ? "sleep.asleepNight"
                : "sleep.asleepNap",
              { time: formatClock(current.start, locale) },
            )}
          </span>
          <Elapsed
            from={Date.parse(current.start)}
            className="font-bold text-accent"
          />
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium text-muted">
            {current ? t("sleep.when.woke") : t("sleep.when.fell")}
          </span>
          {preview && (
            <span className="text-xs text-fg tabular-nums">
              {t("sleep.when.at", {
                time: formatInstant(preview.getTime(), locale),
              })}
            </span>
          )}
        </div>
        <div
          role="radiogroup"
          aria-label={current ? t("sleep.when.woke") : t("sleep.when.fell")}
          className="flex flex-wrap gap-1.5"
        >
          {[...AGO, "pick" as const].map((option) => {
            const on = when === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setWhen(option);
                  setProblem(null);
                  if (option === "pick" && picked === "") {
                    setPicked(formatClockValue(now));
                  }
                }}
                className={`rounded-full border px-2.5 py-1 text-xs tabular-nums transition-colors ${
                  on
                    ? "border-accent bg-accent text-page-bg"
                    : "border-line bg-surface text-fg hover:border-accent"
                }`}
              >
                {option === "pick"
                  ? t("sleep.when.pick")
                  : option === 0
                    ? t("sleep.when.now")
                    : t("sleep.when.ago", {
                        duration: durationLabel(t, option),
                      })}
              </button>
            );
          })}
        </div>
        {when === "pick" && (
          <input
            type="time"
            value={picked}
            aria-label={current ? t("sleep.when.woke") : t("sleep.when.fell")}
            onInput={(e) => {
              setPicked(e.currentTarget.value);
              setProblem(null);
            }}
            className={`${INPUT_CLASS} max-w-40`}
          />
        )}
      </div>

      {current ? (
        <button type="button" onClick={() => commit(onWake)} className={button}>
          <SunriseIcon className={`${icon} text-accent`} />
          {t("sleep.wokeUp")}
        </button>
      ) : (
        <div
          role="group"
          aria-label={t("sleep.title")}
          className="grid grid-cols-2 gap-2"
        >
          {KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => commit((at) => onStart(kind, at))}
              className={button}
            >
              {kind === "night" ? (
                <MoonIcon className={`${icon} text-accent`} />
              ) : (
                <SunIcon className={`${icon} text-accent`} />
              )}
              {t(`sleep.${kind}` as const)}
            </button>
          ))}
        </div>
      )}

      {problem && (
        <p role="alert" className="text-xs text-danger">
          {t(`sleep.when.problem.${problem}` as const, {
            start: current ? formatClock(current.start, locale) : "",
            end: lastEnd === null ? "" : formatInstant(lastEnd, locale),
          })}
        </p>
      )}
    </div>
  );
}

/** `HH:MM` of a moment, local time — the value a time input holds. */
function formatClockValue(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

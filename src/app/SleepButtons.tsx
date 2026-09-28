// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState, type ComponentType } from "react";

import { childName, durationLabel } from "./copy.ts";
import { formatClock, formatInstant } from "./format.ts";
import { MoonIcon, SunIcon, SunriseIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import { Elapsed } from "./live.tsx";
import { currentSleep, lastEndedSleep } from "./sleep.ts";
import {
  blockingMistaps,
  sleepDefault,
  sleepEarliest,
  sleepTimeProblem,
  type SleepTimeProblem,
} from "./sleepEdit.ts";
import type { AppData, SleepKind } from "./types.ts";
import { useNow } from "./useNow.ts";
import { WhenModal } from "./WhenModal.tsx";

// The whole of sleep logging: **Nap** and **Night** while the child is awake,
// **Woke up** while they are asleep. Two places render it — the Sleep tab and
// the sheet behind the top bar's `+` — and both write through the same
// `saveSleep` edit; one component, as with `DiaperButtons`, so the two can't
// drift into two ways of claiming the same thing.
//
// Which of the two a sleep is, is the parent's tap rather than the app's
// guess (see `SleepKind`). *When* is the question the tap opens
// (`WhenModal.tsx`): a sleep rarely starts with a hand free — the child
// drops off in a pram or on an arm, and the phone comes out twenty minutes
// later — so after **Now** the sheet offers the usual lags as one tap each
// and a dial for anything further back. The lags that can't be right — a
// wake before the sleep began, a start before the last one ended — are
// dimmed before they can be tapped (`sleepEarliest`), and the moment is
// checked once more as it is written (`sleepTimeProblem`). When all that
// stands in the way is a sleep of under a minute — a tap taken back — the
// sheet offers to remove it there and then (`blockingMistaps`), so last
// night can still be logged the morning after. A whole sleep
// that was never tapped is **Add a sleep** on the Sleep tab.
//
// Big for the same reason the diaper buttons are: the tap happens in a dark
// room with a sleeping child on one arm.

type Props = {
  /** The document, for the sleep running now and the last one's end. */
  data: AppData;
  onStart: (kind: SleepKind, at: Date) => void;
  onWake: (at: Date) => void;
  /** Removes taken-back sleeps (`blockingMistaps`) that stand in the way
   *  of an earlier start — the one thing the "when?" sheet offers to do
   *  besides answer. */
  onRemoveMistaps: (ids: string[]) => void;
  /** Taller buttons, for the sheet. */
  large?: boolean;
  /** The running sleep's line, with its clock. Off on the Sleep tab, whose
   *  dial already says it (`SleepNow.tsx`). */
  showStatus?: boolean;
};

const KINDS: SleepKind[] = ["nap", "night"];

/** What a tap is waiting on a time for. */
type Asking = SleepKind | "wake";

const ASKING_ICON: Record<Asking, ComponentType<{ className?: string }>> = {
  nap: SunIcon,
  night: MoonIcon,
  wake: SunriseIcon,
};

export function SleepButtons({
  data,
  onStart,
  onWake,
  onRemoveMistaps,
  large,
  showStatus = true,
}: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const now = useNow(data);
  const current = currentSleep(data, now);
  const name = childName(t, data.child);
  const [asking, setAsking] = useState<Asking | null>(null);
  const [problem, setProblem] = useState<SleepTimeProblem | null>(null);

  const ask = (what: Asking) => {
    setProblem(null);
    setAsking(what);
  };

  const commit = (at: Date) => {
    const what = asking;
    setAsking(null);
    if (what === null) return;
    const trouble = sleepTimeProblem(data, at, new Date());
    if (trouble) {
      setProblem(trouble);
      return;
    }
    if (what === "wake") onWake(at);
    else onStart(what, at);
  };

  const button = `flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-accent bg-accent/10 font-medium text-fg-bright transition-colors hover:bg-accent/20 active:bg-accent/30 ${
    large ? "min-h-24 text-base" : "min-h-14 text-sm"
  }`;
  const icon = large ? "h-7 w-7" : "h-5 w-5";
  const lastEnd = lastEndedSleep(data, now);
  const earliest = sleepEarliest(data, now);
  const mistaps = blockingMistaps(data, now);
  const usual = asking === null ? null : sleepDefault(data, asking, now);
  const problemArgs = {
    start: current ? formatClock(current.start, locale) : "",
    end: lastEnd === null ? "" : formatInstant(lastEnd, locale),
  };

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

      {current ? (
        <button
          type="button"
          onClick={() => ask("wake")}
          aria-haspopup="dialog"
          className={button}
        >
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
              onClick={() => ask(kind)}
              aria-haspopup="dialog"
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
          {t(`sleep.when.problem.${problem}` as const, problemArgs)}
        </p>
      )}

      <WhenModal
        open={asking !== null}
        icon={ASKING_ICON[asking ?? "nap"]}
        title={
          asking === "wake" || asking === null
            ? t("sleep.wokeUp")
            : t(`sleep.${asking}` as const)
        }
        question={t(asking === "wake" ? "sleep.when.woke" : "sleep.when.fell", {
          name,
        })}
        earliest={earliest?.at ?? null}
        earliestNote={
          !earliest
            ? undefined
            : mistaps.length === 1
              ? t("sleep.when.limit.mistap", problemArgs)
              : mistaps.length > 1
                ? t("sleep.when.limit.mistaps", {
                    ...problemArgs,
                    count: String(mistaps.length),
                  })
                : t(`sleep.when.limit.${earliest.reason}` as const, problemArgs)
        }
        usual={
          usual
            ? {
                at: usual.at,
                label:
                  usual.reason === "napLength"
                    ? t("sleep.when.usual.napLength", {
                        duration: durationLabel(
                          t,
                          (usual.at - Date.parse(current?.start ?? "")) /
                            60_000,
                        ),
                      })
                    : t(`sleep.when.usual.${usual.reason}` as const),
              }
            : undefined
        }
        earliestAction={
          mistaps.length > 0
            ? {
                label:
                  mistaps.length === 1
                    ? t("sleep.when.removeMistap")
                    : t("sleep.when.removeMistaps", {
                        count: String(mistaps.length),
                      }),
                onClick: () => onRemoveMistaps(mistaps.map((s) => s.id)),
              }
            : undefined
        }
        onPick={commit}
        onClose={() => setAsking(null)}
      />
    </div>
  );
}

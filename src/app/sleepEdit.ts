// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The sleep log, written: which moments a tap or a correction can stand
// for. `sleep.ts` reads the log; this is the small set of rules a time has to
// pass before it is written into it — checked before anything is saved, so a
// mis-picked time is refused rather than logged and corrected later.
//
// Two ways in. A tap on the sleep buttons records one moment, now or a
// picked time before it (`sleepTimeProblem`, and `sleepEarliest` for the
// bound the "when?" sheet reads). A correction on the Sleep tab's
// dial records a whole span at once (`sleepEditProblem`, and `sleepDraft`
// for where the dial opens). Pure and clock-free: `now` is a parameter.

import { currentSleep, lastEndedSleep, STALE_SLEEP_HOURS } from "./sleep.ts";
import type { AppData, SleepKind, SleepSession } from "./types.ts";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** Why a time can't be used for the next tap. */
export type SleepTimeProblem = "future" | "beforeStart" | "beforeLastSleep";

/**
 * Whether `at` can be the moment of the next tap — a wake if a sleep is
 * running, a start if not — or why not: it hasn't happened yet, a wake before
 * the sleep began, or a start before the last sleep ended.
 */
export function sleepTimeProblem(
  data: AppData,
  at: Date,
  now: Date,
): SleepTimeProblem | null {
  const t = at.getTime();
  if (t > now.getTime()) return "future";
  const current = currentSleep(data, now);
  if (current) return t <= Date.parse(current.start) ? "beforeStart" : null;
  const last = lastEndedSleep(data, now);
  return last !== null && t < last ? "beforeLastSleep" : null;
}

/**
 * The earliest moment the next tap may stand for, and why nothing before it
 * can: a wake just after the running sleep began, a start no earlier than
 * the last sleep ended. Null when nothing bounds it. The "when?" sheet reads
 * it to leave out the lags that `sleepTimeProblem` would refuse.
 */
export function sleepEarliest(
  data: AppData,
  now: Date,
): { at: number; reason: "beforeStart" | "beforeLastSleep" } | null {
  const current = currentSleep(data, now);
  if (current) {
    return { at: Date.parse(current.start) + 1, reason: "beforeStart" };
  }
  const last = lastEndedSleep(data, now);
  return last === null ? null : { at: last, reason: "beforeLastSleep" };
}

/**
 * The shortest sleep that is a sleep: anything under a minute is a tap
 * taken back — **Nap** then **Woke up** in the same breath — not something
 * the child did. The app's own line; no source draws one.
 */
export const MISTAP_MS = 60_000;

/** Whether an ended sleep is a tap taken back rather than a sleep. */
export function isMistap(s: SleepSession): boolean {
  if (s.end === null) return false;
  return Date.parse(s.end) - Date.parse(s.start) < MISTAP_MS;
}

/** Whether a wake at `at` takes back the sleep that began at `start`,
 *  rather than ending it: the tap came within a minute of the start. */
export function wakeTakesBack(start: number, at: number): boolean {
  return at - start < MISTAP_MS;
}

/**
 * The taken-back sleeps that stand between the next start and an earlier
 * time: the sub-minute sleeps ending after the last real one did, while
 * nobody is asleep. They bound a start as hard as a real sleep would —
 * a start before one would run over it — so the "when?" sheet offers to
 * remove them rather than leave "correct that one in the list first" as
 * the only way on. Oldest first.
 */
export function blockingMistaps(data: AppData, now: Date): SleepSession[] {
  if (currentSleep(data, now)) return [];
  const t = now.getTime();
  let realEnd = -Infinity;
  const mistaps: SleepSession[] = [];
  for (const s of Object.values(data.sleeps)) {
    if (s.end === null) continue;
    const end = Date.parse(s.end);
    if (Number.isNaN(end) || end > t) continue;
    if (isMistap(s)) mistaps.push(s);
    else realEnd = Math.max(realEnd, end);
  }
  return mistaps
    .filter((s) => Date.parse(s.end!) > realEnd)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

/** A sleep as the dial edits it: two instants, the second null while the
 *  child is still asleep. */
export type SleepDraft = { kind: SleepKind; start: number; end: number | null };

/** Why a corrected sleep can't be saved. */
export type SleepEditProblem = "future" | "endBeforeStart" | "tooLong";

/**
 * Whether a corrected sleep can be saved, or why not: a moment that hasn't
 * happened yet, an end at or before the start, or a span longer than any one
 * sleep (`STALE_SLEEP_HOURS` — almost always an end left on the wrong day).
 * An open sleep runs to `now` for the length check, as it would be read.
 */
export function sleepEditProblem(
  draft: Pick<SleepDraft, "start" | "end">,
  now: number,
): SleepEditProblem | null {
  if (draft.start > now || (draft.end !== null && draft.end > now)) {
    return "future";
  }
  if (draft.end !== null && draft.end <= draft.start) return "endBeforeStart";
  if ((draft.end ?? now) - draft.start > STALE_SLEEP_HOURS * HOUR) {
    return "tooLong";
  }
  return null;
}

/** How long a sleep being finished is first drawn: a nap one sleep cycle
 *  and a bit, a night the ten hours the nights settle toward in the first
 *  year. Only where the dial opens — the parent drags it to the real time. */
const FINISH_GUESS_MINUTES: Record<SleepKind, number> = {
  nap: 60,
  night: 10 * 60,
};

/**
 * Where the dial opens.
 *
 * A new sleep is the hour up to now, as a nap — the commonest thing
 * logged after the fact. A sleep being edited opens as it was recorded, and
 * the one running now stays open. An open sleep being `finish`ed — a "woke
 * up" that was never tapped — gets an end guessed from its kind, never past
 * `now`. Every time the dial proposes is on the five-minute grid.
 */
export function sleepDraft(
  initial: SleepSession | null,
  now: number,
  finish = false,
): SleepDraft {
  const grid = 5 * MINUTE;
  const floor = Math.floor(now / grid) * grid;
  if (!initial) {
    return { kind: "nap", start: floor - HOUR, end: floor };
  }
  const start = Date.parse(initial.start);
  if (initial.end !== null) {
    return { kind: initial.kind, start, end: Date.parse(initial.end) };
  }
  if (!finish) return { kind: initial.kind, start, end: null };
  const guess = start + FINISH_GUESS_MINUTES[initial.kind] * MINUTE;
  const end = Math.max(Math.min(guess, floor), start + grid);
  return { kind: initial.kind, start, end: Math.min(end, now) };
}

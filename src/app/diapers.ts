// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The diaper log, counted. A change is a kind and a moment; everything a
// screen shows about diapers — today's tally, the week's daily counts, how
// long since the last one — is a count over those moments at read time.
//
// A change's day is the *local* day it was logged on: a change at 23:40 is
// part of that evening, and the day boundary is the parent's, not UTC's. So
// the day key is derived from the timestamp in local time, and the tests
// build their timestamps the same way.

import {
  addDays,
  dayKeyOf,
  type DayKey,
} from "@niclaslindstedt/oss-framework/calendar";

import { sortedDiapers, type AppData, type DiaperChange } from "./types.ts";

/** The local calendar day a change fell on. */
export function dayOfChange(change: DiaperChange): DayKey {
  return dayKeyOf(new Date(change.at));
}

/** One day's tally. `wet` counts every diaper with pee in it (pee or both)
 *  and `dirty` every one with poo — the two numbers a child health nurse
 *  asks for. */
export type DiaperCount = {
  day: DayKey;
  pee: number;
  poo: number;
  both: number;
  wet: number;
  dirty: number;
  total: number;
};

function emptyCount(day: DayKey): DiaperCount {
  return { day, pee: 0, poo: 0, both: 0, wet: 0, dirty: 0, total: 0 };
}

function add(count: DiaperCount, change: DiaperChange): void {
  count[change.kind] += 1;
  if (change.kind !== "poo") count.wet += 1;
  if (change.kind !== "pee") count.dirty += 1;
  count.total += 1;
}

/** The tally for one day. */
export function diapersOn(data: AppData, day: DayKey): DiaperCount {
  const count = emptyCount(day);
  for (const change of Object.values(data.diapers)) {
    if (dayOfChange(change) === day) add(count, change);
  }
  return count;
}

/** The changes logged on one day, newest first. */
export function changesOn(data: AppData, day: DayKey): DiaperChange[] {
  return sortedDiapers(data).filter((c) => dayOfChange(c) === day);
}

/** One tally per day over the last `days` days, ending on and including
 *  `today`, oldest first. Days with nothing logged are zero rather than
 *  absent — a chart column of zero is the truthful mark for "no change
 *  logged", and for a diaper log a quiet day is worth seeing. */
export function dailyCounts(
  data: AppData,
  today: DayKey,
  days: number,
): DiaperCount[] {
  const byDay = new Map<DayKey, DiaperCount>();
  for (let i = days - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    byDay.set(day, emptyCount(day));
  }
  for (const change of Object.values(data.diapers)) {
    const count = byDay.get(dayOfChange(change));
    if (count) add(count, change);
  }
  return [...byDay.values()];
}

/** The most recent change of all, or null. */
export function lastChange(data: AppData): DiaperChange | null {
  return sortedDiapers(data)[0] ?? null;
}

// ── What a day should hold ──────────────────────────────────────────────────
//
// How many wet and dirty diapers a baby of a given age is expected to
// produce, so the app can say when a day looks thin. Every number is a floor
// quoted by a child health source, scoped to an age band, and the rules are
// deliberately the cautious end of what the sources allow: a warning here is
// "worth a look", never a diagnosis.
//
// Wet diapers. The first days ramp with the milk — one on day one, two on day
// two, three on day three, four on day four (NHS, La Leche League, AAP) —
// and from day five the Swedish floor applies: "minst sex gånger per dag"
// (1177, both the breastfeeding and the formula page; Rikshandboken: "kissar
// ljust minst 6 gånger varje dygn"). From about six weeks the diapers get
// heavier and fewer, five to six a day (La Leche League; AAP calls fewer
// than six a dehydration sign in infants), and the app's floor drops to
// five. Past the first birthday the sources give no count — a toddler's
// bladder holds more and the diaper is dry for longer — so the floor is a
// soft four, and the copy says so.
//
// Dirty diapers. Newborns should pass meconium within two days (1177), then
// at least two soft yellow stools a day through the first six weeks for a
// breastfed baby (NHS); a formula-fed baby about one a day (AAP), with a gap
// of a couple of days acceptable (1177). After six weeks a breastfed baby's
// interval is *not* a signal on its own — 1177: "tio–tolv dagar eller
// längre", Rikshandboken: "10–14 dagar" — so the app only mentions a gap
// beyond fourteen days. From solids on, 1177's constipation definition is
// fewer than three a week with hard stools; the app flags four stool-free
// days, and the copy points at the stool's consistency rather than at the
// count alone.
//
// The window is the *last 24 hours*, not the calendar day: a calendar day is
// only complete at midnight, and "two wet diapers so far today" at ten in
// the morning is not a warning. A rolling day asks the question the nurse
// asks — "how many since this time yesterday?" — and can be asked at any
// hour.

/** The floors for an age band. Ages in days since birth, `to` exclusive. */
export type DiaperNorm = {
  fromDays: number;
  toDays: number;
  /** Fewest wet diapers in 24 hours before the day looks thin. */
  minWet: number;
  /** Most hours between dirty diapers before the gap is worth a look, or
   *  null when the sources say the interval alone means nothing. */
  maxDirtyGapHours: number | null;
  /** Which source the floor comes from, as an i18n key the screen quotes. */
  source: "firstDays" | "newborn" | "infant" | "toddler";
};

/** The norms, by age. `newborn` runs to six weeks; `infant` to the first
 *  birthday; `toddler` beyond. */
export const DIAPER_NORMS: DiaperNorm[] = [
  {
    fromDays: 0,
    toDays: 1,
    minWet: 1,
    maxDirtyGapHours: 48,
    source: "firstDays",
  },
  {
    fromDays: 1,
    toDays: 2,
    minWet: 2,
    maxDirtyGapHours: 48,
    source: "firstDays",
  },
  {
    fromDays: 2,
    toDays: 3,
    minWet: 3,
    maxDirtyGapHours: 48,
    source: "firstDays",
  },
  {
    fromDays: 3,
    toDays: 4,
    minWet: 4,
    maxDirtyGapHours: 48,
    source: "firstDays",
  },
  {
    fromDays: 4,
    toDays: 42,
    minWet: 6,
    maxDirtyGapHours: 48,
    source: "newborn",
  },
  {
    fromDays: 42,
    toDays: 183,
    minWet: 5,
    maxDirtyGapHours: null,
    source: "infant",
  },
  {
    fromDays: 183,
    toDays: 365,
    minWet: 5,
    maxDirtyGapHours: 96,
    source: "infant",
  },
  {
    fromDays: 365,
    toDays: Infinity,
    minWet: 4,
    maxDirtyGapHours: 96,
    source: "toddler",
  },
];

/** The dirty-diaper interval beyond which even a breastfed baby's gap is
 *  mentioned: Rikshandboken's "10–14 dagar". */
export const BREASTFED_MAX_DIRTY_GAP_HOURS = 14 * 24;

/** The norm for an age. Null before birth. */
export function normFor(ageDays: number): DiaperNorm | null {
  if (ageDays < 0) return null;
  return (
    DIAPER_NORMS.find((n) => ageDays >= n.fromDays && ageDays < n.toDays) ??
    null
  );
}

/** The tally of the last `hours` hours before `now`. */
export function recentCounts(
  data: AppData,
  now: Date,
  hours = 24,
): { wet: number; dirty: number; total: number } {
  const since = now.getTime() - hours * 3600 * 1000;
  let wet = 0;
  let dirty = 0;
  let total = 0;
  for (const change of Object.values(data.diapers)) {
    const at = Date.parse(change.at);
    if (Number.isNaN(at) || at < since || at > now.getTime()) continue;
    total += 1;
    if (change.kind !== "poo") wet += 1;
    if (change.kind !== "pee") dirty += 1;
  }
  return { wet, dirty, total };
}

/** Hours since the last dirty diaper, or null when none is logged. */
export function hoursSinceDirty(data: AppData, now: Date): number | null {
  let latest: number | null = null;
  for (const change of Object.values(data.diapers)) {
    if (change.kind === "pee") continue;
    const at = Date.parse(change.at);
    if (Number.isNaN(at) || at > now.getTime()) continue;
    if (latest === null || at > latest) latest = at;
  }
  return latest === null ? null : (now.getTime() - latest) / 3600000;
}

/** What the log says about the last day, against the norm for the age. */
export type DiaperAssessment = {
  norm: DiaperNorm;
  wet: number;
  dirty: number;
  /** Below the wet floor for the age. */
  fewWet: boolean;
  /** Hours since the last dirty diaper, or null when none was ever logged. */
  dirtyGapHours: number | null;
  /** The gap is longer than the age (and feeding) allows. */
  longDirtyGap: boolean;
  /** The floor the gap was read against, in hours, or null when the
   *  interval means nothing at this age and feeding. */
  dirtyGapLimitHours: number | null;
  /** True while the log is too new to judge — nothing logged in the last
   *  24 hours *and* nothing older either means the family has not started
   *  logging, not that the baby has stopped. */
  tooEarly: boolean;
};

/**
 * Read the last 24 hours against the norm.
 *
 * `breastfed` widens the dirty-diaper gap to two weeks after six weeks of
 * age, where the Swedish sources say a breastfed baby's interval is not a
 * signal on its own.
 */
export function assessDiapers(
  data: AppData,
  ageDays: number,
  now: Date,
  breastfed: boolean,
): DiaperAssessment | null {
  const norm = normFor(ageDays);
  if (!norm) return null;
  const counts = recentCounts(data, now);
  const gap = hoursSinceDirty(data, now);
  const anyLogged = Object.keys(data.diapers).length > 0;
  // A log with entries but none in the last day: the family may just have
  // stopped logging. Still counted — a thin day reads as thin — but the
  // screen can soften the copy when the whole log is empty.
  const tooEarly = !anyLogged;
  let limit = norm.maxDirtyGapHours;
  if (breastfed && ageDays >= 42) {
    limit = Math.max(limit ?? 0, BREASTFED_MAX_DIRTY_GAP_HOURS);
  }
  return {
    norm,
    wet: counts.wet,
    dirty: counts.dirty,
    fewWet: !tooEarly && counts.wet < norm.minWet,
    dirtyGapHours: gap,
    longDirtyGap: !tooEarly && limit !== null && gap !== null && gap > limit,
    dirtyGapLimitHours: limit,
    tooEarly,
  };
}

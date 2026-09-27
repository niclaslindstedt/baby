// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The sleep log, read. A sleep is a kind — nap or night — a start and an end;
// everything a screen says about sleep is derived from those moments at read
// time: how long the child has been asleep or awake, how much of the last day
// was slept, the averages over the last 30 and 90 days, where those sit
// against the recommendation for the age, and when the next sleep is likely
// to suit. Pure and clock-free: `now` is always a parameter.
//
// Three families of numbers, and the sources behind each. Every source is an
// entry in `docs/references.json`, cited here by its `[ref:<id>]` tag — the
// full record, the verbatim quotes and what each one is used for live there,
// and `tests/references_test.ts` keeps the two in step; `docs/sleep.md` is
// the prose account:
//
//   - How much a child should sleep in 24 hours, naps included. The
//     recommended range is the WHO's (Guidelines on physical activity,
//     sedentary behaviour and sleep for children under 5 years of age, 2019:
//     "14–17 hours (0–3 months of age) or 12–16 hours (4–11 months of age) of
//     good quality sleep, including naps"; 11–14 hours at 1–2 years; 10–13 at
//     3–4) [ref:who-2019-under5], which the American Academy of Sleep
//     Medicine's consensus repeats from four months (Paruthi et al. 2016, J
//     Clin Sleep Med 12(6):785–786) [ref:paruthi-2016]. A recommendation is
//     not a description, though, and many healthy children sleep outside it
//     — 1177 gives "de flesta barn" 14–18 hours at 0–3 months and 10–16 at
//     1–2 years [ref:1177-barns-somn-i-olika-aldrar], and Folkhälsomyndigheten
//     the same ranges [ref:fohm-2026-somnvanor]. So the app also carries what
//     children are actually observed to sleep: the pooled means and 95 %
//     ranges (±1.96 SD) of Galland et al. 2012 (Sleep Med Rev 16(3):213–222,
//     table 2) [ref:galland-2012], a systematic review of 34 observational
//     studies. An average
//     outside the recommendation but inside that range is common; one
//     outside both is worth a mention at BVC — or is a logging gap.
//
//   - How long a child is typically awake between sleeps (the "wake window").
//     There is no peer-reviewed table of these: the physiology is the
//     two-process model, in which sleep pressure builds faster the younger
//     the child (Jenni & LeBourgeois 2006, Curr Opin Psychiatry
//     19(3):282–287) [ref:jenni-lebourgeois-2006], and the numbers are the
//     published guidance of the child and family health services of New
//     South Wales — Tresillian's age pages up to a year, Karitane's Sleep
//     Needs Guide (2016) after it (see `WAKE_WINDOWS`) — with 1177's "en till
//     två timmar" for a newborn agreeing [ref:1177-barns-somn-i-olika-aldrar]. So the app
//     treats the band as a prior and the child's own recent days as the
//     evidence: see `nextSleep`.
//
//   - What counts as a short nap. "Sleep cycles in healthy infants at term
//     typically last a mean of 50–60 min (range, 30–70 min)" (Grigg-Damberger
//     2016, J Clin Sleep Med 12(3):429–445) [ref:grigg-damberger-2016];
//     Rikshandboken: "Spädbarn har sömncykler som är ungefär 50 minuter
//     långa" [ref:rikshandboken-framja-god-somn]. A nap under 45 minutes has
//     not finished its first cycle, and one of two hours or more has been
//     through two.
//
// The day a sleep belongs to. A night that begins at 19:30 and ends at 06:10
// is one night, and the parent calls it "last night" whatever the calendar
// says, so a night sleep counts toward the day it began on in the evening:
// its "sleep day" is the local date twelve hours before its start, which puts
// a 19:30 start on that day and a 02:40 resumption after a logged waking on
// the day before. A nap counts toward the day it began on. A sleep day is
// therefore that morning's naps, that afternoon's, and the night that follows
// — the 24 hours a parent means by "how did she sleep yesterday?" — and it
// is complete once the next morning is over (noon the day after), which is
// when the averages start counting it.

import {
  addDays,
  dayKeyOf,
  type DayKey,
} from "@niclaslindstedt/oss-framework/calendar";

import { DAYS_PER_MONTH } from "./age.ts";
import {
  sortedSleeps,
  type AppData,
  type SleepKind,
  type SleepSession,
} from "./types.ts";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Days in `n` WHO months, for the age bands the sources speak in months. */
const months = (n: number) => Math.round(n * DAYS_PER_MONTH);

// ── The log, as spans ──────────────────────────────────────────────────────

/**
 * How long an open sleep may run before it is read as a forgotten "woke up"
 * rather than a sleep. Sixteen hours is past any single sleep the sources
 * describe — Galland et al. 2012 (table 3) put the longest sleep period at
 * 6–24 months at 8.3 hours, with 13.7 as the upper limit of its 95 % range
 * [ref:galland-2012] —
 * and short enough that the next day's Today card stops claiming the child
 * has slept since yesterday evening.
 */
export const STALE_SLEEP_HOURS = 16;

/** A sleep as the derivations read it: two instants, in milliseconds. */
export type SleepSpan = {
  id: string;
  kind: SleepKind;
  start: number;
  end: number;
  /** True for the sleep running at `now`, whose `end` is `now`. */
  ongoing: boolean;
};

/**
 * The sleep running at `now`, or null.
 *
 * The open sleep that began last, as long as nothing began after it (a later
 * sleep means this one ended, even if nobody said when), it began no later
 * than `now`, and it has not been running longer than `STALE_SLEEP_HOURS`.
 */
export function currentSleep(data: AppData, now: Date): SleepSession | null {
  const t = now.getTime();
  let latest: SleepSession | null = null;
  let latestStart = -Infinity;
  for (const s of Object.values(data.sleeps)) {
    const start = Date.parse(s.start);
    if (start > t) continue;
    if (start > latestStart) {
      latest = s;
      latestStart = start;
    }
  }
  if (!latest || latest.end !== null) return null;
  if (t - latestStart > STALE_SLEEP_HOURS * HOUR) return null;
  return latest;
}

/**
 * Open sleeps that are not the one running now: a "woke up" that was never
 * tapped. Their end is unknown, so no derivation counts them; the Sleep tab
 * lists them for a parent to finish. Newest first.
 */
export function unfinishedSleeps(data: AppData, now: Date): SleepSession[] {
  const current = currentSleep(data, now);
  return Object.values(data.sleeps)
    .filter((s) => s.end === null && s.id !== current?.id)
    .sort((a, b) => b.start.localeCompare(a.start));
}

/**
 * Every sleep with a known extent, oldest first: the ended ones as logged
 * and the current one up to `now`. Open sleeps that are not current are left
 * out (see `unfinishedSleeps`), as is anything that begins after `now`.
 *
 * Overlaps — two devices that each logged the same nap, or a corrected start
 * that runs into the sleep before — are clipped, so no minute is counted
 * twice: each span starts no earlier than the latest end before it.
 */
export function sleepSpans(data: AppData, now: Date): SleepSpan[] {
  const t = now.getTime();
  const current = currentSleep(data, now);
  const raw: SleepSpan[] = [];
  for (const s of Object.values(data.sleeps)) {
    const start = Date.parse(s.start);
    if (Number.isNaN(start) || start > t) continue;
    const ongoing = s.id === current?.id;
    let end: number;
    if (ongoing) end = t;
    else if (s.end === null) continue;
    else end = Math.min(Date.parse(s.end), t);
    if (Number.isNaN(end) || end <= start) continue;
    raw.push({ id: s.id, kind: s.kind, start, end, ongoing });
  }
  raw.sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
  const out: SleepSpan[] = [];
  let reach = -Infinity;
  for (const span of raw) {
    const start = Math.max(span.start, reach);
    if (start < span.end) out.push({ ...span, start });
    reach = Math.max(reach, span.end);
  }
  return out;
}

/** When the last ended sleep ended, at or before `now`, or null. */
export function lastEndedSleep(data: AppData, now: Date): number | null {
  let latest: number | null = null;
  for (const s of Object.values(data.sleeps)) {
    if (s.end === null) continue;
    const end = Date.parse(s.end);
    if (Number.isNaN(end) || end > now.getTime()) continue;
    if (latest === null || end > latest) latest = end;
  }
  return latest;
}

/** Minutes between two instants. */
function minutesOf(start: number, end: number): number {
  return Math.max(0, (end - start) / MINUTE);
}

/** The day a sleep counts toward: the day a nap began on, and for a night
 *  the date twelve hours before it began — see the header. */
export function sleepDayOf(span: { kind: SleepKind; start: number }): DayKey {
  return span.kind === "night"
    ? dayKeyOf(new Date(span.start - 12 * HOUR))
    : dayKeyOf(new Date(span.start));
}

/** Local noon on a day, as an instant. */
function noonOf(day: DayKey): number {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y!, m! - 1, d!, 12, 0, 0, 0).getTime();
}

/** One sleep day of the log, as the Sleep tab lists it. */
export type SleepLogDay = { day: DayKey; sleeps: SleepSession[] };

/**
 * The log of the last `days` sleep days, newest day first and newest sleep
 * first within a day — every sleep as recorded, open ones included, since
 * this is the list a parent corrects from. Bounded for the same reason the
 * diaper list is: it exists to put a late tap right, which is noticed the
 * same day or the next. Days with nothing logged are left out.
 */
export function recentSleepsByDay(
  data: AppData,
  today: DayKey,
  days: number,
): SleepLogDay[] {
  const byDay = new Map<DayKey, SleepSession[]>();
  for (let i = 0; i < days; i++) byDay.set(addDays(today, -i), []);
  for (const s of sortedSleeps(data)) {
    const start = Date.parse(s.start);
    if (Number.isNaN(start)) continue;
    byDay.get(sleepDayOf({ kind: s.kind, start }))?.push(s);
  }
  return [...byDay.entries()]
    .filter(([, sleeps]) => sleeps.length > 0)
    .map(([day, sleeps]) => ({ day, sleeps }));
}

// ── Days and averages ──────────────────────────────────────────────────────

/** One sleep day's totals, in minutes. */
export type SleepDay = {
  day: DayKey;
  nightMinutes: number;
  dayMinutes: number;
  totalMinutes: number;
  /** How many naps began that day. */
  naps: number;
  /** Anything was logged for the day at all. */
  logged: boolean;
  /** The sleep running now counts toward this day, so its totals are still
   *  growing. */
  ongoing: boolean;
};

function emptyDay(day: DayKey): SleepDay {
  return {
    day,
    nightMinutes: 0,
    dayMinutes: 0,
    totalMinutes: 0,
    naps: 0,
    logged: false,
    ongoing: false,
  };
}

function addSpan(day: SleepDay, span: SleepSpan): void {
  const minutes = minutesOf(span.start, span.end);
  if (span.kind === "night") day.nightMinutes += minutes;
  else {
    day.dayMinutes += minutes;
    day.naps += 1;
  }
  day.totalMinutes += minutes;
  day.logged = true;
  if (span.ongoing) day.ongoing = true;
}

/**
 * The sleep days from `from` to `to` inclusive, oldest first. A day with
 * nothing logged is present with `logged: false` rather than absent — a
 * chart draws it as a gap, and the averages leave it out.
 */
export function sleepDays(
  data: AppData,
  from: DayKey,
  to: DayKey,
  now: Date,
): SleepDay[] {
  const byDay = new Map<DayKey, SleepDay>();
  for (let day = from; day <= to; day = addDays(day, 1)) {
    byDay.set(day, emptyDay(day));
  }
  for (const span of sleepSpans(data, now)) {
    const day = byDay.get(sleepDayOf(span));
    if (day) addSpan(day, span);
  }
  return [...byDay.values()];
}

/** The most recent sleep day that is over: yesterday once today's noon has
 *  passed, the day before until then. See the header. */
export function lastCompleteSleepDay(now: Date): DayKey {
  const today = dayKeyOf(now);
  return now.getTime() >= noonOf(today)
    ? addDays(today, -1)
    : addDays(today, -2);
}

/** An average over a window of sleep days. Minutes per logged day. */
export type SleepAverage = {
  /** The window asked for, in days. */
  windowDays: number;
  /** How many days in it had anything logged — the divisor. */
  loggedDays: number;
  totalMinutes: number;
  nightMinutes: number;
  dayMinutes: number;
  napsPerDay: number;
  /** The window's last day. */
  through: DayKey;
};

/**
 * The average sleep per day over the last `windowDays` complete sleep days,
 * or null when none of them has anything logged.
 *
 * The divisor is the days that have a log, not the window: a family that
 * started logging ten days ago has a ten-day average, not a third of a
 * thirty-day one, and a week away without the app is a week the average
 * leaves out rather than a week of a child who never slept. What a logged
 * day cannot say is whether *every* sleep in it was logged — a day with only
 * the night entered reads as a day without naps — and the view says so.
 */
export function averageSleep(
  data: AppData,
  now: Date,
  windowDays: number,
): SleepAverage | null {
  const through = lastCompleteSleepDay(now);
  const from = addDays(through, -(windowDays - 1));
  const days = sleepDays(data, from, through, now).filter(
    (d) => d.logged && !d.ongoing,
  );
  if (days.length === 0) return null;
  const sum = (pick: (d: SleepDay) => number) =>
    days.reduce((acc, d) => acc + pick(d), 0) / days.length;
  return {
    windowDays,
    loggedDays: days.length,
    totalMinutes: sum((d) => d.totalMinutes),
    nightMinutes: sum((d) => d.nightMinutes),
    dayMinutes: sum((d) => d.dayMinutes),
    napsPerDay: sum((d) => d.naps),
    through,
  };
}

/** The spans slept in the `hours` before `now`, clipped to that window —
 *  the rolling day, as the 24-hour dial draws it. */
export function spansInLast(data: AppData, now: Date, hours = 24): SleepSpan[] {
  const since = now.getTime() - hours * HOUR;
  return sleepSpans(data, now)
    .filter((span) => span.end > since)
    .map((span) => ({ ...span, start: Math.max(span.start, since) }));
}

/** Minutes slept in the `hours` before `now`, split by kind — the rolling
 *  day, which can be asked at any hour (see `diapers.ts` for why a calendar
 *  day can't). */
export function sleptInLast(
  data: AppData,
  now: Date,
  hours = 24,
): { totalMinutes: number; nightMinutes: number; dayMinutes: number } {
  let night = 0;
  let day = 0;
  for (const span of spansInLast(data, now, hours)) {
    const minutes = minutesOf(span.start, span.end);
    if (span.kind === "night") night += minutes;
    else day += minutes;
  }
  return { totalMinutes: night + day, nightMinutes: night, dayMinutes: day };
}

/**
 * The last night that is over: its sleep day, and the minutes slept in it —
 * every night span of that day added up, so a night logged in two halves
 * around a waking reads as one night. Null when no night has been logged, or
 * while the most recent one is still going (the card then says "asleep
 * since" instead).
 */
export function lastNight(
  data: AppData,
  now: Date,
): { day: DayKey; minutes: number; start: number; end: number } | null {
  const spans = sleepSpans(data, now).filter((s) => s.kind === "night");
  const last = spans.at(-1);
  if (!last) return null;
  const day = sleepDayOf(last);
  const nights = spans.filter((s) => sleepDayOf(s) === day);
  if (nights.some((s) => s.ongoing)) return null;
  return {
    day,
    minutes: nights.reduce((acc, s) => acc + minutesOf(s.start, s.end), 0),
    start: nights[0]!.start,
    end: last.end,
  };
}

/** One stretch of sleep on a calendar day, in minutes past local midnight. */
export type DiarySegment = {
  kind: SleepKind;
  from: number;
  to: number;
  ongoing: boolean;
};

/** One calendar day of the sleep diary: midnight to midnight. */
export type DiaryDay = { day: DayKey; segments: DiarySegment[] };

/** Local midnight at the start of a day, as an instant. */
function midnightOf(day: DayKey): number {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y!, m! - 1, d!).getTime();
}

/**
 * The sleep diary: each calendar day from `from` to `to`, oldest first, with
 * the stretches slept on it, clipped at midnight. The one place the app cuts
 * a night in two, on purpose — this is the chart child health care draws
 * (a row per day, the clock across), where a night is the end of one row
 * and the start of the next, and where the rhythm settling into nights and
 * naps is visible at a glance.
 */
export function sleepDiary(
  data: AppData,
  from: DayKey,
  to: DayKey,
  now: Date,
): DiaryDay[] {
  const spans = sleepSpans(data, now);
  const out: DiaryDay[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const start = midnightOf(day);
    const end = midnightOf(addDays(day, 1));
    // Minutes are measured on the wall clock, so a day that gains or loses
    // an hour to daylight saving still draws on a 24-hour axis.
    const clock = (instant: number) =>
      instant >= end ? 1440 : instant <= start ? 0 : minutesOfDay(instant);
    const segments: DiarySegment[] = [];
    for (const span of spans) {
      if (span.end <= start || span.start >= end) continue;
      segments.push({
        kind: span.kind,
        from: clock(span.start),
        to: clock(span.end),
        ongoing: span.ongoing,
      });
    }
    out.push({ day, segments });
  }
  return out;
}

// ── How much is recommended ────────────────────────────────────────────────

/** A recommendation: hours of sleep per 24 hours, naps included, for an
 *  age band. Ages in days since birth, `toDays` exclusive. */
export type SleepRecommendation = {
  fromDays: number;
  toDays: number;
  hours: [number, number];
  /** Which band this is, as the i18n key the view quotes. */
  band: "newborn" | "infant" | "toddler" | "preschool";
};

/**
 * WHO 2019, p. 22: 14–17 hours at 0–3 months, 12–16 hours at 4–11 months,
 * 11–14 hours at 1–2 years, 10–13 hours at 3–4 years [ref:who-2019-under5].
 * The 0–3 months figure is the National Sleep Foundation's recommended range
 * [ref:hirshkowitz-2015], which the AASM declined to set a number for. The
 * last band is carried to the sixth birthday with the AASM's 3–5 years,
 * which says the same 10–13 [ref:paruthi-2016]. Past six the app says nothing: it follows a baby, and the
 * school-age figures are a different conversation.
 */
export const SLEEP_RECOMMENDATIONS: SleepRecommendation[] = [
  { fromDays: 0, toDays: months(4), hours: [14, 17], band: "newborn" },
  { fromDays: months(4), toDays: months(12), hours: [12, 16], band: "infant" },
  {
    fromDays: months(12),
    toDays: months(36),
    hours: [11, 14],
    band: "toddler",
  },
  {
    fromDays: months(36),
    toDays: months(72),
    hours: [10, 13],
    band: "preschool",
  },
];

/** What children of an age are observed to sleep: the pooled mean and the
 *  95 % range. Ages in days, `toDays` exclusive. */
export type ObservedSleep = {
  fromDays: number;
  toDays: number;
  mean: number;
  range: [number, number];
};

/**
 * Galland et al. 2012, table 2, hours per 24 hours (mean, mean ±1.96 SD):
 * 0–2 months 14.6 (9.3–20.0), ≈3 months 13.6 (9.4–17.8), ≈6 months 12.9
 * (8.8–17.0), ≈9 months 12.6 (9.4–15.8), ≈12 months 12.9 (10.1–15.8), 1–2
 * years 12.6 (10.0–15.2), 2–3 years 12.0 (9.7–14.2), 4–5 years 11.5
 * (9.1–13.9) [ref:galland-2012]. Each row is used from halfway after the age before it to
 * halfway before the age after it; the review has no 3–4 years row, so the
 * turn from its 2–3 to its 4–5 years is at three and a half.
 */
export const OBSERVED_SLEEP: ObservedSleep[] = [
  { fromDays: 0, toDays: months(2.5), mean: 14.6, range: [9.3, 20.0] },
  {
    fromDays: months(2.5),
    toDays: months(4.5),
    mean: 13.6,
    range: [9.4, 17.8],
  },
  {
    fromDays: months(4.5),
    toDays: months(7.5),
    mean: 12.9,
    range: [8.8, 17.0],
  },
  {
    fromDays: months(7.5),
    toDays: months(10.5),
    mean: 12.6,
    range: [9.4, 15.8],
  },
  {
    fromDays: months(10.5),
    toDays: months(15),
    mean: 12.9,
    range: [10.1, 15.8],
  },
  { fromDays: months(15), toDays: months(24), mean: 12.6, range: [10.0, 15.2] },
  { fromDays: months(24), toDays: months(42), mean: 12.0, range: [9.7, 14.2] },
  { fromDays: months(42), toDays: months(72), mean: 11.5, range: [9.1, 13.9] },
];

/** The recommendation and the observed range for an age, together — what
 *  an average is read against. */
export type SleepNorm = {
  recommended: SleepRecommendation;
  observed: ObservedSleep;
};

/** The norm for an age, or null before birth and from six years. */
export function sleepNormFor(ageDays: number): SleepNorm | null {
  if (ageDays < 0) return null;
  const within = <T extends { fromDays: number; toDays: number }>(rows: T[]) =>
    rows.find((r) => ageDays >= r.fromDays && ageDays < r.toDays) ?? null;
  const recommended = within(SLEEP_RECOMMENDATIONS);
  const observed = within(OBSERVED_SLEEP);
  return recommended && observed ? { recommended, observed } : null;
}

/** How many logged days an average needs before the app reads it against
 *  the recommendation. A week: one bad night moves a three-day average by an
 *  hour, and the recommendation is about habitual sleep, not about Tuesday. */
export const MIN_LOGGED_DAYS = 7;

/** Where an average sits: inside the recommendation; outside it but inside
 *  what 95 % of children that age are observed to sleep ("a little short" /
 *  "a little long" — common, and fine for many children); outside both; or
 *  not yet enough days to say. */
export type SleepStatus =
  "within" | "littleShort" | "littleLong" | "short" | "long" | "tooEarly";

/** Read an average against a norm. */
export function sleepStatus(
  norm: SleepNorm,
  average: SleepAverage | null,
): SleepStatus {
  if (!average || average.loggedDays < MIN_LOGGED_DAYS) return "tooEarly";
  const hours = average.totalMinutes / 60;
  const [recLow, recHigh] = norm.recommended.hours;
  const [obsLow, obsHigh] = norm.observed.range;
  if (hours < Math.min(recLow, obsLow)) return "short";
  if (hours > Math.max(recHigh, obsHigh)) return "long";
  if (hours < recLow) return "littleShort";
  if (hours > recHigh) return "littleLong";
  return "within";
}

// ── When the next sleep is likely to suit ──────────────────────────────────

/** The typical time awake between sleeps for an age band, in minutes. Ages in
 *  days since birth, `toDays` exclusive. */
export type WakeWindow = {
  fromDays: number;
  toDays: number;
  min: number;
  max: number;
};

/**
 * Typical awake times, by age, feeding included. Up to a year the bands are
 * Tresillian's (Tresillian Family Care Centres, NSW Health, tresillian.org.au):
 *
 *   - "Newborn to 6 week wake window: 1 to 2 hours", "6 to 12 week wake
 *     window: 1 - 2.5 hours" [ref:tresillian-newborn-sleep];
 *   - "The average awake window for a 3 month old is 1.5 - 2 hours whereas an
 *     average awake window for a 5 month old is 2 - 3 hours"
 *     [ref:tresillian-3-to-5-months] — the app turns at four months;
 *   - 6–8 months "2 - 3 hours" [ref:tresillian-6-to-8-months];
 *   - 9–10 months "around 2.5 - 3.5 hours", 11–12 months "around 3 - 4
 *     hours" [ref:tresillian-9-to-12-months].
 *
 * From a year they are Karitane's Sleep Needs Guide for Infants 0 to 3 Years
 * (May 2016, FAM002), column "Awake (feed & play)": 12–18 months 4–6 hours,
 * 18 months–3 years 5–7 hours [ref:karitane-2016]. Karitane has since
 * replaced that guide with a Flexible Daily Routine that agrees with it to
 * nine months and stops at a year ("up for longer during the day")
 * [ref:karitane-flexible-routine]; no service we found publishes a newer
 * table past the first birthday, so the 2016 bands stand until one does. By
 * then the sleep is one
 * afternoon nap (Iglowstein et al. 2003, Pediatrics 111(2):302–307: "At 18
 * months of age, there was a significant change from 2 or more naps to only
 * 1 nap per day" [ref:iglowstein-2003]). From three the wake window stops
 * being a useful unit — half of three-year-olds no longer nap at all
 * (Iglowstein: "At the age of 3 years, 50.4% of the children still napped")
 * — and the app stops suggesting times.
 */
export const WAKE_WINDOWS: WakeWindow[] = [
  { fromDays: 0, toDays: 42, min: 60, max: 120 },
  { fromDays: 42, toDays: 84, min: 60, max: 150 },
  { fromDays: 84, toDays: months(4), min: 90, max: 120 },
  { fromDays: months(4), toDays: months(6), min: 120, max: 180 },
  { fromDays: months(6), toDays: months(9), min: 120, max: 180 },
  { fromDays: months(9), toDays: months(11), min: 150, max: 210 },
  { fromDays: months(11), toDays: months(12), min: 180, max: 240 },
  { fromDays: months(12), toDays: months(18), min: 240, max: 360 },
  { fromDays: months(18), toDays: months(36), min: 300, max: 420 },
];

/** The wake window for an age, or null before birth and from three years. */
export function wakeWindowFor(ageDays: number): WakeWindow | null {
  if (ageDays < 0) return null;
  return (
    WAKE_WINDOWS.find((w) => ageDays >= w.fromDays && ageDays < w.toDays) ??
    null
  );
}

/** A nap shorter than this has not completed one infant sleep cycle
 *  (~50–60 minutes; see the header). */
export const SHORT_NAP_MINUTES = 45;
/** A nap this long or longer has been through two. */
export const LONG_NAP_MINUTES = 120;

/** How far back the child's own rhythm is read from: two weeks, long enough
 *  to hold a dozen wake windows and short enough to follow a child whose
 *  naps are changing — they change every few weeks in the first year. */
export const HISTORY_DAYS = 14;
/** How many of the child's own wake windows the suggestion needs before it
 *  trusts them over the age band. */
export const MIN_HISTORY_WINDOWS = 5;
/** How many nights the typical bedtime and morning are read from. */
export const MIN_HISTORY_NIGHTS = 3;

/** The half-width of the suggested time: "around 13:10" is a quarter of an
 *  hour either side, because a wake window is a range and the suggestion is
 *  a point in it. */
export const SUGGESTION_SPREAD_MINUTES = 15;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** Minutes past local noon, 0–1439 — a clock that doesn't wrap at the
 *  bedtimes and night wakings it is used to compare. */
function minutesSinceNoon(instant: number): number {
  const d = new Date(instant);
  return (d.getHours() * 60 + d.getMinutes() - 720 + 1440) % 1440;
}

/** Minutes past local midnight. */
function minutesOfDay(instant: number): number {
  const d = new Date(instant);
  return d.getHours() * 60 + d.getMinutes();
}

/** What the last two weeks say about this child's day: the wake windows
 *  after a night and after a nap, the usual bedtime, and the earliest
 *  morning. */
export type SleepRhythm = {
  /** Minutes awake from the morning to the first nap, one per morning. */
  afterNight: number[];
  /** Minutes awake from the end of a nap to the next sleep. */
  afterNap: number[];
  /** The median start of the first night sleep, in minutes past noon. */
  bedtime: number | null;
  /** The earliest end of a night in the window, in minutes past midnight —
   *  the line between a night waking and the morning. */
  earliestMorning: number | null;
};

/**
 * Read the child's own rhythm from the last `HISTORY_DAYS`.
 *
 * A wake window is the gap between one sleep's end and the next one's start,
 * kept only when it is plausible for the age — at least half the band's
 * shortest and at most one and a half times its longest. A shorter gap is a
 * night waking or a nap logged in two pieces; a longer one is a sleep that
 * wasn't logged. Gaps between two night spans are night wakings and never
 * count.
 */
export function sleepRhythm(
  data: AppData,
  now: Date,
  band: WakeWindow,
): SleepRhythm {
  const since = now.getTime() - HISTORY_DAYS * DAY;
  const spans = sleepSpans(data, now).filter((s) => s.end > since);
  const afterNight: number[] = [];
  const afterNap: number[] = [];
  const bedtimes = new Map<DayKey, number>();
  const mornings = new Map<DayKey, number>();
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i]!;
    const next = spans[i + 1];
    if (span.kind === "night") {
      const day = sleepDayOf(span);
      if (!bedtimes.has(day)) bedtimes.set(day, span.start);
      // The morning is the end of the night's last span — known to be the
      // last only once something else has begun after it. The newest night
      // is left out: whether it has ended for the day or only for a waking
      // is the question the morning is used to answer.
      if (next && (next.kind !== "night" || sleepDayOf(next) !== day)) {
        mornings.set(day, span.end);
      }
    }
    if (!next || span.ongoing) continue;
    if (span.kind === "night" && next.kind === "night") continue;
    const gap = minutesOf(span.end, next.start);
    if (gap < band.min / 2 || gap > band.max * 1.5) continue;
    if (span.kind === "night") afterNight.push(gap);
    else afterNap.push(gap);
  }
  const bedtimeList = [...bedtimes.values()].map(minutesSinceNoon);
  const morningList = [...mornings.values()].map(minutesOfDay);
  return {
    afterNight,
    afterNap,
    bedtime:
      bedtimeList.length >= MIN_HISTORY_NIGHTS ? median(bedtimeList) : null,
    earliestMorning:
      morningList.length >= MIN_HISTORY_NIGHTS
        ? Math.min(...morningList)
        : null,
  };
}

/**
 * Before a family has logged three mornings, a night that ends before five
 * is read as a night waking rather than the start of the day. Not a claim
 * about children — a convention for the one case where the app has nothing
 * of the child's own to go on, chosen so that a 02:40 waking is never met
 * with "next nap around 05:10".
 */
export const FALLBACK_MORNING_MINUTES = 5 * 60;

/** A suggested time for the next sleep, and what it was built from. */
export type SleepSuggestion = {
  /** A nap, bedtime, or — before the app knows the child's bedtime — just
   *  "sleep". */
  kind: "nap" | "night" | "sleep";
  /** The suggested moment, and the quarter hour either side of it. */
  at: number;
  earliest: number;
  latest: number;
  /** The age band the window was read from. */
  band: WakeWindow;
  /** The child's own median wake window for this slot of the day, clamped
   *  into the band, in minutes — null until there are enough of them, when
   *  the band's middle stands in. */
  own: number | null;
  /** How the last nap's length moved the window, if it did. */
  lastNap: "short" | "long" | null;
  /** The suggested time has passed. */
  overdue: boolean;
};

/** Where the child is now, and what the app can say about the next sleep. */
export type NextSleep =
  | {
      state: "asleep";
      kind: SleepKind;
      since: number;
      /** Minutes asleep so far. */
      minutes: number;
    }
  | {
      /** Awake after a night sleep that ended before the child's morning:
       *  the next sleep is the rest of the night, and no time is suggested. */
      state: "nightWaking";
      since: number;
      minutes: number;
    }
  | {
      state: "awake";
      since: number;
      /** Minutes awake so far. */
      minutes: number;
      /** Null when the age has no wake window (from three years). */
      suggestion: SleepSuggestion | null;
    };

/**
 * How long the child can have been awake before the app reads the log as
 * having gone quiet — a sleep that was never tapped — rather than as a child
 * still up: twice the age band's longest window, or a whole day once there
 * is no band. Past it `nextSleep` says nothing, rather than "awake for 19
 * hours".
 */
function quietAfterMinutes(band: WakeWindow | null): number {
  return band ? band.max * 2 : 24 * 60;
}

/**
 * Where the child is now, and when the next sleep is likely to suit.
 *
 * The suggestion's window starts from the child's own median wake window
 * over the last two weeks — after a night for the first nap of the day,
 * after a nap for the rest — clamped into the age band, or the middle of the
 * band until there are `MIN_HISTORY_WINDOWS` of them. A short nap (under one
 * sleep cycle) moves it halfway toward the band's short end, a long one (two
 * cycles or more) halfway toward the long end: a short nap discharges less
 * sleep pressure, so it builds back to the same level sooner. That rule is
 * the app's reading of the two-process model, not a published number — no
 * study measures it — and `docs/sleep.md` says so.
 *
 * When the child's usual bedtime is known and is within the band's longest
 * window of the end of the last nap, the next sleep is bedtime: the usual
 * time, but no sooner than the band's shortest window.
 *
 * Null when there is nothing to go on: nothing logged, or a gap since the
 * last sleep so long that a sleep must have gone unlogged.
 */
export function nextSleep(
  data: AppData,
  ageDays: number,
  now: Date,
): NextSleep | null {
  const t = now.getTime();
  const current = currentSleep(data, now);
  if (current) {
    const since = Date.parse(current.start);
    return {
      state: "asleep",
      kind: current.kind,
      since,
      minutes: minutesOf(since, t),
    };
  }
  const last = sleepSpans(data, now).at(-1);
  if (!last) return null;
  const band = wakeWindowFor(ageDays);
  const awake = minutesOf(last.end, t);
  if (awake > quietAfterMinutes(band)) return null;
  if (!band) {
    return {
      state: "awake",
      since: last.end,
      minutes: awake,
      suggestion: null,
    };
  }

  const rhythm = sleepRhythm(data, now, band);

  if (last.kind === "night") {
    const morning = rhythm.earliestMorning ?? FALLBACK_MORNING_MINUTES;
    const endedAt = minutesOfDay(last.end);
    // A night that ends before the child's earliest recent morning is a
    // waking, and so is one that ends in the evening — a first stretch after
    // bedtime. Anything from the morning to six in the evening is the start
    // of the day.
    if (endedAt < morning || endedAt >= 18 * 60) {
      return { state: "nightWaking", since: last.end, minutes: awake };
    }
  }

  const windows = last.kind === "night" ? rhythm.afterNight : rhythm.afterNap;
  const mid = median(windows);
  const own =
    windows.length >= MIN_HISTORY_WINDOWS && mid !== null
      ? clamp(mid, band.min, band.max)
      : null;
  let window = own ?? (band.min + band.max) / 2;

  let lastNap: "short" | "long" | null = null;
  if (last.kind === "nap") {
    const length = minutesOf(last.start, last.end);
    if (length < SHORT_NAP_MINUTES) {
      lastNap = "short";
      window -= (window - band.min) / 2;
    } else if (length >= LONG_NAP_MINUTES) {
      lastNap = "long";
      window += (band.max - window) / 2;
    }
  }

  let at = last.end + window * MINUTE;
  let kind: SleepSuggestion["kind"] = rhythm.bedtime === null ? "sleep" : "nap";
  if (last.kind === "nap" && rhythm.bedtime !== null) {
    const bedtime =
      noonOf(dayKeyOf(new Date(last.end))) + rhythm.bedtime * MINUTE;
    if (bedtime - last.end <= band.max * MINUTE) {
      kind = "night";
      at = Math.max(bedtime, last.end + band.min * MINUTE);
    }
  }
  // Round to the five minutes a parent reads a clock in.
  at = Math.round(at / (5 * MINUTE)) * 5 * MINUTE;
  const spread = SUGGESTION_SPREAD_MINUTES * MINUTE;
  return {
    state: "awake",
    since: last.end,
    minutes: awake,
    suggestion: {
      kind,
      at,
      earliest: at - spread,
      latest: at + spread,
      band,
      own,
      lastNap,
      overdue: t > at + spread,
    },
  };
}

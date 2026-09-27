// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Sentences composed from the catalog and the domain — the age a parent says
// out loud, the child's name with its fallback, the channel a z-score puts a
// reading in. Kept out of the screens so three of them phrase an age the
// same way.

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";

import { ageParts } from "./age.ts";
import { formatDayYear, formatInstant } from "./format.ts";
import type { TFn } from "./i18n/index.ts";
import type { NextSleep } from "./sleep.ts";
import type { Child } from "./types.ts";

/** "7 mo 2 wk", "2 y 3 mo", "6 d", or "Newborn" on the day of birth. */
export function ageLabel(
  t: TFn,
  birthDate: DayKey,
  today: DayKey,
  locale?: string,
): string {
  if (today < birthDate) {
    return t("age.notBornYet", { date: formatDayYear(birthDate, locale) });
  }
  const p = ageParts(birthDate, today);
  if (p.totalDays === 0) return t("age.newborn");
  const parts: string[] = [];
  if (p.years > 0) parts.push(t("age.years", { count: String(p.years) }));
  if (p.months > 0 || p.years > 0) {
    parts.push(t("age.months", { count: String(p.months) }));
  }
  // Under a year the weeks matter; past it they are noise.
  if (p.years === 0) {
    if (p.weeks > 0) parts.push(t("age.weeks", { count: String(p.weeks) }));
    if (p.months === 0 && p.days > 0) {
      parts.push(t("age.days", { count: String(p.days) }));
    }
  }
  return parts.join(" ");
}

/** The child's name, or "your baby". */
export function childName(t: TFn, child: Child | null): string {
  return child?.name.trim() || t("age.yourBaby");
}

/** Which channel a z-score falls in, as a catalog key. */
export function channelKey(
  z: number | null,
): "high" | "aboveOne" | "middle" | "belowOne" | "low" | "outside" {
  if (z === null) return "outside";
  if (z > 2) return "high";
  if (z > 1) return "aboveOne";
  if (z >= -1) return "middle";
  if (z >= -2) return "belowOne";
  return "low";
}

/** A length of time as a parent says it: "1 h 5 min", "45 min", "11 h".
 *  Rounded to the minute — a sleep log is read in minutes, never seconds. */
export function durationLabel(t: TFn, minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return t("duration.m", { m: String(m) });
  if (m === 0) return t("duration.h", { h: String(h) });
  return t("duration.hm", { h: String(h), m: String(m) });
}

/** Where the child is right now, as the Sleep card and view open with it:
 *  "Asleep since 12:40 — 1 h 5 min", "Awake since 9:25 — 16 min", or a night
 *  waking. */
export function sleepNowLine(t: TFn, next: NextSleep, locale?: string): string {
  const time = formatInstant(next.since, locale);
  if (next.state === "nightWaking") return t("sleep.nightWaking", { time });
  return t(next.state === "asleep" ? "sleep.nowAsleep" : "sleep.nowAwake", {
    time,
    duration: durationLabel(t, next.minutes),
  });
}

/** The suggested next sleep, or null when there is none to suggest (the
 *  child is asleep, awake in the night, or past the age of wake windows). */
export function sleepNextLine(
  t: TFn,
  next: NextSleep,
  locale?: string,
): string | null {
  if (next.state !== "awake" || next.suggestion === null) return null;
  const s = next.suggestion;
  const line = t(
    s.kind === "nap"
      ? "sleep.nextNap"
      : s.kind === "night"
        ? "sleep.nextBedtime"
        : "sleep.nextSleep",
    { time: formatInstant(s.at, locale) },
  );
  return s.overdue ? t("sleep.nextPassed", { next: line }) : line;
}

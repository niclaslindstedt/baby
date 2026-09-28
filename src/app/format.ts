// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Presentation. The domain speaks `DayKey` (`YYYY-MM-DD`), ISO timestamps,
// kilograms, centimetres and z-scores everywhere; this module is the single
// place any of them turns into something readable — in the locale's units
// (`units.ts`) as well as its formats.
//
// The framework owns the `Intl` formatter cache and the `DayKey` → local-date
// conversion; what stays here is which *shapes* this app names a value in.

import {
  dayKeyToDate,
  formatDayKey,
  type DayKey,
} from "@niclaslindstedt/oss-framework/calendar";
import {
  formatDate,
  formatNumber,
} from "@niclaslindstedt/oss-framework/format";

import { isClockTime, minutesOfClock, type Measurement } from "./types.ts";
import { cmToFtIn, cmToIn, kgToLbOz, unitSystemFor } from "./units.ts";

/** A `DayKey` as a local `Date` at midnight, or null when it isn't a real
 *  day. */
export const toDate = dayKeyToDate;

/** "5 Jul" — how this app names a date in a list row or a chart tick. */
export function formatDay(day: DayKey, locale: string): string {
  return formatDayKey(day, { day: "numeric", month: "short" }, locale);
}

/** "Sun, 5 Jul 2026" — the same date in full, for a heading. */
export function formatFullDay(day: DayKey, locale: string): string {
  return formatDayKey(
    day,
    { weekday: "short", day: "numeric", month: "short", year: "numeric" },
    locale,
  );
}

/** "5 Jul 2026" — a date with its year, for a record row. */
export function formatDayYear(day: DayKey, locale: string): string {
  return formatDayKey(
    day,
    { day: "numeric", month: "short", year: "numeric" },
    locale,
  );
}

/** The shape every wall-clock time in the app is written in: the locale's
 *  own clock, so "21:03" in Sweden and "9:03 PM" on a US phone. */
const WALL_CLOCK: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

/** An ISO timestamp as a wall-clock time ("21:03" / "9:03 PM"), local time,
 *  because that is when the tap happened for the person who tapped. */
export function formatClock(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatDate(date, locale, WALL_CLOCK);
}

/** Minutes past midnight on no day in particular — the moment a day's food
 *  covers its need — in the same clock as `formatClock`: "14:00" / "2:00 PM". */
export function formatMinuteOfDay(minutes: number, locale: string): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  // Any date will do; the first of January has no daylight-saving jump in
  // it anywhere the app is used, so every minute of it exists.
  const date = new Date(2000, 0, 1, Math.floor(m / 60), m % 60);
  return formatDate(date, locale, WALL_CLOCK);
}

/** A food's usual time (`HH:MM`, as the document keeps it) in the locale's
 *  clock. A string that is not one is shown as it is. */
export function formatTimeOfDay(time: string, locale: string): string {
  return isClockTime(time)
    ? formatMinuteOfDay(minutesOfClock(time), locale)
    : time;
}

/** An hour of the day split the way the locale's clock says it: the numeral,
 *  and on a 12-hour clock the half of the day ("6" and "AM"). `period` is
 *  null on a 24-hour clock. `hour` 24 is midnight again. */
export function hourParts(
  hour: number,
  locale: string,
): { numeral: string; period: string | null } {
  const h = ((Math.round(hour) % 24) + 24) % 24;
  const parts = hourFormat(locale).formatToParts(new Date(2000, 0, 1, h));
  const period = parts.find((p) => p.type === "dayPeriod")?.value ?? null;
  if (period === null) return { numeral: String(h), period: null };
  const numeral = parts.find((p) => p.type === "hour")?.value ?? String(h);
  return { numeral, period };
}

/** Whether the locale's clock runs 1–12 twice rather than 0–23. */
export function isTwelveHour(locale: string): boolean {
  return hourParts(12, locale).period !== null;
}

/** An hour on a chart's time axis: "06" on a 24-hour clock, as a timetable
 *  prints it, and "6 AM" on a 12-hour one. 24 is the midnight that ends the
 *  day — "24" and "12 AM". */
export function formatAxisHour(hour: number, locale: string): string {
  const { numeral, period } = hourParts(hour, locale);
  if (period === null) return String(Math.round(hour)).padStart(2, "0");
  return `${numeral} ${period}`;
}

const hourFormats = new Map<string, Intl.DateTimeFormat>();
function hourFormat(locale: string): Intl.DateTimeFormat {
  let format = hourFormats.get(locale);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, { hour: "numeric" });
    hourFormats.set(locale, format);
  }
  return format;
}

/** An instant in milliseconds as a wall-clock time — `formatClock` for the
 *  moments the derivations compute rather than read off a record. */
export function formatInstant(ms: number, locale: string): string {
  return formatClock(new Date(ms).toISOString(), locale);
}

/** A weight, stored in kilograms, in the locale's units: to the gram-ish
 *  precision a scale gives in kilograms (two decimals under 10 kg, one
 *  above), or as pounds and ounces to a tenth of an ounce where the locale
 *  weighs that way ("16 lb 5.7 oz"). */
export function formatWeight(kg: number, locale: string): string {
  if (unitSystemFor(locale) === "us") {
    const { lb, oz } = kgToLbOz(kg);
    const ounces = formatNumber(oz, locale, { maximumFractionDigits: 1 });
    return `${formatWhole(lb, locale)} lb ${ounces} oz`;
  }
  const digits = kg < 10 ? 2 : 1;
  return `${formatNumber(kg, locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} kg`;
}

/** A child's length or head circumference, stored in centimetres, in the
 *  locale's units, to one decimal ("68.5 cm", "27.0 in"). */
export function formatLength(cm: number, locale: string): string {
  const us = unitSystemFor(locale) === "us";
  return `${formatNumber(us ? cmToIn(cm) : cm, locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} ${us ? "in" : "cm"}`;
}

/** An adult's height, stored in centimetres: "172.0 cm", or "5 ft 8 in"
 *  where the locale measures a person that way. */
export function formatHeight(cm: number, locale: string): string {
  if (unitSystemFor(locale) !== "us") return formatLength(cm, locale);
  const { ft, in: inches } = cmToFtIn(cm);
  return `${formatWhole(ft, locale)} ft ${formatWhole(inches, locale)} in`;
}

/** A spread of centimetres in whole units ("10 cm", "4 in"), for the width
 *  of a range said in a sentence. */
export function formatSpread(cm: number, locale: string): string {
  const us = unitSystemFor(locale) === "us";
  return `${formatWhole(us ? cmToIn(cm) : cm, locale)} ${us ? "in" : "cm"}`;
}

/** The unit a form field is typed in, for its label: "kg" / "lb, oz" for a
 *  weight, "cm" / "in" for a child's length, "cm" / "ft, in" for an adult's
 *  height. Symbols, so the same in every language. */
export function unitLabel(
  quantity: "weight" | "length" | "height",
  locale: string,
): string {
  const us = unitSystemFor(locale) === "us";
  if (quantity === "weight") return us ? "lb, oz" : "kg";
  if (quantity === "height") return us ? "ft, in" : "cm";
  return us ? "in" : "cm";
}

/** The values one reading holds, in the order a parent reads them off the
 *  clinic's card: weight, length, head. A value the reading doesn't carry is
 *  left out rather than written blank — a visit where only the length was
 *  taken says "80.5 cm", not an empty slot beside it. Head wears the `↺`
 *  mark because it is the second measurement in centimetres on the line.
 *
 *  The array, not a joined string, so a caller picks its own separator. */
export function measurementValues(m: Measurement, locale: string): string[] {
  const parts: string[] = [];
  if (m.weightKg !== null) parts.push(formatWeight(m.weightKg, locale));
  if (m.lengthCm !== null) parts.push(formatLength(m.lengthCm, locale));
  if (m.headCm !== null) parts.push(`${formatLength(m.headCm, locale)} ↺`);
  return parts;
}

/** A z-score with its sign ("+0.4 SD", "−1.2 SD"), to one decimal. */
export function formatZ(z: number, locale: string): string {
  const abs = formatNumber(Math.abs(z), locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const sign = z < -0.05 ? "−" : z > 0.05 ? "+" : "±";
  return `${sign}${abs} SD`;
}

/** A whole number with the locale's grouping ("1 234"). */
export function formatWhole(value: number, locale: string): string {
  return formatNumber(Math.round(value), locale, { maximumFractionDigits: 0 });
}

/** A number to at most one decimal, for nutrient amounts ("8.5", "10"). */
export function formatAmount(value: number, locale: string): string {
  return formatNumber(value, locale, { maximumFractionDigits: 1 });
}

/** A share as a whole percent ("45%"). */
export function formatPercent(share: number, locale: string): string {
  return formatNumber(share, locale, {
    style: "percent",
    maximumFractionDigits: 0,
  });
}

/** A running length of time as a stopwatch reads it: "12:05" under an hour,
 *  "1:23:45" from one — the seconds ticking are what says the clock is
 *  live. Negative lengths read as zero. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

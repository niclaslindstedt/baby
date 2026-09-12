// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Presentation. The domain speaks `DayKey` (`YYYY-MM-DD`), ISO timestamps,
// kilograms, centimetres and z-scores everywhere; this module is the single
// place any of them turns into something readable.
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

/** A `DayKey` as a local `Date` at midnight, or null when it isn't a real
 *  day. */
export const toDate = dayKeyToDate;

/** "5 Jul" — how this app names a date in a list row or a chart tick. */
export function formatDay(day: DayKey, locale?: string): string {
  return formatDayKey(day, { day: "numeric", month: "short" }, locale);
}

/** "Sun, 5 Jul 2026" — the same date in full, for a heading. */
export function formatFullDay(day: DayKey, locale?: string): string {
  return formatDayKey(
    day,
    { weekday: "short", day: "numeric", month: "short", year: "numeric" },
    locale,
  );
}

/** "5 Jul 2026" — a date with its year, for a record row. */
export function formatDayYear(day: DayKey, locale?: string): string {
  return formatDayKey(
    day,
    { day: "numeric", month: "short", year: "numeric" },
    locale,
  );
}

/** An ISO timestamp as a wall-clock time ("21:03" / "9:03 PM"), local time,
 *  because that is when the tap happened for the person who tapped. */
export function formatClock(iso: string, locale?: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatDate(date, locale, { hour: "numeric", minute: "2-digit" });
}

/** A weight in kilograms, to the gram-ish precision a scale gives: two
 *  decimals under 10 kg, one above. */
export function formatKg(kg: number, locale?: string): string {
  const digits = kg < 10 ? 2 : 1;
  return `${formatNumber(kg, locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} kg`;
}

/** A length in centimetres, to one decimal. */
export function formatCm(cm: number, locale?: string): string {
  return `${formatNumber(cm, locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} cm`;
}

/** A z-score with its sign ("+0.4 SD", "−1.2 SD"), to one decimal. */
export function formatZ(z: number, locale?: string): string {
  const abs = formatNumber(Math.abs(z), locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const sign = z < -0.05 ? "−" : z > 0.05 ? "+" : "±";
  return `${sign}${abs} SD`;
}

/** A whole number with the locale's grouping ("1 234"). */
export function formatWhole(value: number, locale?: string): string {
  return formatNumber(Math.round(value), locale, { maximumFractionDigits: 0 });
}

/** A number to at most one decimal, for nutrient amounts ("8.5", "10"). */
export function formatAmount(value: number, locale?: string): string {
  return formatNumber(value, locale, { maximumFractionDigits: 1 });
}

/** A share as a whole percent ("45%"). */
export function formatPercent(share: number, locale?: string): string {
  return formatNumber(share, locale, {
    style: "percent",
    maximumFractionDigits: 0,
  });
}

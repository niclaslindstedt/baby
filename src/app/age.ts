// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The child's age, as every derivation needs it. Pure and clock-free: `today`
// is always a parameter, supplied by `App.tsx`, so the tests pin real dates.
//
// Two units, because the sources speak two. The growth standards and the
// energy tables are indexed by age in *days* (converted to months of 30.4375
// days, the WHO's own convention), while the vaccination schedule and the
// feeding advice speak in *calendar* months — "at 3 months" means the same
// day of the month, three months on.

import {
  addMonths,
  daysBetween,
  type DayKey,
} from "@niclaslindstedt/oss-framework/calendar";

/** The WHO's month: the mean length of a calendar month in days. */
export const DAYS_PER_MONTH = 30.4375;

/** Whole days since birth. Negative before the birth date — a document with
 *  a future birth date is possible and every caller treats it as "not born
 *  yet" rather than as a nonsense age. */
export function ageInDays(birthDate: DayKey, today: DayKey): number {
  return daysBetween(birthDate, today);
}

/** Age in WHO months (days / 30.4375), fractional. */
export function ageInMonths(birthDate: DayKey, today: DayKey): number {
  return ageInDays(birthDate, today) / DAYS_PER_MONTH;
}

/** Completed calendar months since birth — "3 months" on the day the third
 *  month turns, and until the fourth does. Zero (never negative) before the
 *  birth date. */
export function completedMonths(birthDate: DayKey, today: DayKey): number {
  if (today < birthDate) return 0;
  // Step forward a month at a time rather than dividing: a child born on
  // 31 January is one month old on 28 February (see `addMonths`), and no
  // day count says so.
  let months = 0;
  while (addMonths(birthDate, months + 1) <= today) months++;
  return months;
}

/** An age broken into the parts a parent says out loud: whole years, then
 *  months, then weeks and days of the remainder. */
export type AgeParts = {
  years: number;
  months: number;
  weeks: number;
  days: number;
  /** Whole days since birth, for the one screen that quotes it. */
  totalDays: number;
};

export function ageParts(birthDate: DayKey, today: DayKey): AgeParts {
  const totalDays = Math.max(0, ageInDays(birthDate, today));
  const months = completedMonths(birthDate, today);
  const remainderDays = Math.max(
    0,
    daysBetween(addMonths(birthDate, months), today),
  );
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    weeks: Math.floor(remainderDays / 7),
    days: remainderDays % 7,
    totalDays,
  };
}

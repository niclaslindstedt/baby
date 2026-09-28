// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// US units, at the edge only.
//
// The document keeps kilograms and centimetres, always: the WHO standards are
// tabled in them, every z-score and forecast is computed in them, and a record
// synced between a US phone and a Swedish one must mean the same child. What
// changes with the locale is what a parent reads and types — pounds and
// ounces, inches, and an adult height in feet and inches where the locale
// measures that way (the United States; Liberia and Myanmar by the same CLDR
// rule). This module is the conversion and the drafts a form holds; `format.ts`
// says the results out loud.
//
// Pure: the locale is a parameter, and every conversion is exact to the
// international definitions (1 lb = 0.45359237 kg, 1 in = 2.54 cm).

import { parseNumber } from "./number.ts";

export type UnitSystem = "metric" | "us";

export const KG_PER_LB = 0.45359237;
export const OZ_PER_LB = 16;
export const CM_PER_IN = 2.54;
export const IN_PER_FT = 12;

/** Regions whose everyday body measurements are imperial (CLDR's
 *  `measurementSystem` "US"). */
const US_REGIONS = new Set(["US", "LR", "MM"]);

/** Which units a locale reads a body in. */
export function unitSystemFor(locale: string): UnitSystem {
  let region: string | undefined;
  try {
    region = new Intl.Locale(locale).maximize().region;
  } catch {
    return "metric";
  }
  return region && US_REGIONS.has(region) ? "us" : "metric";
}

/** Rounded to `digits` decimals, without the float tail (`0.1 + 0.2`). */
function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/** A weight as whole pounds and the ounces left over, the ounces to one
 *  decimal, the way a US scale and a clinic's card read it. */
export function kgToLbOz(kg: number): { lb: number; oz: number } {
  const totalOz = round((kg / KG_PER_LB) * OZ_PER_LB, 1);
  const lb = Math.floor(totalOz / OZ_PER_LB);
  return { lb, oz: round(totalOz - lb * OZ_PER_LB, 1) };
}

/** Pounds and ounces as kilograms, to the gram — finer than any scale reads
 *  and fine enough that a reading typed in ounces reads back unchanged. */
export function lbOzToKg(lb: number, oz: number): number {
  return round((lb + oz / OZ_PER_LB) * KG_PER_LB, 3);
}

/** Centimetres as inches, unrounded — the caller picks the precision. */
export function cmToIn(cm: number): number {
  return cm / CM_PER_IN;
}

/** Inches as centimetres, to a hundredth, so a length typed to a tenth of an
 *  inch reads back unchanged. */
export function inToCm(inches: number): number {
  return round(inches * CM_PER_IN, 2);
}

/** An adult's height as whole feet and inches ("5 ft 9 in"). */
export function cmToFtIn(cm: number): { ft: number; in: number } {
  const total = Math.round(cmToIn(cm));
  return { ft: Math.floor(total / IN_PER_FT), in: total % IN_PER_FT };
}

/** How many display units one stored unit is — the factor a chart scales its
 *  kilograms or centimetres by. Linear, so a WHO curve scaled by it is the
 *  same curve in the other unit. */
export function displayScale(
  quantity: "weight" | "length",
  system: UnitSystem,
): number {
  if (system === "metric") return 1;
  return quantity === "weight" ? 1 / KG_PER_LB : 1 / CM_PER_IN;
}

// ── Drafts: what a form's fields hold, and what they save as ───────────────
//
// A field holds the typed string. A US weight is two fields (pounds, ounces)
// and a US adult height two (feet, inches); everything else is one, and the
// second string is then unused. `parse*` returns null for blank fields and for
// anything that isn't a number, like `parseNumber` it builds on.

export type Draft = { main: string; sub: string };

const EMPTY: Draft = { main: "", sub: "" };

/** The fields for a stored weight. */
export function weightDraft(kg: number | null, system: UnitSystem): Draft {
  if (kg === null) return EMPTY;
  if (system === "metric") return { main: String(kg), sub: "" };
  const { lb, oz } = kgToLbOz(kg);
  return { main: String(lb), sub: String(oz) };
}

/** The weight in kilograms the fields say. */
export function parseWeight(draft: Draft, system: UnitSystem): number | null {
  if (system === "metric") return parseNumber(draft.main);
  const lb = parseNumber(draft.main);
  const oz = parseNumber(draft.sub);
  if (lb === null && oz === null) return null;
  if (
    (draft.main.trim() !== "" && lb === null) ||
    (draft.sub.trim() !== "" && oz === null)
  ) {
    return null;
  }
  return lbOzToKg(lb ?? 0, oz ?? 0);
}

/** The field for a stored child's length or head circumference. */
export function lengthDraft(cm: number | null, system: UnitSystem): string {
  if (cm === null) return "";
  return system === "metric" ? String(cm) : String(round(cmToIn(cm), 1));
}

/** The length in centimetres the field says. */
export function parseLength(raw: string, system: UnitSystem): number | null {
  const n = parseNumber(raw);
  if (n === null) return null;
  return system === "metric" ? n : inToCm(n);
}

/** The fields for a parent's stored height. */
export function heightDraft(cm: number | null, system: UnitSystem): Draft {
  if (cm === null) return EMPTY;
  if (system === "metric") return { main: String(cm), sub: "" };
  const { ft, in: inches } = cmToFtIn(cm);
  return { main: String(ft), sub: String(inches) };
}

/** The height in centimetres the fields say. */
export function parseHeight(draft: Draft, system: UnitSystem): number | null {
  if (system === "metric") return parseNumber(draft.main);
  const ft = parseNumber(draft.main);
  const inches = parseNumber(draft.sub);
  if (ft === null && inches === null) return null;
  if (
    (draft.main.trim() !== "" && ft === null) ||
    (draft.sub.trim() !== "" && inches === null)
  ) {
    return null;
  }
  return round(((ft ?? 0) * IN_PER_FT + (inches ?? 0)) * CM_PER_IN, 1);
}

/** The value to save: the stored one when the fields still say exactly what
 *  they opened with, so opening a reading and saving it untouched never
 *  moves it by a rounding; otherwise what the fields say now. */
export function keepIfUnchanged<T>(
  stored: T,
  opened: Draft | string,
  now: Draft | string,
  parsed: T,
): T {
  const same =
    typeof opened === "string"
      ? opened === now
      : typeof now !== "string" &&
        opened.main === now.main &&
        opened.sub === now.sub;
  return same ? stored : parsed;
}

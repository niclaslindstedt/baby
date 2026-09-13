// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The two halves of typing a number into this app. A scale in Sweden reads
// 7,4 kg and a tape measure 68,5 cm, so both separators have to survive the
// trip from the keyboard to the document: `sanitizeDecimal` decides what a
// field will hold while it is being typed, `parseNumber` turns what it holds
// into the number the domain stores. Pure, like everything it feeds.

/** Keeps a decimal draft to digits and at most one separator, a point or a
 *  comma. Everything else a keyboard can offer is dropped as it is typed. */
export function sanitizeDecimal(raw: string): string {
  let out = "";
  let separator = false;
  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") out += ch;
    else if ((ch === "." || ch === ",") && !separator) {
      out += ch;
      separator = true;
    }
  }
  return out;
}

/** A number typed into a text field, or null when it isn't one. Accepts a
 *  decimal comma, because a Swedish keyboard offers one. */
export function parseNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The one locale every date, time and number in the app is formatted in.
//
// The language picks the words; the device picks the formats. Swedish is
// always Sweden's formats. English follows the device's own English, so a
// phone set to US English reads "Sep 21" and "9:03 PM", one set to British
// English "21 Sept" and "21:03" — and every surface agrees, because they all
// take this tag rather than naming one. With no English on the device (a
// Swedish phone reading the app in English) the formats stay the British
// ones the app has always used, which are the nearest to Sweden's.
//
// Pure and navigator-free: the device's languages are a parameter, so the
// tests pin real tags.

export type AppLang = "en" | "sv";

/** The formats English falls back to when the device names no English. */
export const DEFAULT_ENGLISH = "en-GB";

/** The BCP-47 tag to format in, for the app's language and the device's
 *  preferred languages (most-preferred first, as `navigator.languages`). */
export function localeFor(lang: AppLang, device: readonly string[]): string {
  if (lang === "sv") return "sv-SE";
  for (const tag of device) {
    let parsed: Intl.Locale;
    try {
      parsed = new Intl.Locale(tag);
    } catch {
      continue;
    }
    if (parsed.language === "en" && parsed.region) {
      return `en-${parsed.region}`;
    }
  }
  return DEFAULT_ENGLISH;
}

/** The device's preferred languages, or none outside a browser. */
export function deviceLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  if (navigator.languages?.length) return navigator.languages;
  return navigator.language ? [navigator.language] : [];
}

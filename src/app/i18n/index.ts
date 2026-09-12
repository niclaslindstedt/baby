// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The app's i18n runtime, built once from the framework's `createI18n`
// factory over the app's own catalogs. English is bundled and is the
// catalog's type source; Swedish is code-split and loaded on demand. The app
// owns the strings; the framework owns the machinery that loads, caches,
// resolves, and re-renders against them — including the first-paint gate
// `LanguageRoot` provides.
//
// Swedish is here from the start because the app is for parents in Sweden:
// the recommendations it quotes are Swedish ones, and the words the child
// health centre uses ("BVC", "MPR", "årskurs") are the words a parent looks
// for.

import {
  createI18n,
  detectBrowserLanguage,
} from "@niclaslindstedt/oss-framework/i18n";

import { en, type Catalog } from "./en.ts";

export type Lang = "en" | "sv";
export type { Catalog };

const LANGS: Lang[] = ["en", "sv"];

export const i18n = createI18n<Lang, Catalog>({
  fallbackLang: "en",
  fallbackCatalog: en,
  loaders: { sv: () => import("./sv.ts").then((m) => m.sv) },
  // Two-letter codes → concrete BCP-47 tags for `<html lang>` / Intl.
  toBcp47: (lang) => (lang === "sv" ? "sv-SE" : "en-GB"),
  storageKey: "baby:language",
  eventName: "baby:language",
});

export const { LanguageRoot, useT, useLang, setLanguage, supportedLangs } =
  i18n;

/** The language a first run opens in: the browser's, when it is one the app
 *  speaks, else English. Read once, before the persisted choice exists. */
export function detectLanguage(): Lang {
  return detectBrowserLanguage(LANGS, "en");
}

/** The translate function `useT()` returns — a message key (optionally with
 *  interpolation params) to a resolved string. Handy where copy is composed
 *  outside a component. */
export type TFn = ReturnType<typeof useT>;

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useCallback } from "react";

import { useLocalStorageState } from "@niclaslindstedt/oss-framework/hooks";

// The app's own (non-theme) settings: which of the two themes is active,
// which trackers this parent uses, and the developer knobs. The framework
// deliberately leaves this in the app; it only owns the appearance
// *projection*. Persisted to localStorage so a
// reload keeps your choices. The language lives with the i18n runtime, the
// storage backend with the sync engine, and the child with the document.
//
// Deliberately this short. The app is opened with a baby on one arm, and
// every knob is a question asked of everyone to serve someone.

/** The theme choice. Deliberately three values and no more — one light, one
 *  dark, and "follow the device". */
export type ThemeChoice = "light" | "dark" | "system";

/**
 * The trackers a parent can switch off.
 *
 * Not everyone tracks everything: a formula-fed four-month-old has no food
 * regimen yet, a family that writes diapers on the fridge does not want the
 * log, and someone who only opened the app for the vaccination card should
 * not have to swipe past three tabs to reach it. Each id is both a switch
 * and — for the three that have one — the tab the bar drops when it is off.
 *
 * Today is deliberately not on the list: it is the home screen, and the
 * child's age is true whatever else is tracked.
 */
export type FeatureId = "diapers" | "growth" | "food" | "vaccines";

/** In the bottom bar's order, which is the order the toggles are listed in
 *  so the Settings rows read like the bar they govern. */
export const FEATURES: readonly FeatureId[] = [
  "diapers",
  "growth",
  "food",
  "vaccines",
] as const;

/** Which trackers are on. */
export type Features = Record<FeatureId, boolean>;

/** Everything on. Switching a tracker off is a choice someone makes; a
 *  fresh install — and any stored value this build cannot read — shows the
 *  whole app. */
export const ALL_FEATURES: Features = {
  diapers: true,
  growth: true,
  food: true,
  vaccines: true,
};

/**
 * The stored toggles, normalised.
 *
 * Only an explicit `false` switches a tracker off: a missing key is a
 * feature that did not exist when the settings were written, and the honest
 * answer for one of those is "on", not "hidden". Switching a tracker off
 * hides screens and nothing else — the records it owns stay in the
 * document, which is why turning it back on costs nothing.
 */
export function parseFeatures(raw: unknown): Features {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return ALL_FEATURES;
  }
  const stored = raw as Record<string, unknown>;
  const features = { ...ALL_FEATURES };
  for (const id of FEATURES) features[id] = stored[id] !== false;
  return features;
}

export type AppSettings = {
  theme: ThemeChoice;
  /** The trackers this parent uses. See `FeatureId`. */
  features: Features;
  /** Surface the developer affordances (the demo document, the log panel,
   *  the raw document size) in Settings. */
  devMode: boolean;
  /** Mirror console output into the in-app log buffer. */
  captureLogs: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  // Follow the device out of the box: a night feed is not the moment for a
  // white screen, and the OS already knows it is night.
  theme: "system",
  features: ALL_FEATURES,
  devMode: false,
  captureLogs: false,
};

const STORAGE_KEY = "baby:settings";

function parseSettings(raw: string): AppSettings {
  const parsed = JSON.parse(raw) as unknown;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return DEFAULT_SETTINGS;
  }
  const stored = parsed as Record<string, unknown>;
  const merged = { ...DEFAULT_SETTINGS, ...stored } as AppSettings;
  return {
    ...merged,
    // Enumerations fall back rather than reaching a `switch` that has no case
    // for a value this build does not recognise.
    theme:
      merged.theme === "light" || merged.theme === "dark"
        ? merged.theme
        : "system",
    features: parseFeatures(merged.features),
    devMode: merged.devMode === true,
    captureLogs: merged.captureLogs === true,
  };
}

export function useAppSettings() {
  // The framework hook owns the persistence mechanics (safe parse,
  // write-through); this store owns the key, the settings shape, and the
  // fallbacks.
  const [settings, setSettings] = useLocalStorageState<AppSettings>(
    STORAGE_KEY,
    DEFAULT_SETTINGS,
    { parse: parseSettings },
  );

  const update = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
      setSettings((prev) => ({ ...prev, [key]: value })),
    [setSettings],
  );

  /** One tracker on or off. Its own callback rather than an `update` of the
   *  whole record, so the other three are read from the store at write time
   *  rather than from the render that drew the switch. */
  const setFeature = useCallback(
    (id: FeatureId, on: boolean) =>
      setSettings((prev) => ({
        ...prev,
        features: { ...prev.features, [id]: on },
      })),
    [setSettings],
  );

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), [setSettings]);

  return { settings, update, setFeature, reset, setSettings };
}

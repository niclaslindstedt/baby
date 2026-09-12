// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useCallback } from "react";

import { useLocalStorageState } from "@niclaslindstedt/oss-framework/hooks";

// The app's own (non-theme) settings: which of the two themes is active, and
// the developer knobs. The framework deliberately leaves this in the app; it
// only owns the appearance *projection*. Persisted to localStorage so a
// reload keeps your choices. The language lives with the i18n runtime, the
// storage backend with the sync engine, and the child with the document.
//
// Deliberately this short. The app is opened with a baby on one arm, and
// every knob is a question asked of everyone to serve someone.

/** The theme choice. Deliberately three values and no more — one light, one
 *  dark, and "follow the device". */
export type ThemeChoice = "light" | "dark" | "system";

export type AppSettings = {
  theme: ThemeChoice;
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

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), [setSettings]);

  return { settings, update, reset, setSettings };
}

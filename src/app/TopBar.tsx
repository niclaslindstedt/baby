// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import type { ReactNode } from "react";

import { CogIcon, PlusIcon } from "@niclaslindstedt/oss-framework/components";

import { AppMarkIcon } from "./icons.tsx";
import { useT } from "./i18n/index.ts";
import type { Tab } from "./BottomNav.tsx";

// The bar across the top: the app's mark and name, the sync glyph, and the
// two things you *do* rather than places you go — logging a diaper, and
// changing a setting.
//
// The `+` is deliberately the loudest thing on screen and the last thing
// before the right edge, where a right thumb lands. It is there only while
// diaper tracking is on: with that tracker switched off the bar keeps the
// mark, the sync glyph and the cog, and nothing takes the `+`'s place. What it opens is the
// diaper sheet (`DiaperSheet.tsx`), not a form: the loudest button on this
// app should do the thing the app is picked up for most often, and that is
// three taps a day on a changing table. It inverts to an outline while the
// sheet is up — the same "filled means happening" grammar the diaper tally
// chips use.
//
// The bar's geometry is the sibling apps' — a bordered row at `px-4 py-3`
// with the action cluster on the right — so the family's headers land at the
// same height on the same phone. The top-up of `padding-top` comes from the
// stylesheet (`.app-header`), for the installed PWA's status bar.

type Props = {
  /** The screen on display, so the button that leads to it can say so. */
  active: Tab;
  /** Show the Settings screen — or, when it is already showing, go back to
   *  where you were. */
  onOpenSettings: () => void;
  /** Open the diaper sheet. */
  onQuickLog: () => void;
  /** Whether that sheet is up, so the `+` can say so. */
  quickLogOpen: boolean;
  /** Whether to offer it at all. Diaper tracking is a tracker a parent can
   *  switch off in Settings, and with it off the `+` has nothing to open. */
  showQuickLog?: boolean;
  /** The sync glyph, when a backend is connected. */
  syncSlot?: ReactNode;
};

export function TopBar({
  active,
  onOpenSettings,
  onQuickLog,
  quickLogOpen,
  showQuickLog = true,
  syncSlot,
}: Props) {
  const t = useT();
  const onSettings = active === "settings";
  return (
    <header className="app-header flex shrink-0 items-center justify-between gap-2 border-b border-line bg-surface-3 px-4 pb-3">
      <h1 className="app-wordmark flex min-w-0 items-center gap-2 text-accent">
        <AppMarkIcon className="h-6 w-6 shrink-0" />
        <span className="truncate">{t("app.name")}</span>
      </h1>
      <div className="flex shrink-0 items-center gap-2">
        {syncSlot}
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={t("nav.settings")}
          aria-current={onSettings ? "page" : undefined}
          title={t("nav.settings")}
          className={`flex h-9 w-9 items-center justify-center rounded-md text-accent transition-colors ${
            onSettings ? "bg-accent/15" : "hover:bg-surface-2"
          }`}
        >
          <CogIcon className="h-5 w-5" />
        </button>
        {showQuickLog && (
          <button
            type="button"
            onClick={onQuickLog}
            aria-label={t("nav.logDiaper")}
            aria-expanded={quickLogOpen}
            aria-haspopup="dialog"
            title={t("nav.logDiaper")}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
              quickLogOpen
                ? "border-accent text-accent"
                : "border-accent bg-accent text-page-bg hover:bg-accent/90"
            }`}
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  );
}

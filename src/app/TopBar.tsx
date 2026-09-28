// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import type { ReactNode } from "react";

import { CogIcon, PlusIcon } from "@niclaslindstedt/oss-framework/components";

import { APP_NAME } from "./appName.ts";
import { AppMarkIcon } from "./icons.tsx";
import { useT } from "./i18n/index.ts";
import type { Tab } from "./BottomNav.tsx";

// The bar across the top: the app's mark and name, the sync glyph, and the
// two things you *do* rather than places you go — logging, and changing a
// setting.
//
// The `+` is deliberately the loudest thing on screen and the last thing
// before the right edge, where a right thumb lands. What it opens is the
// quick-log sheet (`QuickLogSheet.tsx`), not a form: the loudest button on
// this app should do the things the app is picked up for most often, and
// those are a diaper on a changing table and a sleep starting or ending in a
// dark room. It is there while either tracker is on: with both switched off
// the bar keeps the mark, the sync glyph and the cog, and nothing takes the
// `+`'s place. It inverts to an outline while the sheet is up — the same
// "filled means happening" grammar the diaper tally chips use.
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
  /** Open the quick-log sheet. */
  onQuickLog: () => void;
  /** Whether that sheet is up, so the `+` can say so. */
  quickLogOpen: boolean;
  /** Whether to offer it at all. Diapers and sleep are trackers a parent can
   *  switch off in Settings, and with both off the `+` has nothing to open. */
  showQuickLog?: boolean;
  /** The `+`'s accessible name — what the sheet behind it logs. */
  quickLogLabel: string;
  /** The sync glyph, when a backend is connected. */
  syncSlot?: ReactNode;
};

export function TopBar({
  active,
  onOpenSettings,
  onQuickLog,
  quickLogOpen,
  showQuickLog = true,
  quickLogLabel,
  syncSlot,
}: Props) {
  const t = useT();
  const onSettings = active === "settings";
  return (
    <header className="app-header flex shrink-0 items-center justify-between gap-2 border-b border-line bg-surface-3 px-4 pb-3">
      <h1 className="app-wordmark flex min-w-0 items-center gap-2 text-accent">
        <AppMarkIcon className="h-6 w-6 shrink-0" />
        <span className="truncate">{APP_NAME}</span>
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
            aria-label={quickLogLabel}
            aria-expanded={quickLogOpen}
            aria-haspopup="dialog"
            title={quickLogLabel}
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

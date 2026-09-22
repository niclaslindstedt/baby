// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo, type ReactNode } from "react";

import {
  BottomNav as NavBar,
  stepDirection,
} from "@niclaslindstedt/oss-framework/components";

import { BabyIcon, BowlIcon, GrowthIcon, SyringeIcon } from "./icons.tsx";
import { useT } from "./i18n/index.ts";
import type { AppData } from "./types.ts";
import type { Features } from "./useAppSettings.ts";

// The app's navigation: four tabs pinned to the bottom of the screen — the
// same shell the sibling meds app uses, because the two are used the same
// way: one-handed, in a short burst, with something else in the other arm.
//
// The order is the order of the questions: what is happening today (Today —
// the diaper log and the headline answers), is the child growing along the
// curve (Growth), is the food regimen still enough (Food), and which
// vaccination comes next (Vaccines). Today leads because it is the reason
// the app is opened; Vaccines sits last because it changes a handful of
// times a year.
//
// Three of the four are a tracker a parent can switch off in Settings, and
// a switched-off tracker is not on the bar at all (see `navTabs`) — the
// order survives, it just gets shorter. Today is never one of them.
//
// Setting up the child and changing a setting are not on the bar: they are
// things you do and then leave, and they sit on the top bar instead (see
// `TopBar.tsx`). What that buys is a bar of four destinations you can swipe
// between — an order that means something left-to-right.

/** Every screen the shell can show. */
export type Tab =
  "today" | "growth" | "food" | "vaccines" | "child" | "settings";

/** The screens that are *destinations* — the ones the bottom bar carries and
 *  a swipe moves between. Three of them share their name with the tracker
 *  that can switch them off (`FeatureId`); Today has no switch. */
export type NavTab = "today" | "growth" | "food" | "vaccines";

/** Every destination, in order, with none switched off. The bar itself is
 *  `navTabs` — this is the order it draws from. */
export const TABS: NavTab[] = ["today", "growth", "food", "vaccines"];

/**
 * The destinations the bar carries, given the trackers that are on.
 *
 * A switched-off tracker loses its tab: there is nothing to type into it,
 * and a tab that opens on an empty screen is worse than one that is not
 * there. Today always stays — it is the home screen, it is where the app
 * opens, and the bar needs somewhere for a swipe to land.
 */
export function navTabs(features: Features): NavTab[] {
  return TABS.filter((tab) => tab === "today" || features[tab]);
}

/** Whether a screen is one of the bar's destinations — which is also the
 *  question "can a swipe move from here?". Structural: it answers for the
 *  four tabs that exist, not for the ones currently on the bar (that is
 *  `navTabs().includes`). */
export function isNavTab(tab: Tab): tab is NavTab {
  return (TABS as Tab[]).includes(tab);
}

/** Which way an arriving screen travels: `forward` in from the right,
 *  `back` in from the left, or `none` for a change with no direction to it. */
export type ScreenEnter = "forward" | "back" | "none";

/** How a move from one screen to another should animate — the framework's
 *  `stepDirection` over the bar as it currently stands, which already
 *  answers "none" for a screen that is not on it. A hidden tab is not on the
 *  bar, so a move involving one has no direction either. */
export function screenEnter(
  from: Tab,
  to: Tab,
  tabs: NavTab[] = TABS,
): ScreenEnter {
  return stepDirection(tabs, from as NavTab, to as NavTab);
}

/**
 * Which tab the app opens on, given the document it booted with.
 *
 * Today normally. But every screen derives from the child's birth date and
 * sex, and a document with no child has nothing to derive — so a first run
 * opens on the child setup screen, the one screen that is useful before
 * there is a child, and the only thing that turns an empty install into a
 * working one.
 */
export function initialTab(data: AppData): Tab {
  return data.child === null ? "child" : "today";
}

const ICONS: Record<NavTab, (props: { className?: string }) => ReactNode> = {
  today: BabyIcon,
  growth: GrowthIcon,
  food: BowlIcon,
  vaccines: SyringeIcon,
};

export function BottomNav({
  active,
  tabs = TABS,
  onSelect,
}: {
  /** The screen on display, which may be one the bar does not carry — no tab
   *  is then current, and the top bar's own button is lit instead. */
  active: Tab;
  /** The destinations to draw, from `navTabs`. */
  tabs?: NavTab[];
  onSelect: (tab: NavTab) => void;
}) {
  const t = useT();
  // The framework's bar takes its destinations as data; this app supplies the
  // vocabulary — which screens are places, what they are called, and what
  // each one's glyph is.
  const items = useMemo(
    () =>
      tabs.map((tab) => ({
        id: tab,
        label: t(`nav.${tab}` as const),
        icon: ICONS[tab],
      })),
    [t, tabs],
  );
  return (
    <NavBar
      items={items}
      active={active}
      onSelect={onSelect}
      label={t("app.name")}
      className="app-bottom-nav"
    />
  );
}

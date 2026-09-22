// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// The tracker switches: what a stored settings blob normalises to, and which
// destinations the bottom bar is left with once some of them are off.

import { describe, expect, it } from "vitest";

import { navTabs, screenEnter, TABS } from "../src/app/BottomNav.tsx";
import {
  ALL_FEATURES,
  FEATURES,
  parseFeatures,
  type Features,
} from "../src/app/useAppSettings.ts";

/** `ALL_FEATURES` with the named trackers switched off. */
function off(...ids: (keyof Features)[]): Features {
  const features = { ...ALL_FEATURES };
  for (const id of ids) features[id] = false;
  return features;
}

describe("parseFeatures", () => {
  it("switches on everything for a settings blob that has never seen the toggles", () => {
    expect(parseFeatures(undefined)).toEqual(ALL_FEATURES);
    expect(parseFeatures(null)).toEqual(ALL_FEATURES);
    expect(parseFeatures({})).toEqual(ALL_FEATURES);
  });

  it("reads only an explicit false as off", () => {
    expect(parseFeatures({ food: false })).toEqual(off("food"));
    // Anything else stored under the key is a value this build cannot read,
    // and hiding a screen is the wrong way to fail.
    expect(parseFeatures({ food: 0, growth: "no", vaccines: null })).toEqual(
      ALL_FEATURES,
    );
  });

  it("leaves a feature added after the settings were written on", () => {
    // What a v1 blob looks like from a build that has since gained a switch.
    expect(parseFeatures({ diapers: false })).toEqual(off("diapers"));
    expect(FEATURES.every((id) => id in parseFeatures({}))).toBe(true);
  });

  it("ignores a stored array or scalar", () => {
    expect(parseFeatures([false, false])).toEqual(ALL_FEATURES);
    expect(parseFeatures("food")).toEqual(ALL_FEATURES);
  });
});

describe("navTabs", () => {
  it("carries every destination with nothing switched off", () => {
    expect(navTabs(ALL_FEATURES)).toEqual(TABS);
  });

  it("drops the tab of a switched-off tracker, keeping the order", () => {
    expect(navTabs(off("growth"))).toEqual(["today", "food", "vaccines"]);
    expect(navTabs(off("food", "vaccines"))).toEqual(["today", "growth"]);
  });

  it("keeps Today whatever is off — diapers have no tab of their own", () => {
    expect(navTabs(off("diapers"))).toEqual(TABS);
    expect(navTabs(off("diapers", "growth", "food", "vaccines"))).toEqual([
      "today",
    ]);
  });
});

describe("screenEnter", () => {
  it("steps along the bar as it currently stands", () => {
    const tabs = navTabs(off("growth"));
    // Food is the neighbour to Today's right once Growth is gone, so the move
    // that used to skip a tab now arrives from the right like any other.
    expect(screenEnter("today", "food", tabs)).toBe("forward");
    expect(screenEnter("vaccines", "food", tabs)).toBe("back");
  });

  it("has no direction to a screen the bar does not carry", () => {
    const tabs = navTabs(off("growth"));
    expect(screenEnter("today", "growth", tabs)).toBe("none");
    expect(screenEnter("today", "settings", tabs)).toBe("none");
  });
});

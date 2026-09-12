// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useEffect, useState } from "react";

import type { GrowthStandards } from "./growth.ts";

// The WHO growth standards, loaded once and shared. They are a few hundred
// rows nobody needs until a screen asks where a reading sits — so they ride
// in their own chunk (`data/whoGrowth.ts`) and land a beat after boot. Every
// read treats `null` as "not yet", and the screens draw their frame without
// the curves until it flips.
//
// Module-scoped rather than per hook: three screens ask, and the chunk
// should be fetched once, not three times.

let loaded: GrowthStandards | null = null;
let pending: Promise<GrowthStandards> | null = null;

function load(): Promise<GrowthStandards> {
  pending ??= import("./data/whoGrowth.ts").then((m) => {
    loaded = {
      weight: m.WEIGHT_FOR_AGE,
      length: m.LENGTH_FOR_AGE,
      head: m.HEAD_FOR_AGE,
    };
    return loaded;
  });
  return pending;
}

/** The standards, or `null` until the chunk has landed. */
export function useGrowthStandards(): GrowthStandards | null {
  const [standards, setStandards] = useState<GrowthStandards | null>(loaded);
  useEffect(() => {
    if (standards) return;
    let cancelled = false;
    void load().then((s) => {
      if (!cancelled) setStandards(s);
    });
    return () => {
      cancelled = true;
    };
  }, [standards]);
  return standards;
}

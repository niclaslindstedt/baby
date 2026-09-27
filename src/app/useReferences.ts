// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useEffect, useState } from "react";

import { referenceList, type Reference, type Registry } from "./references.ts";

// The references registry, loaded once and shared. It is read by one screen
// a parent opens now and then, so it rides in its own chunk — bundled with
// the app like the growth standards, never fetched from anywhere else — and
// lands a beat after the screen opens. `null` means "not yet".

let loaded: Reference[] | null = null;
let pending: Promise<Reference[]> | null = null;

function load(): Promise<Reference[]> {
  pending ??= import("../../docs/references.json").then((m) => {
    // The JSON's inferred type widens the vocabularies to `string`;
    // `tests/references_test.ts` is what holds the file to `Registry`.
    loaded = referenceList(m.default as unknown as Registry);
    return loaded;
  });
  return pending;
}

/** Every reference, strongest evidence first, or `null` until the chunk has
 *  landed. */
export function useReferences(): Reference[] | null {
  const [refs, setRefs] = useState<Reference[] | null>(loaded);
  useEffect(() => {
    if (refs) return;
    let cancelled = false;
    void load().then((r) => {
      if (!cancelled) setRefs(r);
    });
    return () => {
      cancelled = true;
    };
  }, [refs]);
  return refs;
}

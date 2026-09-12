// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Reconciling two copies of the document — the phone's and the cloud's.
//
// The model makes this easy. Every record is keyed by id and the editable
// ones carry the timestamp of their last edit, so two copies merge record by
// record with the later edit winning. Diaper changes have no edits at all —
// each is one tap that happened on one device — so they merge as a plain
// union: a change logged on the phone and another on the tablet the same
// afternoon both survive.
//
// The known cost: a removal is an absence, not a tombstone, so a deleted
// record comes back from the other device until that device syncs the
// removal... which it never can, because it has nothing to say. Records are
// added far more often than deleted, and the deletions that matter (a mistap
// on the diaper log) are cheap to repeat — but it is a real limitation, and
// `docs/sync.md` says so out loud.
//
// Pure and total: same inputs, same output, no clock, no storage.

import { DOC_VERSION, type AppData } from "./types.ts";

type Stamped = { updatedAt: string };

/** Merge two id-keyed maps of stamped records, the later edit winning. Ties
 *  keep the local side, so `mergeDocs(a, b)` and `mergeDocs(b, a)` agree on
 *  content whenever the timestamps differ, and are stable when they don't. */
function mergeStamped<T extends Stamped>(
  local: Record<string, T>,
  remote: Record<string, T>,
): Record<string, T> {
  const out: Record<string, T> = { ...local };
  for (const [id, remoteItem] of Object.entries(remote)) {
    const localItem = out[id];
    out[id] =
      localItem && localItem.updatedAt >= remoteItem.updatedAt
        ? localItem
        : remoteItem;
  }
  return out;
}

/** Merge two documents: stamped records by last edit, diaper changes by
 *  union. */
export function mergeDocs(local: AppData, remote: AppData): AppData {
  const child =
    local.child && remote.child
      ? local.child.updatedAt >= remote.child.updatedAt
        ? local.child
        : remote.child
      : (local.child ?? remote.child);
  const milk =
    local.milk.updatedAt >= remote.milk.updatedAt ? local.milk : remote.milk;
  return {
    version: DOC_VERSION,
    child,
    measurements: mergeStamped(local.measurements, remote.measurements),
    diapers: { ...remote.diapers, ...local.diapers },
    foods: mergeStamped(local.foods, remote.foods),
    milk,
    vaccinations: mergeStamped(local.vaccinations, remote.vaccinations),
  };
}

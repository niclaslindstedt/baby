// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// An on-device `StorageAdapter` over IndexedDB — the third place the
// document can live besides localStorage and a picked folder, and the one
// with room to grow: localStorage is capped at a few megabytes per origin and
// is the first thing a browser evicts under storage pressure, while
// IndexedDB is quota-managed and survives a "clear recent history" on most
// browsers when the site's data is marked persistent.
//
// It speaks the framework's byte contract, so the sync engine treats it
// exactly like a cloud backend: the localStorage working copy stays the
// working copy, and this is a second, durable copy of the same bytes on the
// same device, pushed on the same debounce and pulled on boot. Revisions are
// a counter kept beside the text, so a stale base revision is refused the
// way a cloud adapter refuses one — two tabs of the app writing over each
// other is the on-device version of two devices doing it.

import {
  ConflictError,
  createIdbStore,
  type StorageAdapter,
  type StoredSnapshot,
} from "@niclaslindstedt/oss-framework/storage";

type Record_ = { text: string; revision: number; savedAt: string };

const KEY = "document";

export type IdbAdapterOptions = {
  /** The database name — namespaced per app so two framework apps on one
   *  origin never collide. */
  dbName: string;
  storeName?: string;
};

/** Build the IndexedDB document adapter. */
export function createIdbDocAdapter(
  options: IdbAdapterOptions,
): StorageAdapter {
  // Strict: this store is where the copy *lives*, so a write that does not
  // land must surface as a failed save rather than as a silent no-op.
  const store = createIdbStore<Record_>({
    dbName: options.dbName,
    storeName: options.storeName ?? "documents",
    strict: true,
  });

  return {
    id: "browser",
    label: "IndexedDB",
    capabilities: new Set(["probe"]),
    async load(): Promise<StoredSnapshot | null> {
      const record = await store.get(KEY);
      if (!record) return null;
      return { text: record.text, revision: String(record.revision) };
    },
    async save(text: string, baseRevision?: string): Promise<StoredSnapshot> {
      const current = await store.get(KEY);
      const currentRevision = current ? String(current.revision) : undefined;
      if (
        current &&
        baseRevision !== undefined &&
        baseRevision !== currentRevision
      ) {
        throw new ConflictError({
          text: current.text,
          revision: currentRevision,
        });
      }
      const revision = (current?.revision ?? 0) + 1;
      await store.set(KEY, {
        text,
        revision,
        savedAt: new Date().toISOString(),
      });
      return { text, revision: String(revision) };
    },
    async probe(): Promise<boolean> {
      try {
        await store.keys();
        return true;
      } catch {
        return false;
      }
    },
  };
}

// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { parseDoc, serializeDoc } from "./migrations.ts";
import {
  emptyDoc,
  type AppData,
  type Child,
  type DiaperChange,
  type Food,
  type Measurement,
  type MilkFeeding,
  type Vaccination,
} from "./types.ts";
import * as output from "../output.ts";

// The app's data store. Holds the document in state, persists it to
// localStorage, and exposes the edits the app can make. This is the
// framework's "store stays in the app" seam: the framework owns the storage
// adapters and the UI kit, this hook owns where the document lives and what
// an edit means.
//
// The local copy is always the working copy. Cloud sync (see `useSyncEngine`)
// reads and writes *around* this hook rather than through it, so losing the
// network never costs a tap.

const DOC_KEY = "baby:doc";

/** The document storage seam. The store never touches `localStorage` directly
 *  — it reads and writes through a `DocBackend`, so a test (or the demo-data
 *  mode) can take over storage without the store changing. */
export type DocBackend = {
  readonly id: string;
  /** The current document, or an empty one when nothing is stored. */
  load(): AppData;
  /** Persist the document, answering whether the bytes actually landed. Still
   *  a best-effort sink — it must not throw — but the answer is what lets the
   *  shell tell a write that happened from one that didn't. */
  save(doc: AppData): boolean;
};

/**
 * The real backend: one JSON document in localStorage, run through the
 * migration pipeline on the way in and out.
 *
 * Both directions are *non-destructive*. A document that exists but this
 * build can't read — most often one a NEWER build already upgraded, then read
 * by a stale (service-worker-cached) build mid-update — is left on disk
 * untouched rather than replaced with a blank starter, so it comes back on
 * its own once the update finishes.
 */
export const localDocBackend: DocBackend = {
  id: "local",
  load() {
    let raw: string | null;
    try {
      raw = localStorage.getItem(DOC_KEY);
    } catch {
      // Storage unavailable (private mode, quota policy) — boot empty.
      return emptyDoc();
    }
    if (!raw) return emptyDoc();
    try {
      return parseDoc(raw);
    } catch (err) {
      // Bytes exist but can't be parsed. Keep the original on disk — the
      // caller must NOT persist the empty document we return here over it
      // (see the persist guard below) — and quarantine a copy so it stays
      // recoverable even if a later edit does overwrite the live key.
      output.error(
        `Couldn't read the record saved on this device — ${
          err instanceof Error ? err.message : String(err)
        }. The stored copy is left untouched and should reappear once the app finishes updating.`,
      );
      try {
        localStorage.setItem(`${DOC_KEY}:unreadable`, raw);
      } catch {
        // No room to quarantine — the live key is still left intact.
      }
      return emptyDoc();
    }
  },
  save(doc) {
    try {
      localStorage.setItem(DOC_KEY, serializeDoc(doc));
      return true;
    } catch (err) {
      output.error(
        `Couldn't save to this device — ${
          err instanceof Error ? err.message : String(err)
        }.`,
      );
      return false;
    }
  },
};

export type DocStore = {
  data: AppData;
  /** Create or update the child's profile. */
  saveChild: (child: Child) => void;
  /** Upsert one growth reading. */
  saveMeasurement: (m: Measurement) => void;
  removeMeasurement: (id: string) => void;
  /** Log one diaper change. The app's one high-frequency write. */
  addDiaper: (change: DiaperChange) => void;
  removeDiaper: (id: string) => void;
  /** Upsert one food in the regimen. */
  saveFood: (food: Food) => void;
  removeFood: (id: string) => void;
  setMilk: (milk: MilkFeeding) => void;
  /** Upsert one vaccination record. */
  saveVaccination: (v: Vaccination) => void;
  removeVaccination: (id: string) => void;
  /** Replace the whole document — used by the cloud adopt path and by the
   *  Settings import flow. */
  replaceAll: (doc: AppData) => void;
  /** Monotonic counter bumped on every edit. The sync engine debounces on it
   *  rather than deep-comparing the document. */
  editCount: number;
  /** True once the first load has been applied — the persist guard below
   *  refuses to write before it, so a slow read can never be overwritten by
   *  the empty document that preceded it. */
  loaded: boolean;
  /** How many write-throughs have failed. A counter rather than a flag so a
   *  second failure raises a second warning. */
  writeFailures: number;
};

type MapKey = "measurements" | "diapers" | "foods" | "vaccinations";

export function useDocStore(backend: DocBackend = localDocBackend): DocStore {
  // Read synchronously on the first render: localStorage can answer before
  // the first paint, so there is no empty-state flash to design around.
  const [data, setData] = useState<AppData>(() => backend.load());
  const [editCount, setEditCount] = useState(0);
  const [writeFailures, setWriteFailures] = useState(0);
  const loadedRef = useRef(true);

  // A backend swap (the demo-data toggle, and tests) adopts the new backend's
  // document rather than writing this one over it.
  useEffect(() => {
    loadedRef.current = false;
    setData(backend.load());
    loadedRef.current = true;
  }, [backend]);

  // Write-through on every change. Guarded on `loadedRef` so the document is
  // only ever persisted after a load has been applied.
  useEffect(() => {
    if (!loadedRef.current) return;
    if (!backend.save(data)) setWriteFailures((n) => n + 1);
  }, [backend, data]);

  // Every edit below is the same two moves: a functional update of one slice
  // of the document, and a bump of the edit counter the sync engine watches.
  const edit = useCallback((fn: (prev: AppData) => AppData) => {
    setData(fn);
    setEditCount((n) => n + 1);
  }, []);

  const upsert = useCallback(
    <K extends MapKey>(key: K, item: AppData[K][string]) =>
      edit((prev) => ({ ...prev, [key]: { ...prev[key], [item.id]: item } })),
    [edit],
  );
  const remove = useCallback(
    (key: MapKey, id: string) =>
      edit((prev) => {
        if (!prev[key][id]) return prev;
        const next = { ...prev[key] };
        delete next[id];
        return { ...prev, [key]: next };
      }),
    [edit],
  );

  const saveChild = useCallback(
    (child: Child) => edit((prev) => ({ ...prev, child })),
    [edit],
  );
  const setMilk = useCallback(
    (milk: MilkFeeding) => edit((prev) => ({ ...prev, milk })),
    [edit],
  );
  const saveMeasurement = useCallback(
    (m: Measurement) => upsert("measurements", m),
    [upsert],
  );
  const removeMeasurement = useCallback(
    (id: string) => remove("measurements", id),
    [remove],
  );
  const addDiaper = useCallback(
    (change: DiaperChange) => upsert("diapers", change),
    [upsert],
  );
  const removeDiaper = useCallback(
    (id: string) => remove("diapers", id),
    [remove],
  );
  const saveFood = useCallback((food: Food) => upsert("foods", food), [upsert]);
  const removeFood = useCallback((id: string) => remove("foods", id), [remove]);
  const saveVaccination = useCallback(
    (v: Vaccination) => upsert("vaccinations", v),
    [upsert],
  );
  const removeVaccination = useCallback(
    (id: string) => remove("vaccinations", id),
    [remove],
  );
  const replaceAll = useCallback((doc: AppData) => edit(() => doc), [edit]);

  return useMemo(
    () => ({
      data,
      saveChild,
      saveMeasurement,
      removeMeasurement,
      addDiaper,
      removeDiaper,
      saveFood,
      removeFood,
      setMilk,
      saveVaccination,
      removeVaccination,
      replaceAll,
      editCount,
      loaded: loadedRef.current,
      writeFailures,
    }),
    [
      data,
      saveChild,
      saveMeasurement,
      removeMeasurement,
      addDiaper,
      removeDiaper,
      saveFood,
      removeFood,
      setMilk,
      saveVaccination,
      removeVaccination,
      replaceAll,
      editCount,
      writeFailures,
    ],
  );
}

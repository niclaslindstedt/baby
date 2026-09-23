// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AuthError,
  ConflictError,
  RateLimitError,
  clearDirectoryHandle,
  completeDropboxAuth,
  createDropboxAdapter,
  createFolderAdapter,
  describeStorageError,
  ensurePermission,
  hasPendingDropboxAuth,
  isFolderBackendAvailable,
  isOfflineError,
  loadDirectoryHandle,
  localCacheKey,
  saveDirectoryHandle,
  startDropboxAuth,
  withLocalCache,
  type StorageAdapter,
} from "@niclaslindstedt/oss-framework/storage";
import type {
  ConnectionProbeResult,
  SaveStatus,
  SyncLocation,
} from "@niclaslindstedt/oss-framework/sync";

import { createIdbDocAdapter } from "./idbAdapter.ts";
import { logStore } from "./log.ts";
import { mergeDocs } from "./merge.ts";
import { parseDoc, serializeDoc } from "./migrations.ts";
import type { DocStore } from "./useDocStore.ts";

// The app's sync engine — the state machine the framework's `SyncStatus` glyph
// and `SyncDetailsModal` command centre paint over. The local document
// (localStorage, written by `useDocStore`) is always the working copy; when
// a backend is connected the engine pushes the serialized document there
// (debounced on the store's edit counter) and pulls the backend's copy on
// mount.
//
// Four backends beyond the working copy, all behind the framework's one
// `StorageAdapter` contract, so the code below is backend-agnostic past the
// `create*Adapter` calls:
//
//   - **This device** — a second, durable copy in the browser's own
//     IndexedDB (see `idbAdapter.ts`). No credentials, no picker, nothing
//     leaves the device; it is where every install starts. It used to sit
//     beside a "local only" choice that connected nothing at all, which was
//     a distinction without a difference to read — both were this device,
//     and one of them silently had no second copy.
//   - **A local folder** — a directory the user picks through the File System
//     Access API, holding `baby.json` as a real file they can open, back up,
//     or point another app at. The grant is persisted by the framework and
//     re-probed on boot. The API is a desktop-Chromium one (Chrome, Edge,
//     Opera) and no mobile browser ships it, so the choice is hidden where
//     the picker doesn't exist rather than offered and then failing.
//   - **Dropbox** and **Dropbox** — the user's own cloud account, so a
//     second device can read the same document.
//
// Only the last three are *sync* in the sense the top bar's glyph means —
// somewhere the record could also be read from. `remote` is that question,
// and it is why a plain install carries no glyph.
//
// Reconciliation is a per-record merge (see `merge.ts`), not a "pick a side"
// prompt: records carry their own `updatedAt` and diaper changes merge as a
// union, so two devices that logged different things between syncs both keep
// them without anyone being asked to choose — see `docs/sync.md`.

const syncLog = logStore.createLogger("sync");

export type SyncBackendId = "idb" | "folder" | "dropbox";

/** Where a record lives until the parent says otherwise: this device, in the
 *  browser's IndexedDB. Everything else is a copy somewhere the record could
 *  also be read from, and `disconnect` comes back here. */
export const LOCAL_BACKEND: SyncBackendId = "idb";

const BACKEND_KEY = "baby:sync:backend";
const DROPBOX_TOKENS_KEY = "baby:sync:dropbox";
// Dropbox is gone as a backend. The key stays named so a token a device
// may still hold is cleared rather than left sitting in storage.
const RETIRED_GDRIVE_TOKEN_KEY = "baby:sync:gdrive";
const IDB_DB_NAME = "baby:documents";

/** How long after the last edit a push is sent. Long enough to coalesce a
 *  burst of diaper taps into one request. */
const SAVE_DEBOUNCE_MS = 1200;

/** The document's file name on a file backend. */
const CLOUD_FILE_NAME = "baby.json";

// OAuth app identities, injected at build time. Without them the matching
// backend is hidden rather than offered and then failing at connect time.
export const DROPBOX_APP_KEY: string =
  (import.meta.env.VITE_DROPBOX_APP_KEY as string | undefined) ?? "";

// Dropbox fixes the app-folder name from the app's own configuration (an
// "App folder"-scoped app lives under `Apps/<name>/`), so it isn't always
// `baby`. Inject the real name at build time so the displayed location
// points at the folder that actually exists.
export const DROPBOX_APP_FOLDER: string =
  (import.meta.env.VITE_DROPBOX_APP_FOLDER as string | undefined)?.trim() ||
  "baby";

/** Whether the File System Access directory picker exists in this browser
 *  (Chromium-based). The local-folder backend is hidden where it doesn't. */
export const FOLDER_BACKEND_AVAILABLE = isFolderBackendAvailable();

/** The fallback display names, for the log lines and for anything that
 *  reaches the framework before a catalog does. The screens spell them
 *  through `t("settings.backendName.*")`. */
export const PROVIDER_NAMES: Record<SyncBackendId, string> = {
  idb: "This device",
  folder: "Local folder",
  dropbox: "Dropbox",
};

/** Which backends this build can offer — a provider with no client id
 *  configured, or a picker the browser lacks, is hidden entirely. */
export const AVAILABLE_BACKENDS: SyncBackendId[] = [
  "idb",
  ...(FOLDER_BACKEND_AVAILABLE ? (["folder"] as const) : []),
  ...(DROPBOX_APP_KEY ? (["dropbox"] as const) : []),
];

type DropboxTokens = { accessToken: string; refreshToken: string | null };

/**
 * A stored backend choice, normalised.
 *
 * Anything this build does not recognise falls back to this device, which is
 * the one backend that is always there and never asks for anything. That
 * covers a stored `"local"`, written by a build that offered "This device"
 * and "IndexedDB" as two choices where the first connected nothing: it reads
 * as this device now, which is what it always was. The document itself is
 * untouched by that — `useDocStore` writes localStorage whatever the backend
 * is, so the first pull finds an empty IndexedDB and pushes that copy into
 * it.
 */
export function parseBackend(raw: unknown): SyncBackendId {
  return raw === "dropbox" || raw === "folder" ? raw : LOCAL_BACKEND;
}

function readBackend(): SyncBackendId {
  try {
    return parseBackend(localStorage.getItem(BACKEND_KEY));
  } catch {
    return LOCAL_BACKEND;
  }
}

function writeBackend(backend: SyncBackendId): void {
  try {
    localStorage.setItem(BACKEND_KEY, backend);
  } catch {
    // Storage unavailable — the choice lasts the session.
  }
}

function readDropboxTokens(): DropboxTokens | null {
  try {
    const raw = localStorage.getItem(DROPBOX_TOKENS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DropboxTokens;
    return typeof parsed.accessToken === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function writeDropboxTokens(tokens: DropboxTokens | null): void {
  if (tokens) localStorage.setItem(DROPBOX_TOKENS_KEY, JSON.stringify(tokens));
  else localStorage.removeItem(DROPBOX_TOKENS_KEY);
}

export type SyncEngine = {
  backend: SyncBackendId;
  providerName: string;
  /** True when a backend is selected *and* ready to talk to. */
  connected: boolean;
  /** True when the copy is somewhere other than this device — a folder or a
   *  cloud account. The top bar's sync glyph rides on this: an IndexedDB
   *  copy of a document that never leaves the browser is not something to
   *  watch the status of. */
  remote: boolean;
  status: SaveStatus;
  statusDetail: string | null;
  /** Local edits the backend hasn't got yet. */
  dirty: boolean;
  /** The backend is unreachable and we're on the on-device copy. */
  offline: boolean;
  location: SyncLocation;
  /** Start the connect flow for a backend, or drop back to local-only. */
  connect: (backend: SyncBackendId) => Promise<void>;
  disconnect: () => void;
  /** Flush queued edits now. */
  saveNow: () => void;
  /** Re-read the backend's copy and merge it in. */
  reload: () => Promise<void>;
  /** Re-issue the backend grant after the session lapsed, or re-confirm a
   *  revoked folder grant. */
  reconnect: () => Promise<void>;
  /** Actively re-probe reachability, for the "Check connection" button. */
  checkConnection: () => Promise<ConnectionProbeResult>;
  /** True when the stored folder grant was revoked and needs re-confirming. */
  folderReconnectNeeded: boolean;
};

export function useSyncEngine(
  store: DocStore,
  // Suspend every read and write against the backend. Set while the developer
  // "Demo data" backend has taken over storage, so invented history is never
  // pushed up to — or merged with — a connected copy.
  paused = false,
): SyncEngine {
  const [backend, setBackendState] = useState<SyncBackendId>(readBackend);
  const [dropboxTokens, setDropboxTokens] = useState<DropboxTokens | null>(
    readDropboxTokens,
  );
  // The picked local folder (File System Access API). `null` until the boot
  // probe rehydrates the stored grant, the user picks one, or a revoked grant
  // drops it. The handle itself is persisted in IndexedDB by the framework.
  const [folderHandle, setFolderHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [folderReconnectNeeded, setFolderReconnectNeeded] = useState(false);

  const [status, setStatus] = useState<SaveStatus>("idle");
  const [statusDetail, setStatusDetail] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [dirty, setDirty] = useState(false);

  // The backend revision the next push is based on. Until the mount pull has
  // resolved it, a push would carry an unknown base revision — which the
  // adapter rejects as a conflict once a document exists — so pushes are held
  // behind `baselineReady`. The edit is safe in the local copy meanwhile.
  const baseRevision = useRef<string | undefined>(undefined);
  const [baselineReady, setBaselineReady] = useState(false);
  // The edit counter the backend has already seen. Compared against the live
  // one to decide whether anything still needs pushing.
  const pushedEdit = useRef(0);
  const dataRef = useRef(store.data);
  dataRef.current = store.data;

  // Drop the live folder handle and surface the reconnect cue — called by the
  // folder adapter when an in-flight op hits a revoked OS grant. The
  // IndexedDB record is kept so Settings can re-grant in one click.
  const markFolderPermissionLost = useCallback(() => {
    syncLog.warn("folder: permission lost — reconnect required");
    setFolderHandle(null);
    setFolderReconnectNeeded(true);
  }, []);

  // The storage adapter for the active backend. Cloud copies are wrapped so
  // they stay readable offline (`withLocalCache`); the on-device ones need
  // no such thing.
  const adapter: StorageAdapter | null = useMemo(() => {
    if (backend === "idb") {
      return createIdbDocAdapter({ dbName: IDB_DB_NAME });
    }
    if (backend === "folder" && folderHandle) {
      return createFolderAdapter(folderHandle, {
        fileName: CLOUD_FILE_NAME,
        onPermissionLost: markFolderPermissionLost,
        logger: logStore.createLogger("folder"),
      });
    }
    if (backend === "dropbox" && dropboxTokens) {
      const auth = {
        accessToken: dropboxTokens.accessToken,
        refreshToken: dropboxTokens.refreshToken,
        onAccessTokenRefreshed: (accessToken: string) => {
          const next = { ...dropboxTokens, accessToken };
          writeDropboxTokens(next);
          setDropboxTokens(next);
        },
      };
      const cloud = createDropboxAdapter(auth, {
        appKey: DROPBOX_APP_KEY || undefined,
        fileName: CLOUD_FILE_NAME,
        logger: logStore.createLogger("dropbox"),
      });
      return withLocalCache(cloud, {
        storage: localStorage,
        key: localCacheKey("dropbox", "baby"),
      });
    }
    return null;
  }, [backend, folderHandle, dropboxTokens, markFolderPermissionLost]);

  const connected = adapter !== null;

  // Turn a thrown error into the matching surface state. Every failure path
  // funnels through here so the glyph, the command centre, and the log always
  // agree on what went wrong.
  const reportFailure = useCallback((err: unknown, what: string): void => {
    const detail = describeStorageError(err);
    syncLog.error(`${what} failed — ${detail}`);
    setStatusDetail(detail);
    if (err instanceof AuthError) {
      setStatus("auth-error");
      return;
    }
    if (err instanceof RateLimitError) {
      setStatus("throttled");
      return;
    }
    if (isOfflineError(err)) {
      setOffline(true);
      setStatus("idle");
      return;
    }
    setStatus("error");
  }, []);

  /** Adopt a remote snapshot into the local document by merging it record by
   *  record, and report whether the merge left anything the remote doesn't
   *  have. */
  const adoptRemote = useCallback(
    (text: string): boolean => {
      const remote = parseDoc(text);
      const merged = mergeDocs(dataRef.current, remote);
      const mergedText = serializeDoc(merged);
      if (mergedText !== serializeDoc(dataRef.current)) {
        store.replaceAll(merged);
      }
      return mergedText !== serializeDoc(remote);
    },
    [store],
  );

  const push = useCallback(
    async (editAtSend: number): Promise<void> => {
      if (!adapter || paused) return;
      setStatus("saving");
      try {
        const snapshot = await adapter.save(
          serializeDoc(dataRef.current),
          baseRevision.current,
        );
        baseRevision.current = snapshot.revision;
        pushedEdit.current = editAtSend;
        setStatus("saved");
        setStatusDetail(null);
        setOffline(false);
        setDirty(false);
        syncLog.info("pushed document");
      } catch (err) {
        if (err instanceof ConflictError) {
          // The backend moved on. Merge its copy in and let the debounce fire
          // again with the merged document on the newer base revision — the
          // merge is per-record, so neither side's entries are dropped.
          syncLog.warn("conflict — merging the backend's copy");
          baseRevision.current = err.remote.revision;
          adoptRemote(err.remote.text);
          setStatus("idle");
          setStatusDetail(null);
          return;
        }
        reportFailure(err, "save");
      }
    },
    [adapter, adoptRemote, paused, reportFailure],
  );

  const pull = useCallback(async (): Promise<void> => {
    if (!adapter || paused) return;
    try {
      const snapshot = await adapter.load();
      baseRevision.current = snapshot?.revision;
      setOffline(Boolean(snapshot?.offline));
      if (snapshot) {
        const localAhead = adoptRemote(snapshot.text);
        // The merge produced something the backend doesn't hold yet (this
        // device logged things it never saw) — mark it for the next push.
        if (localAhead) setDirty(true);
        syncLog.info("pulled document");
      } else {
        // Nothing stored yet: this device's copy is the first one up.
        setDirty(true);
      }
      setStatusDetail(null);
    } catch (err) {
      reportFailure(err, "load");
    } finally {
      setBaselineReady(true);
    }
  }, [adapter, adoptRemote, paused, reportFailure]);

  // Complete a Dropbox OAuth redirect: trade the `?code=` for tokens, persist
  // them, and adopt the backend. Runs once on boot when a flow is mid-flight.
  useEffect(() => {
    if (!DROPBOX_APP_KEY || !hasPendingDropboxAuth()) return;
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) return;
    void (async () => {
      try {
        const result = await completeDropboxAuth(DROPBOX_APP_KEY, code);
        const tokens: DropboxTokens = {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken ?? null,
        };
        writeDropboxTokens(tokens);
        setDropboxTokens(tokens);
        writeBackend("dropbox");
        setBackendState("dropbox");
        syncLog.info("dropbox: connected");
      } catch (err) {
        syncLog.error(`dropbox: connect failed — ${describeStorageError(err)}`);
      } finally {
        // Drop the `?code=` from the address bar either way.
        window.history.replaceState(null, "", window.location.pathname);
      }
    })();
  }, []);

  // Rehydrate the folder grant on boot. The framework keeps the handle in
  // IndexedDB; the OS may have revoked the permission since, in which case
  // the reconnect cue is shown rather than the picker — a boot is not a user
  // gesture and cannot ask.
  useEffect(() => {
    if (backend !== "folder") return;
    let cancelled = false;
    void (async () => {
      const stored = await loadDirectoryHandle();
      if (cancelled) return;
      if (!stored) {
        setFolderReconnectNeeded(true);
        return;
      }
      const state = await ensurePermission(stored, false);
      if (cancelled) return;
      if (state === "granted") {
        setFolderHandle(stored);
        setFolderReconnectNeeded(false);
      } else {
        setFolderReconnectNeeded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [backend]);

  // Baseline read whenever the active adapter changes (connect, reconnect,
  // provider switch).
  useEffect(() => {
    setBaselineReady(false);
    if (!adapter) {
      setStatus("idle");
      setStatusDetail(null);
      setDirty(false);
      setOffline(false);
      return;
    }
    // Demo data has taken over storage: hold the baseline read, which also
    // holds every push behind it. The credentials and the backend copy are
    // left exactly as they were, and turning the toggle off re-runs this.
    if (paused) return;
    void pull();
  }, [adapter, paused, pull]);

  // Local edits mark the document dirty regardless of backend, so switching
  // one on later still pushes what's already here.
  useEffect(() => {
    if (store.editCount === pushedEdit.current) return;
    setDirty(true);
  }, [store.editCount]);

  // Debounced auto-push. Held while there's no connected backend, before the
  // baseline read resolves, or while a blocking fault stands in the way — the
  // edit is already safe in localStorage, so waiting costs nothing.
  useEffect(() => {
    if (!adapter || paused || !baselineReady || !dirty) return;
    if (status === "saving" || status === "auth-error") return;
    const editAtSend = store.editCount;
    const timer = setTimeout(() => void push(editAtSend), SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [adapter, paused, baselineReady, dirty, status, store.editCount, push]);

  const connectFolder = useCallback(async (): Promise<void> => {
    if (!FOLDER_BACKEND_AVAILABLE || !window.showDirectoryPicker) {
      throw new Error("This browser cannot open a local folder");
    }
    let handle: FileSystemDirectoryHandle;
    try {
      handle = await window.showDirectoryPicker({ mode: "readwrite" });
    } catch (err) {
      // AbortError = the user dismissed the picker; nothing to do.
      if (err instanceof DOMException && err.name === "AbortError") return;
      throw err;
    }
    const state = await ensurePermission(handle, true);
    if (state !== "granted") {
      throw new Error("Read-write permission to the folder was not granted");
    }
    await saveDirectoryHandle(handle);
    setFolderReconnectNeeded(false);
    setFolderHandle(handle);
    writeBackend("folder");
    setBackendState("folder");
    syncLog.info("folder: connected");
  }, []);

  const reconnectFolder = useCallback(async (): Promise<void> => {
    const stored = await loadDirectoryHandle();
    if (!stored) {
      await connectFolder();
      return;
    }
    const state = await ensurePermission(stored, true);
    if (state === "granted") {
      setFolderHandle(stored);
      setFolderReconnectNeeded(false);
      setStatus("idle");
      syncLog.info("folder: reconnected");
    } else {
      syncLog.warn("folder: reconnect declined");
    }
  }, [connectFolder]);

  const connect = useCallback(
    async (next: SyncBackendId): Promise<void> => {
      if (next === "idb") {
        writeBackend(next);
        setBackendState(next);
        return;
      }
      if (next === "folder") {
        await connectFolder();
        return;
      }
      if (!DROPBOX_APP_KEY) throw new Error("Dropbox is not configured");
      // Redirects away; `completeDropboxAuth` picks the flow up on return.
      await startDropboxAuth(DROPBOX_APP_KEY, syncLog);
    },
    [connectFolder],
  );

  const disconnect = useCallback((): void => {
    // Only the credentials and the grant go: the document stays on this
    // device, and the copy already on the backend is left exactly where it
    // is. Where it lands is `LOCAL_BACKEND` — disconnecting from a cloud
    // account is a move back to this device, not to nowhere.
    writeDropboxTokens(null);
    localStorage.removeItem(RETIRED_GDRIVE_TOKEN_KEY);
    void clearDirectoryHandle();
    writeBackend(LOCAL_BACKEND);
    setDropboxTokens(null);
    setFolderHandle(null);
    setFolderReconnectNeeded(false);
    setBackendState(LOCAL_BACKEND);
    syncLog.info("disconnected — the record stays on this device");
  }, []);

  const saveNow = useCallback((): void => {
    if (!adapter || !baselineReady) return;
    void push(store.editCount);
  }, [adapter, baselineReady, push, store.editCount]);

  const reload = useCallback(async (): Promise<void> => {
    await pull();
  }, [pull]);

  const reconnect = useCallback(async (): Promise<void> => {
    if (backend === "folder") {
      await reconnectFolder();
      return;
    }
    await connect(backend);
  }, [backend, connect, reconnectFolder]);

  const checkConnection =
    useCallback(async (): Promise<ConnectionProbeResult> => {
      if (!adapter?.probe) return offline ? "offline" : "online";
      try {
        const reachable = await adapter.probe();
        if (reachable) {
          setOffline(false);
          setStatusDetail(null);
          // Recovering means re-reading, then flushing whatever queued up.
          await pull();
          return "online";
        }
        setOffline(true);
        return "offline";
      } catch (err) {
        if (err instanceof AuthError) {
          setStatus("auth-error");
          setStatusDetail(describeStorageError(err));
          return "auth-error";
        }
        setOffline(true);
        return "offline";
      }
    }, [adapter, offline, pull]);

  /** The document's human-readable location on the active backend. */
  const path = (() => {
    if (backend === "dropbox") {
      return `Apps/${DROPBOX_APP_FOLDER}/${CLOUD_FILE_NAME}`;
    }
    if (backend === "folder") {
      return `${folderHandle?.name ?? "…"}/${CLOUD_FILE_NAME}`;
    }
    return `IndexedDB · ${IDB_DB_NAME}`;
  })();

  return {
    backend,
    providerName: PROVIDER_NAMES[backend],
    connected,
    remote: backend !== LOCAL_BACKEND,
    status,
    statusDetail,
    dirty,
    offline,
    location: { path },
    connect,
    disconnect,
    saveNow,
    reload,
    reconnect,
    checkConnection,
    folderReconnectNeeded,
  };
}

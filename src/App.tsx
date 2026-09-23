// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { dayKeyOf } from "@niclaslindstedt/oss-framework/calendar";
import {
  SpinnerIcon,
  ToastViewport,
  createToastStore,
} from "@niclaslindstedt/oss-framework/components";
import { useSwipeNav } from "@niclaslindstedt/oss-framework/hooks";
import { LogViewer } from "@niclaslindstedt/oss-framework/logging";
import { UpdateToast, usePwaUpdate } from "@niclaslindstedt/oss-framework/pwa";
import {
  SyncDetailsModal,
  SyncStatus,
} from "@niclaslindstedt/oss-framework/sync";
import { useApplyTheme } from "@niclaslindstedt/oss-framework/theme";

import {
  BottomNav,
  initialTab,
  isNavTab,
  navTabs,
  screenEnter,
  type NavTab,
  type ScreenEnter,
  type Tab,
} from "./app/BottomNav.tsx";
import { ChildScreen } from "./app/ChildScreen.tsx";
import { demoBackendModule, useDemoData } from "./app/dev/useDemoData.ts";
import { DiaperSheet } from "./app/DiaperSheet.tsx";
import { DiapersScreen } from "./app/DiapersScreen.tsx";
import { FoodScreen } from "./app/FoodScreen.tsx";
import { GrowthScreen } from "./app/GrowthScreen.tsx";
import { useT } from "./app/i18n/index.ts";
import { appearanceFor } from "./app/look.ts";
import { logStore } from "./app/log.ts";
import { cacheIdForBase } from "./app/pwa.ts";
import { SettingsScreen } from "./app/SettingsScreen.tsx";
import { TodayScreen } from "./app/TodayScreen.tsx";
import { TopBar } from "./app/TopBar.tsx";
import { newId, type DiaperKind } from "./app/types.ts";
import { useAppSettings } from "./app/useAppSettings.ts";
import { localDocBackend, useDocStore } from "./app/useDocStore.ts";
import { useGrowthStandards } from "./app/useGrowthStandards.ts";
import { useSyncEngine } from "./app/useSyncEngine.ts";
import { VaccinesScreen } from "./app/VaccinesScreen.tsx";
import { status } from "./output.ts";

// A local-first baby tracker built from the framework's shared surface. The
// app owns the document store, the derivations (growth, nutrition, diapers,
// vaccinations) and the screens; the framework supplies the theme engine,
// the storage adapters behind sync, the chart primitives, and the PWA update
// lifecycle.
//
// Everything hangs off one document in localStorage. There is no server:
// a connected backend, when there is one, is a copy of that same document in
// the user's own folder, IndexedDB, Dropbox or Drive.

// Module-scoped so the identity stays stable across renders (the framework's
// `useToasts` keys its subscription on the store object).
const toasts = createToastStore();

export function App() {
  const t = useT();
  const { settings, update, setFeature } = useAppSettings();
  useApplyTheme(useMemo(() => appearanceFor(settings.theme), [settings.theme]));

  // Today, as a calendar day. Recomputed on focus rather than on a timer:
  // the only way the answer changes while the app is open is midnight
  // passing — and for a baby tracker that is exactly when the app is open.
  const [today, setToday] = useState(() => dayKeyOf(new Date()));
  useEffect(() => {
    const refresh = () => setToday(dayKeyOf(new Date()));
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  // Developer "Demo data" takeover: while the toggle is on, an in-memory
  // backend seeded with an invented child replaces the real localStorage
  // one for the session (see `dev/useDemoData.ts`).
  const demo = useDemoData();
  const backend = useMemo(() => {
    const module = demoBackendModule();
    if (demo.on && module) return module.createDemoBackend();
    return localDocBackend;
  }, [demo.on]);
  const store = useDocStore(backend);
  const sync = useSyncEngine(store, demo.on);
  const standards = useGrowthStandards();

  // The trackers this parent uses, and the bar that follows from them: a
  // switched-off tracker loses its tab, and the swipe order closes over the
  // gap (see `navTabs`).
  const features = settings.features;
  const tabs = useMemo(() => navTabs(features), [features]);

  // Where the app opens: Today, or the child setup on an empty install
  // (see `initialTab`). Decided once, from the document this render started
  // with — the store reads localStorage synchronously, so it is the real one.
  const [tab, setTab] = useState<Tab>(() => initialTab(store.data));
  const [home, setHome] = useState<NavTab>("today");
  const [enter, setEnter] = useState<ScreenEnter>("none");
  const show = useCallback(
    (next: Tab) => {
      setEnter(screenEnter(tab, next, tabs));
      if (isNavTab(next)) setHome(next);
      setTab(next);
    },
    [tab, tabs],
  );
  const toggle = useCallback(
    (next: "child" | "settings") => {
      const target = tab === next ? home : next;
      setEnter(screenEnter(tab, target, tabs));
      setTab(target);
    },
    [tab, home, tabs],
  );

  // A swipe moves one tab along the bar, and stops at its ends. From Child
  // or Settings — which are not on the bar — it goes back to the tab they
  // were opened from.
  const main = useRef<HTMLElement>(null);
  const swipe = useCallback(
    (direction: 1 | -1) => {
      if (!isNavTab(tab)) {
        if (store.data.child === null) return;
        setEnter(screenEnter(tab, home, tabs));
        setTab(home);
        return;
      }
      const next = tabs[tabs.indexOf(tab) + direction];
      if (next !== undefined) show(next);
    },
    [tab, home, show, tabs, store.data.child],
  );
  useSwipeNav(main, swipe);

  // A tracker switched off while its own tab is up: the screen behind the
  // switch is gone, so fall back to Today — the one destination that is
  // always on the bar.
  useEffect(() => {
    if (isNavTab(tab) && !tabs.includes(tab)) {
      setEnter("none");
      setTab("today");
    }
    if (!tabs.includes(home)) setHome("today");
  }, [tabs, tab, home]);

  // The demo toggle can swap in a document with a child while the setup
  // screen is up, or take one away; follow it.
  useEffect(() => {
    if (store.data.child === null && tab !== "child" && tab !== "settings") {
      setTab("child");
    }
  }, [store.data.child, tab]);

  const [diaperOpen, setDiaperOpen] = useState(false);
  const [syncDetailsOpen, setSyncDetailsOpen] = useState(false);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    logStore.setCaptureEnabled(settings.captureLogs);
  }, [settings.captureLogs]);

  const notice = useCallback((message: string) => {
    toasts.clear();
    toasts.push({ message, kind: "success", durationMs: 2500 });
  }, []);

  // A refused write: the document did not reach the disk, the screen looks
  // exactly as it does on success, and the only honest thing to do is say
  // so — for longer than a confirmation would.
  useEffect(() => {
    if (store.writeFailures === 0) return;
    toasts.clear();
    toasts.push({
      message: t("today.saveFailed"),
      kind: "danger",
      durationMs: 8000,
    });
  }, [store.writeFailures, t]);

  const logDiaper = useCallback(
    (kind: DiaperKind) => {
      store.addDiaper({ id: newId(), kind, at: new Date().toISOString() });
      notice(t("diapers.logged"));
    },
    [store, notice, t],
  );

  const pwa = usePwaUpdate({
    base: import.meta.env.BASE_URL,
    cacheId: cacheIdForBase(import.meta.env.BASE_URL),
    enabled: !import.meta.env.DEV,
  });
  useEffect(() => {
    if (pwa.needRefresh) status(`Update ready: ${pwa.incomingVersion ?? "?"}`);
  }, [pwa.needRefresh, pwa.incomingVersion]);

  const hasChild = store.data.child !== null;

  return (
    <div className="flex h-full flex-col bg-page text-fg">
      <TopBar
        active={tab}
        onOpenSettings={() => toggle("settings")}
        onQuickLog={() => setDiaperOpen(true)}
        quickLogOpen={diaperOpen}
        showQuickLog={features.diapers}
        syncSlot={
          sync.remote ? (
            <SyncStatus
              providerName={t(`settings.backendName.${sync.backend}` as const)}
              status={sync.status}
              dirty={sync.dirty}
              offline={sync.offline}
              onOpenDetails={() => setSyncDetailsOpen(true)}
              labels={{ syncedTo: (name) => t("sync.syncedTo", { name }) }}
            />
          ) : undefined
        }
      />

      <main
        ref={main}
        className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
      >
        <div
          key={tab}
          data-enter={enter}
          className="app-screen mx-auto flex min-h-full max-w-2xl flex-col"
        >
          {tab === "today" && hasChild && (
            <TodayScreen
              data={store.data}
              today={today}
              standards={standards}
              features={features}
            />
          )}
          {tab === "diapers" && hasChild && features.diapers && (
            <DiapersScreen
              data={store.data}
              today={today}
              onLog={logDiaper}
              onRemove={(id) => {
                store.removeDiaper(id);
                notice(t("diapers.removed"));
              }}
            />
          )}
          {tab === "growth" && hasChild && features.growth && (
            <GrowthScreen
              data={store.data}
              today={today}
              onSave={store.saveMeasurement}
              onRemove={store.removeMeasurement}
              onNotice={notice}
            />
          )}
          {tab === "food" && hasChild && features.food && (
            <FoodScreen
              data={store.data}
              today={today}
              onSaveFood={store.saveFood}
              onRemoveFood={store.removeFood}
              onSetMilk={store.setMilk}
              onNotice={notice}
            />
          )}
          {tab === "vaccines" && hasChild && features.vaccines && (
            <VaccinesScreen
              data={store.data}
              today={today}
              onSave={store.saveVaccination}
              onRemove={store.removeVaccination}
              onNotice={notice}
            />
          )}
          {tab === "child" && (
            <ChildScreen
              initial={store.data.child}
              today={today}
              onSave={(child) => {
                store.saveChild(child);
                notice(t("child.saved"));
                show("today");
              }}
              onCancel={hasChild ? () => toggle("child") : undefined}
            />
          )}
          {tab === "settings" && (
            <SettingsScreen
              settings={settings}
              today={today}
              update={update}
              setFeature={setFeature}
              store={store}
              sync={sync}
              demoData={demo}
              onEditChild={() => toggle("child")}
              onNotice={notice}
            />
          )}
        </div>
      </main>

      <div className="relative shrink-0">
        {pwa.needRefresh && reloading ? (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-x-3 bottom-[calc(100%+0.75rem)] z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5 text-fg shadow-md"
          >
            <SpinnerIcon className="h-5 w-5 animate-spin text-accent" />
            <span className="text-sm font-medium">{t("update.reload")}</span>
          </div>
        ) : (
          <div className="app-update-prompt">
            <UpdateToast
              needRefresh={pwa.needRefresh}
              incomingVersion={pwa.incomingVersion}
              onReload={() => {
                setReloading(true);
                pwa.reload();
              }}
              onDismiss={() => pwa.dismiss()}
              labels={{
                ready: t("update.available"),
                action: t("update.reload"),
                dismiss: t("common.close"),
              }}
            />
          </div>
        )}
        <BottomNav active={tab} tabs={tabs} onSelect={show} />
      </div>

      <DiaperSheet
        open={diaperOpen && features.diapers}
        onLog={logDiaper}
        onClose={() => setDiaperOpen(false)}
      />

      <SyncDetailsModal
        open={syncDetailsOpen}
        providerName={t(`settings.backendName.${sync.backend}` as const)}
        backendKind={sync.backend === "dropbox" ? "cloud" : "folder"}
        location={sync.location}
        status={sync.status}
        statusDetail={sync.statusDetail}
        dirty={sync.dirty}
        offline={sync.offline}
        onSaveNow={sync.saveNow}
        onReload={() => void sync.reload()}
        onReconnect={sync.reconnect}
        onCheckConnection={sync.checkConnection}
        logPanel={settings.devMode ? <LogViewer store={logStore} /> : undefined}
        onClose={() => setSyncDetailsOpen(false)}
      />

      <ToastViewport
        store={toasts}
        labels={{ dismiss: t("common.close") }}
        className="app-toasts pointer-events-none fixed inset-x-0 top-0 z-[70] flex flex-col items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
      />
    </div>
  );
}

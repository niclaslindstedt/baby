// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import {
  Button,
  ConfirmDialog,
  SegmentedControl,
  Section,
  ToggleRow,
  DatabaseIcon,
  CloudIcon,
  InfoIcon,
  PaletteIcon,
  ScrollTextIcon,
} from "@niclaslindstedt/oss-framework/components";
import { LogViewer } from "@niclaslindstedt/oss-framework/logging";

import { logStore } from "./log.ts";
import { downloadBackup, readBackupFile } from "./backup.ts";
import type { DemoDataToggle } from "./dev/useDemoData.ts";
import { BabyIcon } from "./icons.tsx";
import { setLanguage, useLang, useT, type Lang } from "./i18n/index.ts";
import { mergeDocs } from "./merge.ts";
import { serializeDoc } from "./migrations.ts";
import { emptyDoc } from "./types.ts";
import type { AppSettings, ThemeChoice } from "./useAppSettings.ts";
import type { DocStore } from "./useDocStore.ts";
import {
  AVAILABLE_BACKENDS,
  PROVIDER_NAMES,
  type SyncBackendId,
  type SyncEngine,
} from "./useSyncEngine.ts";

// One scrolling page: appearance, language, the child, where the record
// lives, backup, the developer knobs, and About. The screen owns no state of
// its own beyond the confirm dialog — every knob reads and writes the
// caller's stores, so what is on screen is always what is persisted.

type Props = {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  store: DocStore;
  sync: SyncEngine;
  /** The in-memory demo-data takeover. Not part of `settings` on purpose:
   *  it is never persisted, so a reload always lands back on the real
   *  document. */
  demoData: DemoDataToggle;
  onEditChild: () => void;
  onNotice: (message: string) => void;
};

export function SettingsScreen({
  settings,
  update,
  store,
  sync,
  demoData,
  onEditChild,
  onNotice,
}: Props) {
  const t = useT();
  const lang = useLang();
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);

  const importBackup = async (file: File) => {
    try {
      const doc = await readBackupFile(file);
      // The same merge the sync path uses — a restore adds to what is here
      // rather than replacing it.
      store.replaceAll(mergeDocs(store.data, doc));
      onNotice(t("settings.imported"));
    } catch {
      onNotice(t("settings.importFailed"));
    }
  };

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      <Section
        title={t("settings.appearance")}
        icon={<PaletteIcon className="h-3.5 w-3.5" />}
      >
        <SegmentedControl<ThemeChoice>
          value={settings.theme}
          options={[
            { value: "light", label: t("settings.themeLight") },
            { value: "dark", label: t("settings.themeDark") },
            { value: "system", label: t("settings.themeSystem") },
          ]}
          onChange={(theme) => update("theme", theme)}
          ariaLabel={t("settings.theme")}
          fullWidth
        />
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg">
            {t("settings.language")}
          </span>
          <SegmentedControl<Lang>
            value={lang}
            options={[
              { value: "sv", label: "Svenska" },
              { value: "en", label: "English" },
            ]}
            onChange={(next) => setLanguage(next)}
            ariaLabel={t("settings.language")}
            fullWidth
          />
        </div>
      </Section>

      <Section
        title={t("settings.child")}
        icon={<BabyIcon className="h-3.5 w-3.5" />}
      >
        <p className="text-xs text-muted">{t("settings.childHint")}</p>
        <div>
          <Button onClick={onEditChild}>{t("settings.editChild")}</Button>
        </div>
      </Section>

      <Section
        title={t("settings.sync")}
        icon={<CloudIcon className="h-3.5 w-3.5" />}
      >
        <p className="text-xs text-muted">{t("settings.syncHint")}</p>
        <SegmentedControl<SyncBackendId>
          value={sync.backend}
          options={AVAILABLE_BACKENDS.map((id) => ({
            value: id,
            label: PROVIDER_NAMES[id],
          }))}
          onChange={(next) => {
            if (next === sync.backend) return;
            if (next === "local") {
              sync.disconnect();
              return;
            }
            setBusy(true);
            void sync
              .connect(next)
              .catch((err: unknown) =>
                onNotice(err instanceof Error ? err.message : String(err)),
              )
              .finally(() => setBusy(false));
          }}
          ariaLabel={t("settings.backend")}
          fullWidth
        />
        {sync.backend === "folder" && (
          <p className="text-xs text-muted">{t("settings.folderHint")}</p>
        )}
        {sync.backend === "idb" && (
          <p className="text-xs text-muted">{t("settings.idbHint")}</p>
        )}
        <p className="text-xs text-muted">
          {sync.connected
            ? t("settings.connected", { name: sync.providerName })
            : t("settings.localOnly")}
          {" · "}
          {sync.location.path}
        </p>
        {sync.backend === "folder" && sync.folderReconnectNeeded && (
          <div className="flex flex-col gap-1">
            <p className="text-xs text-danger">
              {t("settings.folderReconnectNeeded")}
            </p>
            <div>
              <Button variant="primary" onClick={() => void sync.reconnect()}>
                {t("settings.folderReconnect")}
              </Button>
            </div>
          </div>
        )}
        {sync.connected && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={sync.saveNow} disabled={busy || !sync.dirty}>
              {t("settings.saveNow")}
            </Button>
            <Button onClick={() => void sync.reload()} disabled={busy}>
              {t("settings.reload")}
            </Button>
            <Button variant="danger" onClick={sync.disconnect}>
              {t("settings.disconnect")}
            </Button>
          </div>
        )}
      </Section>

      <Section
        title={t("settings.data")}
        icon={<DatabaseIcon className="h-3.5 w-3.5" />}
      >
        <div className="flex flex-col gap-1">
          <div>
            <Button onClick={() => downloadBackup(store.data)}>
              {t("settings.export")}
            </Button>
          </div>
          <p className="text-xs text-muted">{t("settings.exportHint")}</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="inline-flex">
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => {
                const input = e.currentTarget;
                const file = input.files?.[0];
                if (file) void importBackup(file);
                input.value = "";
              }}
            />
            <span className="cursor-pointer rounded-md border border-line px-3 py-1.5 text-sm text-fg hover:bg-surface-2">
              {t("settings.import")}
            </span>
          </label>
          <p className="text-xs text-muted">{t("settings.importHint")}</p>
        </div>
        <div className="flex flex-col gap-1">
          <div>
            <Button variant="danger" onClick={() => setConfirmClear(true)}>
              {t("settings.deleteAll")}
            </Button>
          </div>
          <p className="text-xs text-muted">{t("settings.deleteAllHint")}</p>
        </div>
      </Section>

      <Section
        title={t("settings.developer")}
        icon={<ScrollTextIcon className="h-3.5 w-3.5" />}
      >
        <ToggleRow
          label={t("settings.devMode")}
          hint={t("settings.devModeHint")}
          checked={settings.devMode}
          onChange={(next) => {
            update("devMode", next);
            if (!next && demoData.on) demoData.setOn(false);
          }}
        />
        {settings.devMode && (
          <>
            <ToggleRow
              label={t("settings.demoData")}
              hint={t("settings.demoDataHint")}
              checked={demoData.on}
              onChange={(next) => {
                demoData.setOn(next);
                onNotice(
                  next ? t("settings.demoDataOn") : t("settings.demoDataOff"),
                );
              }}
            />
            <ToggleRow
              label={t("settings.captureLogs")}
              hint={t("settings.captureLogsHint")}
              checked={settings.captureLogs}
              onChange={(next) => {
                update("captureLogs", next);
                logStore.setCaptureEnabled(next);
              }}
            />
            <p className="text-xs text-muted">
              {t("settings.documentSize")}:{" "}
              {serializeDoc(store.data).length.toLocaleString()} bytes
            </p>
            <div className="max-h-64 overflow-auto rounded-md border border-line p-2">
              <LogViewer store={logStore} />
            </div>
          </>
        )}
      </Section>

      <Section
        title={t("settings.about")}
        icon={<InfoIcon className="h-3.5 w-3.5" />}
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted">{t("settings.version")}</dt>
          <dd className="text-fg">{__APP_VERSION__}</dd>
          <dt className="text-muted">{t("settings.build")}</dt>
          <dd className="text-fg">{__BUILD_LABEL__}</dd>
        </dl>
        <p className="text-xs leading-snug text-muted">
          {t("settings.privacy")}
        </p>
        <p className="text-xs leading-snug text-muted">
          {t("settings.disclaimer")}
        </p>
      </Section>

      <ConfirmDialog
        open={confirmClear}
        title={t("settings.deleteAllConfirm")}
        description={t("settings.deleteAllHint")}
        confirmLabel={t("common.delete")}
        tone="danger"
        labels={{ cancel: t("common.cancel"), close: t("common.close") }}
        onConfirm={() => {
          store.replaceAll(emptyDoc());
          setConfirmClear(false);
          onNotice(t("settings.deleted"));
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}

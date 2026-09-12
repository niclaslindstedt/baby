// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { Button, Modal } from "@niclaslindstedt/oss-framework/components";

import { DiaperButtons } from "./DiaperButtons.tsx";
import { useT } from "./i18n/index.ts";
import type { DiaperKind } from "./types.ts";

// The sheet behind the top bar's `+`: the three diaper buttons, from any
// screen. A modal rather than a screen on purpose — logging a change must
// not cost the chart someone was reading on Growth. One tap logs and closes.

type Props = {
  open: boolean;
  onLog: (kind: DiaperKind) => void;
  onClose: () => void;
};

const TITLE_ID = "diaper-sheet-title";

export function DiaperSheet({ open, onLog, onClose }: Props) {
  const t = useT();
  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={TITLE_ID}
      centered
      closeLabel={t("common.close")}
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-line bg-surface-3 px-4 py-3">
          <Button onClick={onClose}>{t("common.cancel")}</Button>
        </div>
      }
    >
      <div className="shrink-0 border-b border-line bg-surface-3 px-4 py-3">
        <h2
          id={TITLE_ID}
          className="text-xs font-bold tracking-wide text-accent uppercase"
        >
          {t("quickLog.title")}
        </h2>
        <p className="mt-0.5 text-sm text-fg-bright">
          {t("quickLog.subtitle")}
        </p>
      </div>
      <div className="px-4 py-4">
        <DiaperButtons
          onLog={(kind) => {
            onLog(kind);
            onClose();
          }}
          large
        />
      </div>
    </Modal>
  );
}

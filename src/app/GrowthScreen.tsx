// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";
import {
  Button,
  ConfirmDialog,
  PencilIcon,
  PlusIcon,
} from "@niclaslindstedt/oss-framework/components";

import { ageLabel } from "./copy.ts";
import { formatDayYear, measurementValues } from "./format.ts";
import { GrowthIcon, TrashIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import { MeasurementForm } from "./MeasurementForm.tsx";
import { sortedMeasurements, type AppData, type Measurement } from "./types.ts";
import { Card, EmptyState, Heading } from "./ui.tsx";

// Growth, the input side: what the scale and the tape said, and when.
//
// The curve, the trend across the SD channels, the forecast and the two
// adult-height estimates all used to be on this screen. They are answers, and
// answers live on Today now — this tab opens the growth view from its Growth
// card (see `GrowthModal.tsx`). What is left here is the one thing only this
// screen can do: get a reading into the document, and correct one that was
// typed wrong.
//
// That is not a smaller screen by accident. A reading can be added as often
// as a parent likes — a home scale every morning is fine — so the list is the
// whole surface, and it is never more than two taps from the form.

type Props = {
  data: AppData;
  today: DayKey;
  onSave: (m: Measurement) => void;
  onRemove: (id: string) => void;
  onNotice: (message: string) => void;
};

export function GrowthScreen({
  data,
  today,
  onSave,
  onRemove,
  onNotice,
}: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const child = data.child!;
  const [editing, setEditing] = useState<Measurement | null | "new">(null);
  const [confirmDelete, setConfirmDelete] = useState<Measurement | null>(null);

  const all = sortedMeasurements(data);

  if (editing !== null) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-3 px-3 py-3">
        <Card>
          <Heading>
            {editing === "new"
              ? t("growth.form.addTitle")
              : t("growth.form.editTitle")}
          </Heading>
          <div className="mt-3">
            <MeasurementForm
              initial={editing === "new" ? null : editing}
              today={today}
              onSave={(m) => {
                onSave(m);
                onNotice(t("growth.saved"));
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      {all.length === 0 ? (
        <EmptyState
          icon={<GrowthIcon className="h-8 w-8" />}
          text={t("growth.empty")}
          action={
            <Button variant="primary" onClick={() => setEditing("new")}>
              {t("growth.add")}
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="flex items-center justify-between gap-2">
            <Heading>{t("growth.readings")}</Heading>
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-accent hover:bg-surface-2"
            >
              <PlusIcon className="h-4 w-4" />
              {t("growth.add")}
            </button>
          </div>
          <p className="mt-1 text-xs text-muted">{t("growth.readingsHint")}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {[...all].reverse().map((m) => (
              <li
                key={m.id}
                className="flex items-start justify-between gap-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="text-fg-bright">
                    {t("growth.reading", {
                      date: formatDayYear(m.date, locale),
                      age: ageLabel(t, child.birthDate, m.date, locale),
                    })}
                  </p>
                  <p className="text-xs text-muted">
                    {measurementValues(m, locale).join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(m)}
                    aria-label={t("common.edit")}
                    title={t("common.edit")}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(m)}
                    aria-label={t("common.delete")}
                    title={t("common.delete")}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-danger"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title={t("growth.form.deleteConfirm")}
        confirmLabel={t("common.delete")}
        tone="danger"
        labels={{ cancel: t("common.cancel"), close: t("common.close") }}
        onConfirm={() => {
          if (confirmDelete) onRemove(confirmDelete.id);
          setConfirmDelete(null);
          onNotice(t("growth.deleted"));
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

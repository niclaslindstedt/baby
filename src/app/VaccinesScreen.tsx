// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo, useState } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";
import {
  Button,
  CheckIcon,
  ConfirmDialog,
  PlusIcon,
} from "@niclaslindstedt/oss-framework/components";

import { formatDayYear } from "./format.ts";
import { SyringeIcon, TrashIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import { doseName } from "./TodayScreen.tsx";
import { newId, type AppData, type Vaccination } from "./types.ts";
import { Card, Field, Heading, TextInput } from "./ui.tsx";
import {
  EXTRAS,
  extraFor,
  extraRecords,
  timeline,
  type DoseTiming,
  type TimelineEntry,
} from "./vaccines.ts";

// Vaccinations: the programme as a timeline for this child, and the extras
// beside it. Each programme row is given, expected by now, or upcoming; a
// tap on an open row records it with today's date and, optionally, the
// vaccine's name off the card.

type Props = {
  data: AppData;
  today: DayKey;
  onSave: (v: Vaccination) => void;
  onRemove: (id: string) => void;
  onNotice: (message: string) => void;
};

type Draft = { doseId: string; label: string };

export function VaccinesScreen({
  data,
  today,
  onSave,
  onRemove,
  onNotice,
}: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const entries = useMemo(() => timeline(data, today), [data, today]);
  const extras = useMemo(() => extraRecords(data), [data]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Vaccination | null>(null);

  if (draft) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-3 px-3 py-3">
        <Card>
          <Heading>{t("vaccines.form.title")}</Heading>
          <div className="mt-3">
            <RecordForm
              draft={draft}
              today={today}
              onSave={(v) => {
                onSave(v);
                onNotice(t("vaccines.saved"));
                setDraft(null);
              }}
              onCancel={() => setDraft(null)}
            />
          </div>
        </Card>
      </div>
    );
  }

  const timingLabel = (timing: DoseTiming) => {
    switch (timing.kind) {
      case "weeks":
        return t("vaccines.at.weeks", { count: String(timing.weeks) });
      case "months":
        return t("vaccines.at.months", { count: String(timing.months) });
      case "years":
        return t("vaccines.at.years", { count: String(timing.years) });
      case "school":
        return t("vaccines.at.school", { grade: timing.grade });
    }
  };

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      <Card>
        <Heading>{t("vaccines.programme")}</Heading>
        <p className="mt-1 text-xs text-muted">{t("vaccines.programmeHint")}</p>
        <ul className="mt-3 flex flex-col gap-2">
          {entries.map((entry) => (
            <TimelineRow
              key={entry.dose.id}
              entry={entry}
              locale={locale}
              timing={timingLabel(entry.dose.timing)}
              onRecord={() => setDraft({ doseId: entry.dose.id, label: "" })}
              onRemove={() => entry.record && setConfirmRemove(entry.record)}
            />
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">{t("vaccines.sources")}</p>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <Heading>{t("vaccines.extras")}</Heading>
          <button
            type="button"
            onClick={() => setDraft({ doseId: "other", label: "" })}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-accent hover:bg-surface-2"
          >
            <PlusIcon className="h-4 w-4" />
            {t("vaccines.recordExtra")}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">{t("vaccines.extrasHint")}</p>
        {extras.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {extras.map((v) => (
              <li
                key={v.id}
                className="flex items-start justify-between gap-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-fg-bright">
                    {v.doseId === "other"
                      ? v.label || t("vaccines.extra.other")
                      : t(
                          `vaccines.extra.${v.doseId}` as Parameters<
                            typeof t
                          >[0],
                        )}
                  </p>
                  <p className="text-xs text-muted">
                    {t("vaccines.givenOn", {
                      date: formatDayYear(v.date, locale),
                    })}
                    {v.vaccineName && ` · ${v.vaccineName}`}
                    {v.note && ` · ${v.note}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(v)}
                  aria-label={t("common.remove")}
                  title={t("common.remove")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-danger"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <ul className="mt-3 flex flex-col gap-1.5 border-t border-line pt-3">
          {EXTRAS.map((extra) => (
            <li
              key={extra.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="min-w-0">
                <p className="text-fg">
                  {t(`vaccines.extra.${extra.id}` as Parameters<typeof t>[0])}
                </p>
                <p className="text-xs text-muted">
                  {t(`vaccines.typicalAge.${extra.typicalAge}` as const)} ·{" "}
                  {t(`vaccines.offer.${extra.offer}` as const)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDraft({ doseId: extra.id, label: "" })}
                className="shrink-0 rounded-md border border-line px-2 py-1 text-xs text-fg hover:bg-surface-2"
              >
                {t("vaccines.markGiven")}
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <ConfirmDialog
        open={confirmRemove !== null}
        title={t("vaccines.form.removeConfirm")}
        confirmLabel={t("common.remove")}
        tone="danger"
        labels={{ cancel: t("common.cancel"), close: t("common.close") }}
        onConfirm={() => {
          if (confirmRemove) onRemove(confirmRemove.id);
          setConfirmRemove(null);
          onNotice(t("vaccines.removed"));
        }}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  );
}

function TimelineRow({
  entry,
  locale,
  timing,
  onRecord,
  onRemove,
}: {
  entry: TimelineEntry;
  locale: string;
  timing: string;
  onRecord: () => void;
  onRemove: () => void;
}) {
  const t = useT();
  const { dose, status, due, record } = entry;
  const skin =
    status === "given"
      ? "border-accent/40 bg-accent/10"
      : status === "due"
        ? "border-danger/40 bg-danger/10"
        : "border-line bg-surface";
  return (
    <li className={`flex items-start gap-3 rounded-xl border p-3 ${skin}`}>
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          status === "given"
            ? "border-accent bg-accent text-page-bg"
            : "border-line text-transparent"
        }`}
      >
        <CheckIcon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg-bright">
          {doseName(t, dose.group, dose.doseNumber, dose.diseases.length)}
        </p>
        <p className="text-xs text-muted">
          {timing} · {t(`vaccines.where.${dose.where}` as const)}
          {dose.route === "oral" && ` · ${t("vaccines.oral")}`}
        </p>
        <p className="mt-0.5 text-xs text-fg">
          {status === "given" && record
            ? `${t("vaccines.givenOn", { date: formatDayYear(record.date, locale) })}${record.vaccineName ? ` · ${record.vaccineName}` : ""}${record.note ? ` · ${record.note}` : ""}`
            : status === "due"
              ? `${t("vaccines.due")} · ${t("vaccines.expected", { date: formatDayYear(due, locale) })}`
              : t("vaccines.expected", { date: formatDayYear(due, locale) })}
        </p>
        {dose.note && (
          <p className="mt-0.5 text-xs text-muted">
            {t(`vaccines.note.${dose.note}` as const)}
          </p>
        )}
      </div>
      {status === "given" ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("common.remove")}
          title={t("common.remove")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-danger"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onRecord}
          className="shrink-0 rounded-md border border-line px-2 py-1 text-xs text-fg hover:bg-surface-2"
        >
          {t("vaccines.markGiven")}
        </button>
      )}
    </li>
  );
}

function RecordForm({
  draft,
  today,
  onSave,
  onCancel,
}: {
  draft: Draft;
  today: DayKey;
  onSave: (v: Vaccination) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [date, setDate] = useState<string>(today);
  const [vaccineName, setVaccineName] = useState("");
  const [label, setLabel] = useState(draft.label);
  const [note, setNote] = useState("");
  const isOther = draft.doseId === "other";
  const extra = extraFor(draft.doseId);
  const which = isOther
    ? t("vaccines.extra.other")
    : extra
      ? t(`vaccines.extra.${extra.id}` as Parameters<typeof t>[0])
      : draft.doseId;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
        onSave({
          id: newId(),
          doseId: draft.doseId,
          date: date as DayKey,
          vaccineName: vaccineName.trim(),
          label: label.trim(),
          note: note.trim(),
          updatedAt: new Date().toISOString(),
        });
      }}
    >
      {(isOther || extra) && (
        <p className="flex items-center gap-2 text-sm text-fg-bright">
          <SyringeIcon className="h-4 w-4 text-accent" />
          {which}
        </p>
      )}
      {isOther && (
        <Field label={t("vaccines.form.label")}>
          <TextInput
            value={label}
            placeholder={t("vaccines.form.labelPlaceholder")}
            onChange={setLabel}
            autoFocus
          />
        </Field>
      )}
      <Field label={t("vaccines.form.date")}>
        <TextInput type="date" value={date} max={today} onChange={setDate} />
      </Field>
      <Field label={t("vaccines.form.vaccineName")}>
        <TextInput
          value={vaccineName}
          placeholder={t("vaccines.form.vaccineNamePlaceholder")}
          onChange={setVaccineName}
        />
      </Field>
      <Field label={t("vaccines.form.note")}>
        <TextInput
          value={note}
          placeholder={t("vaccines.form.notePlaceholder")}
          onChange={setNote}
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" variant="primary">
          {t("vaccines.form.save")}
        </Button>
        <Button onClick={onCancel}>{t("common.cancel")}</Button>
      </div>
    </form>
  );
}

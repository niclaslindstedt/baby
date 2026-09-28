// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";
import { Button } from "@niclaslindstedt/oss-framework/components";

import { unitLabel } from "./format.ts";
import { useLocale, useT } from "./i18n/index.ts";
import { newId, type Measurement } from "./types.ts";
import { DateField, Field, PairInput, TextInput } from "./ui.tsx";
import {
  keepIfUnchanged,
  lengthDraft,
  parseLength,
  parseWeight,
  unitSystemFor,
  weightDraft,
} from "./units.ts";

// One growth reading: a date and whichever of the three measurements was
// taken. One field is enough — a home scale gives one number, a BVC visit
// three — and the form insists on nothing but that there is at least one.
//
// Typed in the locale's units — pounds and ounces and inches on a US phone —
// and saved in kilograms and centimetres, which is all the document holds. A
// value the parent didn't touch is saved exactly as stored, so opening a
// reading never moves it by a conversion's rounding.

type Props = {
  initial: Measurement | null;
  today: DayKey;
  onSave: (m: Measurement) => void;
  onCancel: () => void;
};

export function MeasurementForm({ initial, today, onSave, onCancel }: Props) {
  const t = useT();
  const locale = useLocale();
  const units = unitSystemFor(locale);
  const [date, setDate] = useState<string>(initial?.date ?? today);
  // What the fields opened with, to tell an untouched value from a typed one.
  const [opened] = useState(() => ({
    weight: weightDraft(initial?.weightKg ?? null, units),
    length: lengthDraft(initial?.lengthCm ?? null, units),
    head: lengthDraft(initial?.headCm ?? null, units),
  }));
  const [weight, setWeight] = useState(opened.weight);
  const [length, setLength] = useState(opened.length);
  const [head, setHead] = useState(opened.head);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const weightKg = keepIfUnchanged(
      initial?.weightKg ?? null,
      opened.weight,
      weight,
      parseWeight(weight, units),
    );
    const lengthCm = keepIfUnchanged(
      initial?.lengthCm ?? null,
      opened.length,
      length,
      parseLength(length, units),
    );
    const headCm = keepIfUnchanged(
      initial?.headCm ?? null,
      opened.head,
      head,
      parseLength(head, units),
    );
    if (weightKg === null && lengthCm === null && headCm === null) {
      setError(t("growth.form.nothing"));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    onSave({
      id: initial?.id ?? newId(),
      date: date as DayKey,
      weightKg,
      lengthCm,
      headCm,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Field label={t("growth.form.date")}>
        <DateField
          label={t("growth.form.date")}
          value={date}
          max={today}
          onChange={setDate}
        />
      </Field>
      <p className="text-xs text-muted">{t("growth.form.hint")}</p>
      <Field
        label={t("growth.form.weight", { unit: unitLabel("weight", locale) })}
      >
        {units === "us" ? (
          <PairInput
            label={t("growth.form.weight", {
              unit: unitLabel("weight", locale),
            })}
            value={weight}
            units={["lb", "oz"]}
            onChange={(v) => {
              setWeight(v);
              setError(null);
            }}
            autoFocus
          />
        ) : (
          <TextInput
            type="decimal"
            value={weight.main}
            onChange={(v) => {
              setWeight({ main: v, sub: "" });
              setError(null);
            }}
            autoFocus
          />
        )}
      </Field>
      <Field
        label={t("growth.form.length", { unit: unitLabel("length", locale) })}
      >
        <TextInput
          type="decimal"
          value={length}
          onChange={(v) => {
            setLength(v);
            setError(null);
          }}
        />
      </Field>
      <Field
        label={t("growth.form.head", { unit: unitLabel("length", locale) })}
        error={error ?? undefined}
      >
        <TextInput
          type="decimal"
          value={head}
          onChange={(v) => {
            setHead(v);
            setError(null);
          }}
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" variant="primary">
          {t("growth.form.save")}
        </Button>
        <Button onClick={onCancel}>{t("common.cancel")}</Button>
      </div>
    </form>
  );
}

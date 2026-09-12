// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";
import { Button } from "@niclaslindstedt/oss-framework/components";

import { useT } from "./i18n/index.ts";
import { newId, type Measurement } from "./types.ts";
import { Field, parseNumber, TextInput } from "./ui.tsx";

// One growth reading: a date and whichever of the three measurements was
// taken. One field is enough — a home scale gives one number, a BVC visit
// three — and the form insists on nothing but that there is at least one.

type Props = {
  initial: Measurement | null;
  today: DayKey;
  onSave: (m: Measurement) => void;
  onCancel: () => void;
};

export function MeasurementForm({ initial, today, onSave, onCancel }: Props) {
  const t = useT();
  const [date, setDate] = useState<string>(initial?.date ?? today);
  const [weight, setWeight] = useState(
    initial?.weightKg === null || !initial ? "" : String(initial.weightKg),
  );
  const [length, setLength] = useState(
    initial?.lengthCm === null || !initial ? "" : String(initial.lengthCm),
  );
  const [head, setHead] = useState(
    initial?.headCm === null || !initial ? "" : String(initial.headCm),
  );
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const weightKg = parseNumber(weight);
    const lengthCm = parseNumber(length);
    const headCm = parseNumber(head);
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
        <TextInput type="date" value={date} max={today} onChange={setDate} />
      </Field>
      <p className="text-xs text-muted">{t("growth.form.hint")}</p>
      <Field label={t("growth.form.weight")}>
        <TextInput
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={weight}
          onChange={(v) => {
            setWeight(v);
            setError(null);
          }}
          autoFocus
        />
      </Field>
      <Field label={t("growth.form.length")}>
        <TextInput
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          value={length}
          onChange={(v) => {
            setLength(v);
            setError(null);
          }}
        />
      </Field>
      <Field label={t("growth.form.head")} error={error ?? undefined}>
        <TextInput
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
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

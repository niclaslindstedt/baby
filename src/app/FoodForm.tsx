// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useEffect, useState } from "react";

import {
  Button,
  SegmentedControl,
} from "@niclaslindstedt/oss-framework/components";

import type { FoodPreset } from "./data/foods.ts";
import { ClockIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import {
  newId,
  NUTRIENT_KEYS,
  type Food,
  type NutrientKey,
  type Nutrients,
} from "./types.ts";
import { Field, parseNumber, TextInput } from "./ui.tsx";

// One food in the regimen: a name, a daily amount, and what is in 100 g of
// it. Calories are the only thing the form insists on — every other value
// is a claim the parent chooses to make, and a blank is "unknown", never
// zero. The common-foods chips fill the whole card from Livsmedelsverket's
// database with one tap; the chips ride in their own chunk and arrive a beat
// after the form opens.

type Props = {
  initial: Food | null;
  onSave: (food: Food) => void;
  onCancel: () => void;
};

const OPTIONAL: NutrientKey[] = NUTRIENT_KEYS.filter((k) => k !== "kcal");
const MAIN: NutrientKey[] = [
  "ironMg",
  "vitaminDUg",
  "fatG",
  "saturatedG",
  "monounsaturatedG",
  "polyunsaturatedG",
  "omega3G",
  "omega6G",
];
const DETAIL: NutrientKey[] = ["alaG", "dhaG", "epaG"];

/** The times a food can be pinned to: every second hour of a baby's waking
 *  day. Two-hourly rather than to the minute on purpose — the regimen claims
 *  a typical day, and the one thing the times are read for is the shape of
 *  the coverage curve, which a quarter of an hour either way does not move.
 *  A time already on a food that is not on this grid (a hand-edited document,
 *  a finer grid later) is offered beside them rather than dropped. */
const TIME_CHIPS = [
  "06:00",
  "08:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
  "20:00",
  "22:00",
];

export function FoodForm({ initial, onSave, onCancel }: Props) {
  const t = useT();
  const lang = useLang();
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [unit, setUnit] = useState<"g" | "ml">(initial?.unit ?? "g");
  const [values, setValues] = useState<Record<NutrientKey, string>>(() => {
    const out = {} as Record<NutrientKey, string>;
    for (const key of NUTRIENT_KEYS) {
      const v = initial?.per100[key];
      out[key] = v === undefined ? "" : String(v);
    }
    return out;
  });
  const [times, setTimes] = useState<string[]>(initial?.times ?? []);
  const [showDetail, setShowDetail] = useState(
    DETAIL.some((k) => initial?.per100[k] !== undefined),
  );
  const [nameMissing, setNameMissing] = useState(false);
  const [kcalMissing, setKcalMissing] = useState(false);

  const [presets, setPresets] = useState<FoodPreset[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    void import("./data/foods.ts").then((m) => {
      if (!cancelled) setPresets(m.FOOD_PRESETS);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const applyPreset = (p: FoodPreset) => {
    setName(p.name[lang]);
    setUnit(p.unit);
    if (amount.trim() === "") setAmount(String(p.typicalAmount));
    setValues(() => {
      const out = {} as Record<NutrientKey, string>;
      for (const key of NUTRIENT_KEYS) {
        const v = p.per100[key];
        out[key] = v === undefined ? "" : String(v);
      }
      return out;
    });
    setShowDetail(DETAIL.some((k) => p.per100[k] !== undefined));
    setNameMissing(false);
    setKcalMissing(false);
  };

  const save = () => {
    const trimmed = name.trim();
    const kcal = parseNumber(values.kcal);
    const amt = parseNumber(amount);
    let bad = false;
    if (trimmed === "") {
      setNameMissing(true);
      bad = true;
    }
    if (kcal === null || kcal < 0) {
      setKcalMissing(true);
      bad = true;
    }
    if (bad || kcal === null) return;
    const per100: Nutrients = { kcal };
    for (const key of OPTIONAL) {
      const v = parseNumber(values[key]);
      if (v !== null && v >= 0) per100[key] = v;
    }
    onSave({
      id: initial?.id ?? newId(),
      name: trimmed,
      amount: amt !== null && amt >= 0 ? amt : 0,
      unit,
      per100,
      times: [...times].sort(),
      updatedAt: new Date().toISOString(),
    });
  };

  const set = (key: NutrientKey) => (v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const toggleTime = (time: string) =>
    setTimes((prev) =>
      prev.includes(time)
        ? prev.filter((t) => t !== time)
        : [...prev, time].sort(),
    );
  const timeOptions = [
    ...new Set([...TIME_CHIPS, ...(initial?.times ?? [])]),
  ].sort();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      {presets && presets.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg">
            {t("food.form.presets")}
          </span>
          <div
            role="group"
            aria-label={t("food.form.presets")}
            className="flex flex-wrap gap-1.5"
          >
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-full border border-line px-2.5 py-1 text-xs text-fg hover:bg-surface-2"
              >
                {p.name[lang]}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted">
            {t("food.form.presetsHint")}
          </span>
        </div>
      )}

      <Field
        label={t("food.form.name")}
        error={nameMissing ? t("food.form.nameMissing") : undefined}
      >
        <TextInput
          value={name}
          invalid={nameMissing}
          placeholder={t("food.form.namePlaceholder")}
          onChange={(v) => {
            setName(v);
            setNameMissing(false);
          }}
        />
      </Field>

      <div className="grid grid-cols-[1fr_auto] items-end gap-2">
        <Field label={t("food.form.amount")}>
          <TextInput
            type="number"
            inputMode="decimal"
            step="1"
            min="0"
            value={amount}
            onChange={setAmount}
          />
        </Field>
        <SegmentedControl<"g" | "ml">
          value={unit}
          options={[
            { value: "g", label: t("food.form.grams") },
            { value: "ml", label: t("food.form.millilitres") },
          ]}
          onChange={setUnit}
          ariaLabel={t("food.form.unit")}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-xs font-medium text-fg">
          <ClockIcon className="h-3.5 w-3.5 text-accent" />
          {`${t("food.form.times")} · ${t("common.optional")}`}
        </span>
        <div
          role="group"
          aria-label={t("food.form.times")}
          className="flex flex-wrap gap-1.5"
        >
          {timeOptions.map((time) => {
            const on = times.includes(time);
            return (
              <button
                key={time}
                type="button"
                aria-pressed={on}
                onClick={() => toggleTime(time)}
                className={`rounded-full border px-2.5 py-1 text-xs tabular-nums ${
                  on
                    ? "border-accent bg-accent/15 text-fg-bright"
                    : "border-line text-fg hover:bg-surface-2"
                }`}
              >
                {time}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-muted">{t("food.form.timesHint")}</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-fg">
          {t("food.form.per100")}
        </span>
        <span className="text-xs text-muted">{t("food.form.per100Hint")}</span>
      </div>
      <Field
        label={t("food.form.kcal")}
        error={kcalMissing ? t("food.form.kcalMissing") : undefined}
      >
        <TextInput
          type="number"
          inputMode="decimal"
          step="1"
          min="0"
          value={values.kcal}
          invalid={kcalMissing}
          onChange={(v) => {
            set("kcal")(v);
            setKcalMissing(false);
          }}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        {MAIN.map((key) => (
          <Field
            key={key}
            label={`${t(`food.form.${key}` as const)} · ${t("common.optional")}`}
          >
            <TextInput
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={values[key]}
              onChange={set(key)}
            />
          </Field>
        ))}
      </div>
      {showDetail ? (
        <div className="grid grid-cols-3 gap-2">
          {DETAIL.map((key) => (
            <Field key={key} label={t(`food.form.${key}` as const)}>
              <TextInput
                type="number"
                inputMode="decimal"
                step="0.001"
                min="0"
                value={values[key]}
                onChange={set(key)}
              />
            </Field>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className="self-start rounded-md px-2 py-1.5 text-sm text-accent hover:bg-surface-2"
        >
          {t("food.form.more")}
        </button>
      )}

      <div className="flex gap-2">
        <Button type="submit" variant="primary">
          {t("food.form.save")}
        </Button>
        <Button onClick={onCancel}>{t("common.cancel")}</Button>
      </div>
    </form>
  );
}

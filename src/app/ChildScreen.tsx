// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";
import {
  Button,
  SegmentedControl,
} from "@niclaslindstedt/oss-framework/components";

import { unitLabel } from "./format.ts";
import { useLocale, useT } from "./i18n/index.ts";
import type { Child, Sex } from "./types.ts";
import {
  Card,
  DateField,
  Field,
  Heading,
  PairInput,
  TextInput,
} from "./ui.tsx";
import {
  heightDraft,
  keepIfUnchanged,
  parseHeight,
  unitSystemFor,
  type Draft,
} from "./units.ts";

// The child: the first screen of an empty install, and the profile editor
// behind Settings. Four facts and two optional ones — a birth date and a sex
// are what every derivation reads; a name is what the copy uses; the parents'
// heights are what the expected adult height needs.
//
// Centred in the leftover height like the sibling apps' first-run forms: a
// short form on a tall phone reads better in the middle of it than stranded
// at the top.

type Props = {
  initial: Child | null;
  /** The latest day a birth date may be — a child born tomorrow is a
   *  planning document, and every derivation reads it as "not born yet". */
  today: DayKey;
  onSave: (child: Child) => void;
  onCancel?: () => void;
};

export function ChildScreen({ initial, today, onSave, onCancel }: Props) {
  const t = useT();
  const locale = useLocale();
  const units = unitSystemFor(locale);
  const [name, setName] = useState(initial?.name ?? "");
  const [birthDate, setBirthDate] = useState<string>(initial?.birthDate ?? "");
  const [sex, setSex] = useState<Sex>(initial?.sex ?? "female");
  // Typed in the locale's units (feet and inches on a US phone), stored in
  // centimetres; an untouched height is saved exactly as stored.
  const [opened] = useState(() => ({
    mother: heightDraft(initial?.motherHeightCm ?? null, units),
    father: heightDraft(initial?.fatherHeightCm ?? null, units),
  }));
  const [mother, setMother] = useState<Draft>(opened.mother);
  const [father, setFather] = useState<Draft>(opened.father);
  const [dateMissing, setDateMissing] = useState(false);

  const save = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      setDateMissing(true);
      return;
    }
    onSave({
      name: name.trim(),
      birthDate: birthDate as DayKey,
      sex,
      motherHeightCm: keepIfUnchanged(
        initial?.motherHeightCm ?? null,
        opened.mother,
        mother,
        parseHeight(mother, units),
      ),
      fatherHeightCm: keepIfUnchanged(
        initial?.fatherHeightCm ?? null,
        opened.father,
        father,
        parseHeight(father, units),
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-1 flex-col justify-center gap-3 px-3 py-3">
      <Card>
        <Heading>
          {initial ? t("child.editTitle") : t("child.setupTitle")}
        </Heading>
        {!initial && (
          <p className="mt-2 text-sm text-muted">{t("child.setupIntro")}</p>
        )}
        <form
          className="mt-3 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Field label={t("child.name")}>
            <TextInput
              value={name}
              onChange={setName}
              placeholder={t("child.namePlaceholder")}
            />
          </Field>
          <Field
            label={t("child.birthDate")}
            error={dateMissing ? t("child.birthDateMissing") : undefined}
          >
            <DateField
              label={t("child.birthDate")}
              value={birthDate}
              invalid={dateMissing}
              max={today}
              onChange={(next) => {
                setBirthDate(next);
                setDateMissing(false);
              }}
            />
          </Field>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fg">
              {t("child.sex")}
            </span>
            <SegmentedControl<Sex>
              value={sex}
              options={[
                { value: "female", label: t("child.female") },
                { value: "male", label: t("child.male") },
              ]}
              onChange={setSex}
              ariaLabel={t("child.sex")}
              fullWidth
            />
            <span className="text-xs text-muted">{t("child.sexHint")}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fg">
              {t("child.parents")}
            </span>
            <span className="text-xs text-muted">{t("child.parentsHint")}</span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(
                [
                  ["child.motherHeight", mother, setMother],
                  ["child.fatherHeight", father, setFather],
                ] as const
              ).map(([key, value, set]) => {
                const label = t(key, { unit: unitLabel("height", locale) });
                return (
                  <Field key={key} label={label}>
                    {units === "us" ? (
                      <PairInput
                        label={label}
                        value={value}
                        units={["ft", "in"]}
                        onChange={set}
                      />
                    ) : (
                      <TextInput
                        type="decimal"
                        value={value.main}
                        onChange={(main) => set({ main, sub: "" })}
                      />
                    )}
                  </Field>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary">
              {t("child.save")}
            </Button>
            {onCancel && (
              <Button onClick={onCancel}>{t("common.cancel")}</Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

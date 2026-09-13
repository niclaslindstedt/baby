// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useState } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";
import {
  Button,
  SegmentedControl,
} from "@niclaslindstedt/oss-framework/components";

import { useT } from "./i18n/index.ts";
import type { Child, Sex } from "./types.ts";
import {
  Card,
  DateField,
  Field,
  Heading,
  TextInput,
  parseNumber,
} from "./ui.tsx";

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
  const [name, setName] = useState(initial?.name ?? "");
  const [birthDate, setBirthDate] = useState<string>(initial?.birthDate ?? "");
  const [sex, setSex] = useState<Sex>(initial?.sex ?? "female");
  const [mother, setMother] = useState(
    initial?.motherHeightCm === null || initial === null
      ? ""
      : String(initial.motherHeightCm),
  );
  const [father, setFather] = useState(
    initial?.fatherHeightCm === null || initial === null
      ? ""
      : String(initial.fatherHeightCm),
  );
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
      motherHeightCm: parseNumber(mother),
      fatherHeightCm: parseNumber(father),
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
              <Field label={t("child.motherHeight")}>
                <TextInput
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="50"
                  value={mother}
                  onChange={setMother}
                />
              </Field>
              <Field label={t("child.fatherHeight")}>
                <TextInput
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="50"
                  value={father}
                  onChange={setFather}
                />
              </Field>
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

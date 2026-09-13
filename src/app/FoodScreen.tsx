// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { useMemo, useState } from "react";

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";
import {
  Button,
  ConfirmDialog,
  PencilIcon,
  PlusIcon,
  SegmentedControl,
} from "@niclaslindstedt/oss-framework/components";

import { childName } from "./copy.ts";
import { FoodForm } from "./FoodForm.tsx";
import { formatAmount, formatWhole } from "./format.ts";
import { ageInDays } from "./age.ts";
import { BowlIcon, ClockIcon, TrashIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import { feedingStage, foodKcal } from "./nutrition.ts";
import {
  sortedFoods,
  type AppData,
  type Food,
  type FormulaType,
  type MilkFeeding,
} from "./types.ts";
import { Card, EmptyState, Field, Heading, parseNumber } from "./ui.tsx";

// Food, the input side: the regimen, and where the milk comes from.
//
// The regimen leads, because it is the thing this screen exists to keep
// current — the foods the child typically gets in a day, with a daily amount
// and (optionally) the times they are given. Milk follows it: one segmented
// control and, for a bottle-fed child, the millilitres.
//
// What the regimen *adds up to* is not here. "Does it cover the day", the
// nutrient lines and the coverage curve are all answers, and answers open
// from Today's Food card (see `FoodModal.tsx`). Before six months there is
// nothing to add up at all, and the screen still says so — that is the
// premise the app rests on, not a detail of where the numbers live.

type Props = {
  data: AppData;
  today: DayKey;
  onSaveFood: (food: Food) => void;
  onRemoveFood: (id: string) => void;
  onSetMilk: (milk: MilkFeeding) => void;
  onNotice: (message: string) => void;
};

export function FoodScreen({
  data,
  today,
  onSaveFood,
  onRemoveFood,
  onSetMilk,
  onNotice,
}: Props) {
  const t = useT();
  const lang = useLang();
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  const name = childName(t, data.child);
  const [editing, setEditing] = useState<Food | null | "new">(null);
  const [confirmDelete, setConfirmDelete] = useState<Food | null>(null);
  const [formulaDraft, setFormulaDraft] = useState(
    data.milk.formulaMlPerDay === null ? "" : String(data.milk.formulaMlPerDay),
  );

  const stage = useMemo(
    () =>
      data.child === null
        ? "complementary"
        : feedingStage(ageInDays(data.child.birthDate, today)),
    [data.child, today],
  );
  const foods = sortedFoods(data);

  if (editing !== null) {
    return (
      <div className="flex flex-1 flex-col gap-3 px-3 py-3">
        <Card>
          <Heading>
            {editing === "new"
              ? t("food.form.addTitle")
              : t("food.form.editTitle")}
          </Heading>
          <div className="mt-3">
            <FoodForm
              initial={editing === "new" ? null : editing}
              onSave={(food) => {
                onSaveFood(food);
                onNotice(t("food.saved"));
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          </div>
        </Card>
      </div>
    );
  }

  const setMilkKind = (kind: MilkFeeding["kind"]) => {
    onSetMilk({
      ...data.milk,
      kind,
      formulaMlPerDay:
        kind === "breast" || kind === "none" ? null : parseNumber(formulaDraft),
      updatedAt: new Date().toISOString(),
    });
    onNotice(t("food.milkSaved"));
  };
  const setFormulaType = (formulaType: FormulaType) => {
    onSetMilk({
      ...data.milk,
      formulaType,
      updatedAt: new Date().toISOString(),
    });
    onNotice(t("food.milkSaved"));
  };
  const commitFormula = () => {
    const ml = parseNumber(formulaDraft);
    if (ml === data.milk.formulaMlPerDay) return;
    onSetMilk({
      ...data.milk,
      formulaMlPerDay: ml,
      updatedAt: new Date().toISOString(),
    });
    onNotice(t("food.milkSaved"));
  };

  return (
    <div className="flex flex-col gap-3 px-3 py-3">
      {stage !== "complementary" && (
        <Card>
          <Heading>{t("food.title")}</Heading>
          <p className="mt-1 text-sm text-fg">
            {stage === "milkOnly"
              ? t("food.milkOnly", { name })
              : t("food.tastes")}
          </p>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between gap-2">
          <Heading>{t("food.regimen")}</Heading>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-accent hover:bg-surface-2"
          >
            <PlusIcon className="h-4 w-4" />
            {t("food.add")}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">
          {t("food.regimenHint", { name })}
        </p>
        {foods.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={<BowlIcon className="h-8 w-8" />}
              text={t("food.empty")}
              action={
                <Button variant="primary" onClick={() => setEditing("new")}>
                  {t("food.add")}
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {foods.map((food) => (
              <li
                key={food.id}
                className="flex items-start justify-between gap-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg-bright">
                    {food.name}
                  </p>
                  <p className="text-xs text-muted tabular-nums">
                    {t("food.amountLine", {
                      amount: formatAmount(food.amount, locale),
                      unit: food.unit,
                      kcal: formatWhole(foodKcal(food), locale),
                    })}
                  </p>
                  {food.times.length > 0 && (
                    <p className="flex items-center gap-1 text-xs text-muted tabular-nums">
                      <ClockIcon className="h-3 w-3" />
                      {food.times.join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(food)}
                    aria-label={t("common.edit")}
                    title={t("common.edit")}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(food)}
                    aria-label={t("common.remove")}
                    title={t("common.remove")}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-danger"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <Heading>{t("food.milk")}</Heading>
        <p className="mt-1 text-xs text-muted">{t("food.milkHint")}</p>
        <div className="mt-2">
          <SegmentedControl<MilkFeeding["kind"]>
            value={data.milk.kind}
            options={[
              { value: "breast", label: t("food.breast") },
              { value: "formula", label: t("food.formula") },
              { value: "mixed", label: t("food.mixed") },
              { value: "none", label: t("food.none") },
            ]}
            onChange={setMilkKind}
            ariaLabel={t("food.milk")}
            fullWidth
          />
        </div>
        {(data.milk.kind === "formula" || data.milk.kind === "mixed") && (
          <div className="mt-3">
            <Field label={t("food.formulaType")}>
              <SegmentedControl<FormulaType>
                value={data.milk.formulaType}
                options={[
                  { value: "infant", label: t("food.formulaInfant") },
                  { value: "followOn", label: t("food.formulaFollowOn") },
                ]}
                onChange={setFormulaType}
                ariaLabel={t("food.formulaType")}
                fullWidth
              />
            </Field>
            <p className="mt-1 mb-3 text-xs text-muted">
              {t("food.formulaTypeHint", { name })}
            </p>
            <Field label={t("food.formulaMl")}>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="10"
                value={formulaDraft}
                onInput={(e) => setFormulaDraft(e.currentTarget.value)}
                onBlur={commitFormula}
                className="w-full min-w-0 rounded-md border border-line bg-surface px-3 py-2 text-sm text-fg-bright outline-none focus:border-accent"
              />
            </Field>
          </div>
        )}
        <p className="mt-3 text-xs text-muted">{t("food.dDrops")}</p>
      </Card>

      <ConfirmDialog
        open={confirmDelete !== null}
        title={t("food.form.deleteConfirm", {
          name: confirmDelete?.name ?? "",
        })}
        confirmLabel={t("common.remove")}
        tone="danger"
        labels={{ cancel: t("common.cancel"), close: t("common.close") }}
        onConfirm={() => {
          if (confirmDelete) onRemoveFood(confirmDelete.id);
          setConfirmDelete(null);
          onNotice(t("food.deleted"));
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

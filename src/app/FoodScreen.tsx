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
import {
  formatAmount,
  formatKg,
  formatPercent,
  formatWhole,
} from "./format.ts";
import type { GrowthStandards } from "./growth.ts";
import { AlertIcon, BowlIcon, TrashIcon } from "./icons.tsx";
import { useLang, useT } from "./i18n/index.ts";
import {
  assess,
  outgrown,
  regimenApplies,
  type NutrientLine,
} from "./nutrition.ts";
import {
  sortedFoods,
  type AppData,
  type Food,
  type FormulaType,
  type MilkFeeding,
} from "./types.ts";
import { Card, EmptyState, Field, Heading, parseNumber } from "./ui.tsx";

// Food: the regimen, and whether it covers the day.
//
// Before six months the screen says so and stays out of the way — that is a
// feature, and the one this app's premise rests on. From six months it is
// two cards: the regimen (the foods the child typically gets in a day), and
// the assessment against the recommendation for the child's age and weight,
// with the energy verdict on top and the rest below it.

type Props = {
  data: AppData;
  today: DayKey;
  standards: GrowthStandards | null;
  onSaveFood: (food: Food) => void;
  onRemoveFood: (id: string) => void;
  onSetMilk: (milk: MilkFeeding) => void;
  onNotice: (message: string) => void;
};

export function FoodScreen({
  data,
  today,
  standards,
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

  const assessment = useMemo(
    () => (standards ? assess(data, today, standards.weight) : null),
    [data, today, standards],
  );
  const grownOut = useMemo(
    () => (standards ? outgrown(data, today, standards.weight) : false),
    [data, today, standards],
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

  const stage = assessment?.requirements.stage ?? "complementary";
  const applies = assessment ? regimenApplies(assessment) : true;

  // Which sentence explains the target depends on where the day's milk comes
  // from. The mixed case is the one worth spelling out: the bottles are
  // counted *inside* the milk share rather than on top of it, so the copy
  // says so rather than leaving a parent to wonder why adding formula also
  // raised the bar.
  const req = assessment?.requirements ?? null;
  const nursing = data.milk.kind === "breast" || data.milk.kind === "mixed";
  const targetText =
    req === null
      ? null
      : nursing && req.formulaKcal > 0
        ? t("food.targetMixed", {
            months: String(Math.floor(req.ageMonths)),
            milkShare: formatPercent(req.milkEnergyShare, locale),
            ml: formatWhole(data.milk.formulaMlPerDay ?? 0, locale),
            formulaKcal: formatWhole(req.formulaKcal, locale),
            target: formatWhole(req.targetKcal, locale),
            total: formatWhole(req.kcalPerDay, locale),
            weight: formatKg(req.weightKg, locale),
          })
        : nursing
          ? t("food.targetBreast", {
              months: String(Math.floor(req.ageMonths)),
              share: formatPercent(req.targetKcal / req.kcalPerDay, locale),
              target: formatWhole(req.targetKcal, locale),
              total: formatWhole(req.kcalPerDay, locale),
              weight: formatKg(req.weightKg, locale),
            })
          : t(
              data.milk.kind === "formula"
                ? "food.targetFormula"
                : "food.targetWholeDay",
              {
                total: formatWhole(req.kcalPerDay, locale),
                weight: formatKg(req.weightKg, locale),
              },
            );

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
      {!applies && (
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

      {applies && (
        <>
          <Card
            tone={
              grownOut
                ? "warn"
                : assessment &&
                    !assessment.empty &&
                    assessment.energy.status === "covered"
                  ? "accent"
                  : "default"
            }
          >
            <Heading>{t("food.assessment")}</Heading>
            {assessment === null || assessment.empty ? (
              <p className="mt-1 text-sm text-fg">{t("food.energyUnknown")}</p>
            ) : (
              <>
                <p className="mt-1 flex gap-2 text-sm text-fg">
                  {grownOut && (
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  )}
                  <span>
                    {grownOut
                      ? t("food.outgrown", { name })
                      : assessment.energy.status === "covered"
                        ? t("food.covered")
                        : t("food.low")}
                  </span>
                </p>
                {assessment.energy.actual !== null && (
                  <p className="mt-1 text-lg font-bold text-fg-bright tabular-nums">
                    {t("food.energyLine", {
                      actual: formatWhole(assessment.energy.actual, locale),
                      target: formatWhole(assessment.energy.target, locale),
                    })}
                  </p>
                )}
              </>
            )}
            {req !== null && (
              <p className="mt-2 text-xs text-muted">
                {targetText}
                {req.weightSource === "reference" && (
                  <> {t("food.weightReference", { name })}</>
                )}
              </p>
            )}
          </Card>

          {assessment && !assessment.empty && (
            <Card>
              <Heading>{t("food.nutrients")}</Heading>
              <p className="mt-1 text-xs text-muted">
                {t("food.nutrientsHint")}
                {nursing && <> {t("food.nutrientsBreastNote")}</>}
              </p>
              <ul className="mt-2 flex flex-col gap-2">
                {assessment.lines.map((line) => (
                  <NutrientRow key={line.key} line={line} locale={locale} />
                ))}
              </ul>
            </Card>
          )}
        </>
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
                      kcal: formatWhole(
                        (food.per100.kcal * food.amount) / 100,
                        locale,
                      ),
                    })}
                  </p>
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

function NutrientRow({ line, locale }: { line: NutrientLine; locale: string }) {
  const t = useT();
  const unit =
    line.key === "ironMg" || line.key === "dhaG"
      ? t("food.unit.mg")
      : line.key === "vitaminDUg"
        ? t("food.unit.ug")
        : t("food.unit.e");
  const isMax = line.key === "saturatedE";
  const tone =
    line.status === "covered"
      ? "text-accent"
      : line.status === "low" || line.status === "high"
        ? "text-danger"
        : "text-muted";
  return (
    <li className="flex items-baseline justify-between gap-2 text-sm">
      <span className="min-w-0 text-fg">
        {t(`food.nutrient.${line.key}` as Parameters<typeof t>[0])}
      </span>
      <span className="shrink-0 text-right">
        <span className="text-xs text-fg tabular-nums">
          {line.actual === null
            ? t("common.noData")
            : isMax
              ? t("food.lineMax", {
                  actual: formatAmount(line.actual, locale),
                  target: formatAmount(line.target, locale),
                  unit,
                })
              : t("food.line", {
                  actual: formatAmount(line.actual, locale),
                  target: formatAmount(line.target, locale),
                  unit,
                })}
        </span>
        <span className={`block text-xs ${tone}`}>
          {t(`food.status.${line.status}` as const)}
        </span>
      </span>
    </li>
  );
}

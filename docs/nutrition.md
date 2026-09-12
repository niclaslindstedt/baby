# Nutrition

How the Food screen decides whether the regimen covers the day. The code is
`src/app/nutrition.ts`; the numbers are pinned in `tests/nutrition_test.ts`.

## A regimen, not a diary

The app never logs a meal. The regimen is the list of foods the child
_typically_ gets in a day, each with a daily amount and its content per
100 g — of which only calories are required. The comparison is against the
recommendation for the child's **current** age and weight. As the child grows
the recommendation moves and the regimen does not, and the moment the two
cross is the moment the app says something:

> Your baby's current food regimen may no longer provide enough energy for
> their estimated needs.

That sentence appears only when the regimen covered the day it was last
edited and does not today — the regimen did not change, the child did. A
regimen that never covered the day just reads as "not quite".

## Before six months

Nothing. Breast milk or formula is everything an infant needs until about
six months (Livsmedelsverket: "vid cirka sex månader"; tiny tastes from four
months are fine, never in competition with the milk), so the Food screen says
so and asks only how the milk is fed. The regimen and the assessment appear
from six months, when complementary foods begin.

## Milk

**Breast milk is not measured**, on purpose — a breastfed baby regulates
intake through feeding frequency and duration, and there is no honest number
to put on it from the outside. For a breastfed child the regimen is held to
the **complementary need**: the share of the day's energy food is expected to
cover at that age. WHO's 2023 complementary-feeding guideline puts breast milk
at 77% of energy at 6–8 months, 63% at 9–11 and 44% at 12–23 months; the app
uses 15% for the third year and nothing after.

**Formula is measurable**, so a formula-fed child's typical daily millilitres
are part of the regimen (standard formula at 66 kcal/100 ml, from
Livsmedelsverket's database, with DHA at the EU-mandated minimum) and the
target is the whole day. "Both" is treated as breastfed with the formula
counting toward the complementary share.

## The targets

| Nutrient      | 6–11 months          | 12–23 months       | From 2 years | Source                                                                                         |
| ------------- | -------------------- | ------------------ | ------------ | ---------------------------------------------------------------------------------------------- |
| Energy        | ≈79–81 kcal/kg/day   | ≈80–82 kcal/kg/day | ≈81 kcal/kg  | NNR2023 (adopting FAO/WHO/UNU 2004), with the FAO table's small sex difference                 |
| Iron          | 10 mg                | 7 mg               | 7 mg         | NNR2023 RI (raised from 8 mg and lowered from 8 mg respectively vs NNR2012)                    |
| Vitamin D     | 10 µg                | 10 µg              | 10 µg        | NNR2023; the Swedish D-drops (5 drops = 10 µg, from ~1 week to 2 years) supply it on their own |
| Total fat     | 30–45 E%             | 30–40 E%           | 25–40 E%     | NNR2023                                                                                        |
| Saturated fat | not set              | < 10 E%            | < 10 E%      | NNR2023 ("from 12 months use the adult recommendation")                                        |
| Omega-6 (LA)  | ≥ 4 E%               | ≥ 3 E%             | ≥ 3 E%       | NNR2023                                                                                        |
| Omega-3       | ≥ 1 E%               | ≥ 0.5 E%           | ≥ 0.5 E%     | NNR2023                                                                                        |
| DHA           | 100 mg (7–24 months) | 100 mg             | —            | EFSA adequate intake; informational — Livsmedelsverket recommends no supplement                |

Energy rests on the child's **latest recorded weight**; without one, the WHO
median weight for age stands in and the screen says so. The fat shares are
read against the regimen's _own_ energy — the fat share of the food you give
— which for a breastfed child leaves the milk out of both sides of the
comparison and matches Livsmedelsverket's practical advice: a teaspoon of
rapeseed oil per home-made portion, at most a tablespoon of extra fat a day,
because children under two need somewhat fattier food than adults.

## What the assessment says, and refuses to say

Each nutrient gets one reading:

- **covered** — the regimen's total reaches at least 90% of the target (the
  recommendation is a population figure and a portion is a guess);
- **below the recommendation** — every food states the value and the sum is
  short;
- **at least this much — some foods don't say** — the sum is short but some
  foods carry no value for it, so the true total is at least that;
- **no food states it** — unknown, never read as zero;
- **above the recommended range** — for total fat past its ceiling and
  saturated fat past 10 E%.

Energy is the headline and is never marked "high": a baby's appetite is a
better regulator than a table. The screen never says "you should"; it names
the recommendation and where the regimen stands against it, and leaves the
decision to the parent and BVC.

## Presets

The food form's **Common foods** chips fill a row with typical values from
Livsmedelsverket's food database (version 2026-06-29): fortified whole-grain
baby porridge and välling, boiled egg, boiled salmon, banana, avocado,
rapeseed oil, and infant formula. They are a typing aid — adjust to the label
if it differs — and a bundled chunk, never a lookup service.

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
are part of the regimen and the target is the whole day.

### Which formula

Infant formula (modersmjölksersättning) and follow-on formula
(tillskottsnäring, sold from six months) are separate products in law, and the
Food screen asks which one is in the bottle:

| Per 100 ml               | Infant formula | Follow-on formula |
| ------------------------ | -------------- | ----------------- |
| Energy                   | 66 kcal        | 69 kcal           |
| **Iron**                 | **0.4 mg**     | **1.0 mg**        |
| Vitamin D                | 1.37 µg        | 1.5 µg            |
| Fat (of which saturated) | 3.5 g (1.1 g)  | 3.4 g (1.2 g)     |
| Omega-6 (LA)             | 0.6 g          | 0.52 g            |
| Omega-3 (ALA + DHA)      | 0.1 g          | 0.071 g           |
| DHA                      | 13.2 mg        | 13.8 mg           |

Iron is the whole reason the second product exists: the fetal iron stores
start to run out at around six months. Commission Delegated Regulation (EU)
2016/127 floors infant formula at 0.3 mg iron per 100 kcal (Annex I) and
follow-on formula at 0.6 mg (Annex II), and on the Swedish shelf the printed
figures are 0.4 and 1.0 mg per 100 ml — roughly two and a half times. Reading
one as the other would misstate the iron line by more than a third of the
day's 10 mg target at 600 ml.

The app does **not** infer the product from the child's age. Livsmedelsverket's
advice is that infant formula may be used for the whole first year, so a
six-month-old on bottles may be on either; crediting a child with iron they
are not getting is not a claim this app makes. Infant formula is the default
and what every document written before this question existed is read as.

The figures above are the typical Swedish declaration (Semper BabySemp 1 and
2, matched within rounding by the other brands), with DHA at the EU minimum of
20 mg per 100 kcal. Labels differ by a tenth or two between brands and pack
formats; a parent who wants their own tin exactly enters it as a food in the
regimen, where the label's numbers go in verbatim. The milk drinks sold from a
year (mjölkdryck) are not formula at all and belong in the regimen the same
way — there is a preset for them.

### Both breast and bottle

The bottles a mixed-fed child drinks are milk they are **not** getting from
the breast, so they come off the WHO milk share rather than landing on top of
it. Only the remainder is treated as unmeasurable:

```
unmeasuredMilkKcal = max(0, dayKcal × milkShare − formulaKcal)
targetKcal         = dayKcal − unmeasuredMilkKcal
```

Give a mixed-fed child more formula and the target rises by exactly what the
bottles add, so the bottles can never buy coverage the food has not earned.
Give them none and the figure is the breastfed one; give them enough to cover
the whole milk share and it is the formula-fed one. All four milk settings are
this one expression with the share set to zero when nobody is nursing.

What breast milk itself contributes is still not counted on the nutrient
lines, because there is no volume to count. For iron that changes little —
breast milk carries almost none, which is why food takes over at six months —
and the Food screen says so where a breastfed or mixed-fed child's nutrients
are listed.

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

## Over the day

The same comparison, drawn with the clock on the x axis. A food may carry the
**times of day it is typically given** (`Food.times`, `HH:MM`, ascending), and
the daily amount is split evenly across them — "porridge, 150 g a day, at
08:00 and 18:00" is two 78 kcal steps, not two 156 kcal meals. That is still
the regimen and not a diary: the times describe a typical day and are edited
when the normal day changes, exactly like the amounts beside them.

`dayCoverage` turns the regimen into one monotone curve of cumulative energy
across a window that runs 06:00–22:00, widened at either end when the regimen
names a time outside it:

- a **timed** food steps the curve at each of its times;
- an **untimed** food is spread evenly across the window, because "sometime
  during the day" is what the regimen actually said and drawing a meal nobody
  claimed would be an invention;
- the **bottles** are spread for the same reason — `MilkFeeding` records
  millilitres a day and never when they are drunk.

The dashed line across the plot is `targetKcal`, and `metAtMinutes` is where
the curve first reaches it, interpolated inside the crossing segment rather
than rounded to the nearest meal. A day that never reaches the line has no
crossing minute, and the gap at the right-hand edge is the answer.

Nothing about the curve is stored — it is recomputed from the foods, the milk
and the day's target on every render, like every other derivation in the app.

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
rapeseed oil, infant formula, follow-on formula and toddler milk drink. They
are a typing aid — adjust to the label
if it differs — and a bundled chunk, never a lookup service.

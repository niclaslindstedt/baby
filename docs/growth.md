# Growth

What the Growth screen draws, how a reading is placed, what the trend and the
forecast mean, and where the expected adult height comes from. The code is
`src/app/growth.ts`; every number below is pinned in `tests/growth_test.ts`.

## Which curves

There is no single worldwide curve. The **WHO Child Growth Standards** (2006,
0–5 years) are _prescriptive_ — how children grow when breastfed and raised in
good conditions, from a study across six countries — while national
references are _descriptive_ of one population and get updated for secular
trends. Swedish child health care (BVC) plots on the Swedish reference
(Wikland et al. 2002, with the Niklasson 2008 birth curve) and has the WHO
standard as the alternative in electronic records; Rikshandboken notes that
the differences during the BVC years are small in practice, and that what
matters is movement across the channels over time.

The Swedish reference's SD tables are not published in any form an app could
bundle. The WHO standards are, so they are what this app draws — the
weight-for-age, length/height-for-age and head-circumference-for-age tables,
by sex and completed month, generated into `src/app/data/whoGrowth.ts` from
the WHO's own files. Length is recumbent length to 24 months and standing
height after, as the WHO publishes it.

The standards stop at five years. To follow a child to **six years**, the
weight and height tables continue from month 61 to month 72 with the **WHO
Growth Reference** (2007, 5–19 years), which the WHO smoothed onto the
standards at the five-year seam; the app keeps the standards' month-60 row
and the reference's rows from 61, so the small remaining step (about 0.1 kg
and 0.3 cm on the medians) is spread over one month of interpolation. The
WHO publishes no head-circumference curve past five years, so that table
ends at month 60 and a later head reading is listed but not placed — the
Growth screen says so under the chart.

## Placing a reading

The standards publish, per sex and month, the Box-Cox power **L**, the median
**M** and the coefficient of variation **S**. A measurement _x_ at that age
has the z-score

```
z = ((x / M)^L − 1) / (L · S)
```

and a z-score turns back into a measurement with `x = M · (1 + L·S·z)^(1/L)`.
Between the published months the three parameters are interpolated linearly.
The chart draws the median and the ±1 and ±2 SD curves as the channels BVC
uses, and every reading as a disc; the readout names its z-score ("−0.2 SD")
and the readings list names the channel ("within ±1 SD of the median").

Readings can be added as often as you like. A daily home weighing is fine —
the forecast's recency weighting means a run of daily readings sharpens the
estimate without letting one wet nappy's worth of grams swing it.

## The trend

The trend card compares the latest reading with the last one at least two
months earlier (or the earliest there is). A move of two thirds of an SD —
one channel on the chart — is called "moving up" or "moving down across the
channels"; less is "following the channel". Crossing a channel is worth
mentioning at the next visit; it is not a diagnosis, and the copy says so.

## The forecast

The projection is **channel-following with damped drift**:

1. Every reading becomes a z-score, so the projection is a claim about the
   one thing that stays roughly put — the child's channel — rather than about
   kilograms, which decelerate sharply over the first year.
2. A recency-weighted line is fitted through the z-scores (half-life 90
   days), and its slope is shrunk toward zero when there are few readings.
3. The slope is carried forward with a decay (time constant 90 days), so a
   child crossing channels is projected to settle into a new one rather than
   to keep crossing forever — which is what catch-up and catch-down growth
   in infancy actually do.
4. The spread combines the readings' own scatter around the line (floored at
   0.1 SD, so two agreeing readings cannot claim certainty) with a drift term
   of 0.25 SD per square-root-month, so the bands widen with the horizon.
5. The 50 / 80 / 95% bands are quantiles of that spread, converted back
   through the LMS parameters at each future age — a band at nine months is
   as wide as nine-month-olds' weights actually vary.

The horizon is four months. The chart draws the bands as three nested shades
of the accent behind a dashed centre line, and the card quotes the 80% range
at the horizon. A reading outside the band is a reason to look, not a
verdict.

## The expected adult height

With both parents' heights, the app shows the mid-parental target height
using the regression Swedish child health care uses (Luo, Albertsson-Wikland
& Karlberg 1998, reproduced in Rikshandboken barnhälsovård):

```
boys:  45.99 + 0.78 · x
girls: 37.85 + 0.75 · x        x = (mother + father) / 2
```

It is a shrinkage regression — tall parents have children a little less tall
than themselves — with a 95% prediction interval of about ±10 cm, which is
the range the card quotes. The older textbook rule, the parents' mean ±6.5
cm, is close; BVC's nomogram is drawn from this one. For the record, the
difference between Swedish men's and women's average adult height is about
13–14 cm (SCB and the Gothenburg cohorts), not the 8 cm sometimes quoted.

BVC reads a child's length against this target: a length outside ±1.5 SD of
the target height is its referral criterion. The app shows the target beside
the length chart and leaves that comparison to the visit.

## The projected adult height

The target above knows nothing about the child. The Length view also shows
a **projection from the child's own growth**: a two-year-old on the +1 SD
length curve is more likely than not to end up a tall adult, and the card
says by how much.

How much of the channel to believe depends on the age. Length in infancy
still carries birth size and is only loosely tied to adult height; by two to
three years the correlation between height SDS and adult height SDS is
around 0.7 and it climbs toward 0.8 through the preschool years (the
Swedish and Finnish longitudinal growth studies and Tanner's tables all land
in that region — the app's table is approximate, and says so). So:

```
z_adult = r(age) · z_length + (1 − r(age)) · z_target
```

where `z_target` is the mid-parental target on the Swedish adult
distribution (men 180.4 ± 6.6 cm, women 167.7 ± 6.0 cm at 18 years, Wikland
2002), or the population mean when the parents' heights are unknown. The
80% range is the unexplained variance at that age — wide for an infant,
narrower for a preschooler, and a little narrower again when the parents'
heights anchor where the regression goes. It is a fun estimate with honest
bars, not a prognosis, and the card says that too.

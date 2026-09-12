// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Growth: where a reading sits on the standard curve, which way the child is
// moving across it, where the next readings are likely to land, and how tall
// the parents say the child will be.
//
// Everything here is expressed in **z-scores** (standard deviations from the
// median of the WHO Child Growth Standards for the child's sex and exact age)
// and only converted back to kilograms and centimetres at the edge. That is
// the same language Swedish child health care plots in — the BVC curves are
// drawn as SD channels, and what matters clinically is not a single reading
// but movement across channels over time. It is also what makes forecasting
// tractable: growth decelerates sharply over the first year, so a straight
// line through kilograms is wrong within weeks, but a child's *channel* is
// roughly stable, and a line through z-scores is a claim about the one thing
// that does stay put.
//
// ## The reading
//
// The standards publish, per sex and completed month, the Box-Cox power `L`,
// the median `M` and the coefficient of variation `S`. A measurement `x` at
// that age has `z = ((x/M)^L − 1) / (L·S)`, and a z-score turns back into a
// measurement with `x = M·(1 + L·S·z)^(1/L)`. Between the published months
// the three parameters are interpolated linearly — the WHO's own daily tables
// are within rounding of that.
//
// ## The forecast
//
// The model is *channel-following with damped drift*. Every reading becomes
// a z-score; a recency-weighted line is fitted through them (a half-life of
// three months, so last spring's readings fade); its slope is shrunk toward
// zero when there are few points; and the projection carries the slope
// forward with a decay so the drift fades over about a season rather than
// running off the chart. That last part encodes what is known about infant
// growth: children do cross channels — catch-up and catch-down growth are
// commonest in the first year — but a child crossing channels tends to settle
// into a new one, not keep crossing forever.
//
// The uncertainty is honest about three things at once: the scatter of the
// readings around their own line (a home scale, a wriggling baby), a floor on
// that scatter so two agreeing readings cannot claim certainty, and a drift
// term that grows with the horizon because a channel is a tendency, not a
// rail. The credible bands the chart draws are quantiles of that spread,
// converted through the LMS parameters at each future age — so a 95% band
// at nine months is as wide as a nine-month-old's weights actually vary, and
// wider than the same band at seven.
//
// What the forecast is not is a diagnosis. It says where the next reading is
// likely to land if nothing changes; a reading outside the band is a reason
// to look, not a verdict.
//
// ## The target height
//
// The mid-parental target height uses the regression Swedish child health
// care uses (Luo, Albertsson-Wikland & Karlberg 1998, as reproduced in
// Rikshandboken barnhälsovård): boys 45.99 + 0.78·x, girls 37.85 + 0.75·x,
// where x is the mean of the parents' heights. It is a shrinkage regression
// — tall parents have children a little less tall than themselves — with a
// 95% prediction interval of about ±10 cm. (The older textbook rule, the
// parents' mean ± 6.5 cm, is what most people know; it is close, and this
// one is the one BVC's nomogram is drawn from.)
//
// Pure and clock-free. The standards are a parameter rather than an import:
// they are a few hundred rows nobody needs before the Growth screen is open,
// so they ride in their own chunk and the screen hands them in.

import type { DayKey } from "@niclaslindstedt/oss-framework/calendar";

import { ageInDays, DAYS_PER_MONTH } from "./age.ts";
import type { LmsRow, WhoTable } from "./data/whoGrowth.ts";
import {
  sortedMeasurements,
  type AppData,
  type Child,
  type Measurement,
  type Sex,
} from "./types.ts";

/** The three measurements the app records, in the order the screen offers
 *  them. */
export type Indicator = "weight" | "length" | "head";

export const INDICATORS: Indicator[] = ["weight", "length", "head"];

/** The three WHO tables, as the Growth screen loads them. */
export type GrowthStandards = Record<Indicator, WhoTable>;

/** The last age any of the tables covers, in days (72 months — six years,
 *  where the weight and height curves end). Head circumference ends at 60
 *  months; ask `lastStandardDays` for a particular table. */
export const MAX_STANDARD_DAYS = 72 * DAYS_PER_MONTH;

/** The last age a table covers, in days: its rows run one a month from
 *  birth, so the last row's month is the range. */
export function lastStandardDays(table: WhoTable): number {
  const rows = table.female;
  return (rows[rows.length - 1]?.[0] ?? 0) * DAYS_PER_MONTH;
}

/** The LMS parameters at an exact age, interpolated between the published
 *  months. Null outside the table's range — before birth, or past its last
 *  month. */
export function lmsAt(
  table: WhoTable,
  sex: Sex,
  ageDays: number,
): { L: number; M: number; S: number } | null {
  if (
    !Number.isFinite(ageDays) ||
    ageDays < 0 ||
    ageDays > lastStandardDays(table)
  ) {
    return null;
  }
  const rows = table[sex];
  const months = ageDays / DAYS_PER_MONTH;
  const lo = Math.min(rows.length - 1, Math.floor(months));
  const hi = Math.min(rows.length - 1, lo + 1);
  const a = rows[lo] as LmsRow;
  const b = rows[hi] as LmsRow;
  const t = hi === lo ? 0 : months - lo;
  return {
    L: a[1] + (b[1] - a[1]) * t,
    M: a[2] + (b[2] - a[2]) * t,
    S: a[3] + (b[3] - a[3]) * t,
  };
}

/** The z-score of a measurement against LMS parameters. */
export function zScore(
  lms: { L: number; M: number; S: number },
  value: number,
): number {
  if (Math.abs(lms.L) < 1e-9) return Math.log(value / lms.M) / lms.S;
  return (Math.pow(value / lms.M, lms.L) - 1) / (lms.L * lms.S);
}

/** The measurement a z-score corresponds to — the inverse of `zScore`. */
export function valueAtZ(
  lms: { L: number; M: number; S: number },
  z: number,
): number {
  if (Math.abs(lms.L) < 1e-9) return lms.M * Math.exp(lms.S * z);
  return lms.M * Math.pow(1 + lms.L * lms.S * z, 1 / lms.L);
}

/** The standard normal CDF, for turning a z-score into a percentile. */
export function normalCdf(z: number): number {
  // Abramowitz & Stegun 7.1.26 — accurate to about 1e-7, which is far finer
  // than any percentile anyone reads off a growth chart.
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

/** The value of one indicator on a measurement, or null when it wasn't
 *  recorded. */
export function measurementValue(
  m: Measurement,
  indicator: Indicator,
): number | null {
  if (indicator === "weight") return m.weightKg;
  if (indicator === "length") return m.lengthCm;
  return m.headCm;
}

/** One reading placed on the standard. */
export type Reading = {
  id: string;
  date: DayKey;
  ageDays: number;
  value: number;
  /** Null when the curve doesn't cover that age (before birth, or past six
   *  years for weight and length, five for head circumference). */
  z: number | null;
};

/** Every recorded value of one indicator, oldest first, each with its
 *  z-score against the child's standard. */
export function readings(
  data: AppData,
  standards: GrowthStandards,
  indicator: Indicator,
): Reading[] {
  const child = data.child;
  if (!child) return [];
  const out: Reading[] = [];
  for (const m of sortedMeasurements(data)) {
    const value = measurementValue(m, indicator);
    if (value === null) continue;
    const ageDays = ageInDays(child.birthDate, m.date);
    const lms = lmsAt(standards[indicator], child.sex, ageDays);
    out.push({
      id: m.id,
      date: m.date,
      ageDays,
      value,
      z: lms ? zScore(lms, value) : null,
    });
  }
  return out;
}

/** A point on a curve: age in days, and the value there. */
export type CurvePoint = { ageDays: number; value: number };

/** The curve of a fixed z-score across an age span, for drawing the SD
 *  channels behind the readings. */
export function curveAtZ(
  table: WhoTable,
  sex: Sex,
  z: number,
  fromDays: number,
  toDays: number,
  stepDays = 7,
): CurvePoint[] {
  const out: CurvePoint[] = [];
  const start = Math.max(0, fromDays);
  const end = Math.min(lastStandardDays(table), toDays);
  for (let age = start; age <= end; age += stepDays) {
    const lms = lmsAt(table, sex, age);
    if (lms) out.push({ ageDays: age, value: valueAtZ(lms, z) });
  }
  const lms = lmsAt(table, sex, end);
  if (lms && (out.length === 0 || out[out.length - 1]!.ageDays < end)) {
    out.push({ ageDays: end, value: valueAtZ(lms, z) });
  }
  return out;
}

/** Which way the child is moving across the channels. */
export type Trend = {
  /** The latest reading's z-score. */
  latest: number;
  /** The reading it is compared against — the last one at least
   *  `TREND_SPAN_DAYS` earlier, or the earliest there is. Null with only one
   *  reading. */
  reference: number | null;
  /** `latest − reference`, in SD. Null without a reference. */
  delta: number | null;
  verdict: "steady" | "up" | "down" | "single";
};

/** How far apart two readings should be before their difference is read as
 *  a trend rather than as noise. Two months: shorter than a channel takes to
 *  cross, longer than a scale's bad morning. */
export const TREND_SPAN_DAYS = 60;

/** How much of a channel a child has to move before the screen calls it a
 *  trend. Two-thirds of an SD is one channel on the chart. */
export const TREND_THRESHOLD_Z = 0.67;

/** Read the trend off a series of placed readings. */
export function trend(series: Reading[]): Trend | null {
  const placed = series.filter(
    (r): r is Reading & { z: number } => r.z !== null,
  );
  const last = placed[placed.length - 1];
  if (!last) return null;
  let reference: (Reading & { z: number }) | null = null;
  for (let i = placed.length - 2; i >= 0; i--) {
    reference = placed[i]!;
    if (last.ageDays - reference.ageDays >= TREND_SPAN_DAYS) break;
  }
  if (!reference) {
    return { latest: last.z, reference: null, delta: null, verdict: "single" };
  }
  const delta = last.z - reference.z;
  return {
    latest: last.z,
    reference: reference.z,
    delta,
    verdict:
      delta >= TREND_THRESHOLD_Z
        ? "up"
        : delta <= -TREND_THRESHOLD_Z
          ? "down"
          : "steady",
  };
}

/** Tunables for the forecast. Every default is a considered choice — see the
 *  comment on each. */
export type ForecastOptions = {
  /** Half-life of the recency weighting, in days. Ninety: a season, long
   *  enough to average out a noisy fortnight, short enough that a real
   *  change of channel shows within a couple of months. */
  halfLifeDays: number;
  /** How many effective readings the slope needs before it is trusted in
   *  full; below it the slope is shrunk toward zero in proportion. Three,
   *  so two readings a week apart cannot launch a projection. */
  slopeShrinkage: number;
  /** Time constant, in days, of the drift's decay. Ninety: a child crossing
   *  channels mostly settles within a season. The total drift the projection
   *  ever carries is `slope × driftDecayDays`. */
  driftDecayDays: number;
  /** Floor on the reading scatter, in SD. A tenth of an SD is roughly what a
   *  careful measurement is good to; two agreeing readings cannot claim
   *  better. */
  minScatterZ: number;
  /** Uncertainty the channel itself gains per month ahead, in SD. A quarter
   *  of an SD a month is the order of channel movement seen in the first two
   *  years, so a three-month projection is about half an SD wide from this
   *  term alone. */
  driftSdPerMonth: number;
  /** How far ahead to project, in days. */
  horizonDays: number;
  /** Days between projected points. */
  stepDays: number;
};

export const DEFAULT_FORECAST_OPTIONS: ForecastOptions = {
  halfLifeDays: 90,
  slopeShrinkage: 3,
  driftDecayDays: 90,
  minScatterZ: 0.1,
  driftSdPerMonth: 0.25,
  horizonDays: 120,
  stepDays: 7,
};

/** The credible-interval widths the chart draws, widest first. */
export const FORECAST_MASSES = [0.95, 0.8, 0.5] as const;

/** One projected point: the expected value and the band edges around it. */
export type ForecastPoint = {
  ageDays: number;
  z: number;
  value: number;
  /** Lower and upper edge per mass, in the same order as `FORECAST_MASSES`. */
  bands: { mass: number; lower: number; upper: number }[];
};

export type Forecast = {
  /** The reading the projection starts from. */
  from: Reading & { z: number };
  /** The fitted channel at that reading, in SD. */
  zNow: number;
  /** The fitted (and shrunk) channel drift, in SD per month. */
  driftPerMonth: number;
  /** How many readings' worth of weight the fit rested on. */
  effectiveReadings: number;
  points: ForecastPoint[];
};

/** Two-sided standard normal quantile for a central mass — the multiplier
 *  that turns an SD into a band half-width. */
function zForMass(mass: number): number {
  // Only the three masses the chart draws are ever asked for; the values are
  // the familiar ones and need no inverse-CDF machinery.
  if (mass >= 0.95) return 1.96;
  if (mass >= 0.8) return 1.2816;
  return 0.6745;
}

/**
 * Project the child's channel forward from the latest reading.
 *
 * Null when there is no placed reading to project from, or the latest one
 * is past the standards' range.
 */
export function forecast(
  series: Reading[],
  table: WhoTable,
  sex: Sex,
  options: ForecastOptions = DEFAULT_FORECAST_OPTIONS,
): Forecast | null {
  const placed = series.filter(
    (r): r is Reading & { z: number } => r.z !== null,
  );
  const last = placed[placed.length - 1];
  if (!last) return null;

  // Recency-weighted least squares of z on age, anchored at the last reading
  // so the intercept *is* the channel now.
  const weights = placed.map((r) =>
    Math.pow(0.5, (last.ageDays - r.ageDays) / options.halfLifeDays),
  );
  const wSum = weights.reduce((a, b) => a + b, 0);
  const tMean =
    placed.reduce((a, r, i) => a + weights[i]! * r.ageDays, 0) / wSum;
  const zMean = placed.reduce((a, r, i) => a + weights[i]! * r.z, 0) / wSum;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < placed.length; i++) {
    const dt = placed[i]!.ageDays - tMean;
    sxx += weights[i]! * dt * dt;
    sxy += weights[i]! * dt * (placed[i]!.z - zMean);
  }
  const rawSlope = sxx > 0 ? sxy / sxx : 0;
  // Shrink the slope toward zero until enough readings back it.
  const slope =
    rawSlope *
    (wSum / (wSum + options.slopeShrinkage)) *
    (placed.length >= 2 ? 1 : 0);
  const zNow = zMean + slope * (last.ageDays - tMean);

  // Residual scatter around the fitted line, floored.
  let ss = 0;
  for (let i = 0; i < placed.length; i++) {
    const fit = zMean + slope * (placed[i]!.ageDays - tMean);
    const res = placed[i]!.z - fit;
    ss += weights[i]! * res * res;
  }
  const dof = Math.max(1, wSum - (placed.length >= 2 ? 2 : 1));
  const scatter = Math.max(options.minScatterZ, Math.sqrt(ss / dof));

  const points: ForecastPoint[] = [];
  for (let h = 0; h <= options.horizonDays; h += options.stepDays) {
    const age = last.ageDays + h;
    const lms = lmsAt(table, sex, age);
    if (!lms) break;
    // Damped drift: the slope decays with time constant `driftDecayDays`,
    // so the projected channel approaches `zNow + slope × decay` rather
    // than running off linearly.
    const drift =
      slope *
      options.driftDecayDays *
      (1 - Math.exp(-h / options.driftDecayDays));
    const z = zNow + drift;
    const sd = Math.sqrt(
      scatter * scatter +
        Math.pow(options.driftSdPerMonth * Math.sqrt(h / DAYS_PER_MONTH), 2),
    );
    points.push({
      ageDays: age,
      z,
      value: valueAtZ(lms, z),
      bands: FORECAST_MASSES.map((mass) => ({
        mass,
        lower: valueAtZ(lms, z - zForMass(mass) * sd),
        upper: valueAtZ(lms, z + zForMass(mass) * sd),
      })),
    });
  }

  return {
    from: last,
    zNow,
    driftPerMonth: slope * DAYS_PER_MONTH,
    effectiveReadings: wSum,
    points,
  };
}

/** The mid-parental target height. */
export type TargetHeight = {
  cm: number;
  /** The 95% prediction interval, ±10 cm. */
  low: number;
  high: number;
};

/** How wide the target's 95% interval is, either side. */
export const TARGET_HEIGHT_INTERVAL_CM = 10;

/** The mid-parental target height for the child, or null while either
 *  parent's height is unknown. */
export function targetHeight(child: Child): TargetHeight | null {
  if (child.motherHeightCm === null || child.fatherHeightCm === null) {
    return null;
  }
  if (child.motherHeightCm <= 0 || child.fatherHeightCm <= 0) return null;
  const x = (child.motherHeightCm + child.fatherHeightCm) / 2;
  const cm = child.sex === "male" ? 45.99 + 0.78 * x : 37.85 + 0.75 * x;
  return {
    cm,
    low: cm - TARGET_HEIGHT_INTERVAL_CM,
    high: cm + TARGET_HEIGHT_INTERVAL_CM,
  };
}

// ── Projected adult height ─────────────────────────────────────────────────
//
// The mid-parental target above is what BVC computes, and it knows nothing
// about the child. This is the other estimate — the one a parent actually
// wants — and it reads the child's own channel: a two-year-old on the +1 SD
// length curve is more likely than not to end up a tall adult.
//
// How much more likely depends on the age. Length in infancy still carries
// birth size and is only loosely tied to adult height; by two to three
// years the correlation between height SDS and adult height SDS is around
// 0.7, and it climbs toward 0.8 through the preschool years (the Swedish and
// Finnish longitudinal growth studies, and Tanner's classic tables, all land
// in that region). So the child's channel is *shrunk* toward the population
// mean by that correlation — the further from adulthood, the more the
// estimate regresses to the mean — and the remainder is taken from the
// mid-parental target when the parents' heights are known, since that is the
// best guess about where the child will regress *to*.
//
// The interval is wide, and it is quoted as such: the unexplained variance
// of adult height given a reading at this age, on the Swedish adult SD.
// This is a fun estimate with honest bars, not a prognosis.

/** The adult reference: mean and SD of adult height in Sweden, per sex
 *  (Wikland et al. 2002 at 18 years: men 180.4 cm, women 167.7 cm; the SDs
 *  are the usual 6.6 and 6.0). */
const ADULT_HEIGHT: Record<Sex, { mean: number; sd: number }> = {
  male: { mean: 180.4, sd: 6.6 },
  female: { mean: 167.7, sd: 6.0 },
};

/** Approximate correlation between length/height SDS at an age and adult
 *  height SDS, by age in months. Piecewise-linear between the anchors. */
const HEIGHT_SDS_CORRELATION: readonly [number, number][] = [
  [0, 0.25],
  [6, 0.45],
  [12, 0.55],
  [18, 0.62],
  [24, 0.7],
  [36, 0.75],
  [60, 0.8],
];

/** The correlation at an age, interpolated. */
export function heightCorrelationAt(ageMonths: number): number {
  const table = HEIGHT_SDS_CORRELATION;
  if (ageMonths <= table[0]![0]) return table[0]![1];
  for (let i = 1; i < table.length; i++) {
    const [m1, r1] = table[i]!;
    if (ageMonths <= m1) {
      const [m0, r0] = table[i - 1]!;
      return r0 + ((r1 - r0) * (ageMonths - m0)) / (m1 - m0);
    }
  }
  return table[table.length - 1]![1];
}

export type AdultHeightProjection = {
  cm: number;
  /** The 80% range. */
  low: number;
  high: number;
  /** The length channel the estimate rests on, in SD. */
  fromZ: number;
  /** The correlation used — how much of the channel was kept. */
  correlation: number;
  /** Whether the parents' heights took part. */
  withParents: boolean;
};

/**
 * Project the child's adult height from their own length channel, blended
 * with the mid-parental target when the parents' heights are known.
 *
 * `zNow` is the child's current length channel — the forecast's fitted
 * channel when there is one, else the latest placed reading. Null when
 * there is no length reading to project from.
 */
export function adultHeightProjection(
  child: Child,
  zNow: number | null,
  ageMonths: number,
): AdultHeightProjection | null {
  if (zNow === null || !Number.isFinite(zNow)) return null;
  const adult = ADULT_HEIGHT[child.sex];
  const r = heightCorrelationAt(ageMonths);
  const target = targetHeight(child);
  const zTarget = target ? (target.cm - adult.mean) / adult.sd : 0;
  // The child's channel, shrunk by the correlation; the rest regresses
  // toward the mid-parental target (or the population mean without one).
  const zAdult = r * zNow + (1 - r) * zTarget;
  // Unexplained variance given the reading — narrower again when the
  // parents' heights anchor where the regression goes.
  const sd = adult.sd * Math.sqrt(1 - r * r) * (target ? 0.85 : 1);
  const cm = adult.mean + zAdult * adult.sd;
  return {
    cm,
    low: cm - 1.2816 * sd,
    high: cm + 1.2816 * sd,
    fromZ: zNow,
    correlation: r,
    withParents: target !== null,
  };
}

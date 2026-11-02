import { DEFAULT_EFFECT_FRACTION, DETECT_PROB, POWER } from "./constants";
import { fitEffect, type DayRow, verdictFromFit } from "./model";
import { normal, type Rng, mulberry32 } from "./random";

export type PowerInput = {
  /** Observation noise on a daily raw score. */
  sigma: number;
  /** Effect in raw points while the product is used. */
  delta: number;
  mdc: number;
  maxDay?: number;
  trials?: number;
  seed?: number;
  /** Extra covariate columns with no true effect, matching the live model. */
  confounders?: number;
  detectProb?: number;
  power?: number;
};

export type PowerResult = {
  earliestDay: number | null;
  searchedTo: number;
  trials: number;
  power: number;
  delta: number;
  sigma: number;
  mdc: number;
};

function simulateRows(
  n: number,
  delta: number,
  sigma: number,
  rng: Rng,
  confounders: number,
  design: "before_after" | "split",
): DayRow[] {
  const rows: DayRow[] = [];
  const baselineDays = design === "split" ? 0 : Math.max(2, Math.round(n * 0.25));
  const total = design === "split" ? n : baselineDays + n;
  for (let i = 0; i < total; i++) {
    const on = design === "split" ? 1 : i >= baselineDays ? 1 : 0;
    const sleep = normal(rng);
    const rmssd = normal(rng);
    const touches = normal(rng);
    const humidity = normal(rng);
    const cycle = confounders > 4 ? normal(rng) : null;
    const noise = normal(rng) * sigma;
    const y = (design === "split" ? delta : on * delta) + noise;
    rows.push({
      y,
      product: on,
      sleepDebt: confounders > 0 ? sleep : null,
      rmssdZ: confounders > 1 ? rmssd : null,
      faceTouches: confounders > 2 ? touches : null,
      humidity: confounders > 3 ? humidity : null,
      cycle,
    });
  }
  return rows;
}

function hitRate(input: PowerInput, n: number, design: "before_after" | "split"): number {
  const rng = mulberry32((input.seed ?? 1729) + n * 17 + (design === "split" ? 3 : 0));
  const trials = input.trials ?? 1000;
  let hits = 0;
  for (let t = 0; t < trials; t++) {
    const rows = simulateRows(n, input.delta, input.sigma, rng, input.confounders ?? 4, design);
    const fit = fitEffect(rows, input.sigma, {
      target: design === "split" ? "mean" : "product",
    });
    const verdict = verdictFromFit(fit, input.mdc, input.detectProb ?? DETECT_PROB);
    if (verdict.kind === "working") hits++;
  }
  return hits / trials;
}

/** Smallest on-product n where at least `power` of trials call Working. */
export function earliestHonestDay(input: PowerInput, design: "before_after" | "split" = "before_after"): PowerResult {
  const maxDay = input.maxDay ?? 45;
  const power = input.power ?? POWER;
  const trials = input.trials ?? 1000;
  let earliest: number | null = null;
  let lo = 4;
  let hi = maxDay;
  if (hitRate(input, maxDay, design) < power) {
    return { earliestDay: null, searchedTo: maxDay, trials, power, delta: input.delta, sigma: input.sigma, mdc: input.mdc };
  }
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (hitRate(input, mid, design) >= power) {
      earliest = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }
  return {
    earliestDay: earliest,
    searchedTo: maxDay,
    trials,
    power,
    delta: input.delta,
    sigma: input.sigma,
    mdc: input.mdc,
  };
}

export function falseWorkingRate(input: Omit<PowerInput, "delta"> & { days: number }): number {
  return hitRate({ ...input, delta: 0 }, input.days, "before_after");
}

export function defaultDelta(baseline: number): number {
  return Math.abs(baseline) * DEFAULT_EFFECT_FRACTION;
}

export type DesignComparison = {
  beforeAfter: PowerResult;
  splitFace: PowerResult;
  note: string;
};

/**
 * Split-face cancels shared nights, so its observation noise is the instrument,
 * not the full daily spread. Before/after carries both.
 */
export function compareDesigns(args: {
  dailySigma: number;
  instrumentSigma: number;
  delta: number;
  mdc: number;
  seed?: number;
  trials?: number;
}): DesignComparison {
  const beforeAfter = earliestHonestDay({
    sigma: args.dailySigma,
    delta: args.delta,
    mdc: args.mdc,
    seed: args.seed,
    trials: args.trials,
    confounders: 4,
  });
  const splitMdc = args.mdc * Math.SQRT2;
  const splitFace = earliestHonestDay(
    {
      sigma: Math.max(args.instrumentSigma, 0.4),
      delta: args.delta,
      mdc: splitMdc,
      seed: (args.seed ?? 1729) + 99,
      trials: args.trials,
      confounders: 0,
    },
    "split",
  );
  return {
    beforeAfter,
    splitFace,
    note: "Split-face uses left-minus-right, so sleep and humidity cancel. Its noise is the instrument noise on the difference. The before/after number carries your day-to-day spread. Neither number is a promise about your face until the scans exist.",
  };
}

export type SimulatedPoint = { day: number; raw: number; on: boolean };

/** One seeded 28-day path. Labeled simulated by every caller. Never written as a scan. */
export function simulateTrialPath(args: {
  baseline: number;
  delta: number;
  sigma: number;
  days?: number;
  baselineDays?: number;
  seed?: number;
}): SimulatedPoint[] {
  const days = args.days ?? 28;
  const baselineDays = args.baselineDays ?? 3;
  const rng = mulberry32(args.seed ?? 1729);
  const points: SimulatedPoint[] = [];
  for (let d = 1; d <= days; d++) {
    const on = d > baselineDays;
    points.push({
      day: d,
      on,
      raw: args.baseline + (on ? args.delta : 0) + normal(rng) * args.sigma,
    });
  }
  return points;
}

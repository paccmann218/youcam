import { mean, std } from "./linalg";

export type NoiseFloor = {
  n: number;
  mean: number;
  sd: number;
  /** Standard error of the mean of the back-to-back scans. */
  sem: number;
  /** Minimum detectable change at 95% for a later single comparison: 1.96 · √2 · SEM. */
  mdc95: number;
};

/**
 * Instrument noise from back-to-back scans of the same face.
 * MDC95 is the smallest change a later photo can claim over this burst.
 */
export function noiseFloor(samples: number[]): NoiseFloor {
  if (samples.length < 2) {
    throw new Error("noise floor needs at least two scans");
  }
  const mu = mean(samples);
  const sd = std(samples);
  const sem = sd / Math.sqrt(samples.length);
  const mdc95 = 1.96 * Math.SQRT2 * sem;
  return { n: samples.length, mean: mu, sd, sem, mdc95 };
}

export type DailySpread = {
  sd: number;
  source: "prior" | "updated";
  days: number;
  priorSd: number;
};

/**
 * Day-to-day spread. Back-to-back scans do not contain it, so it starts
 * at a stated prior and updates as distinct mornings arrive.
 */
export function updateDailySpread(
  dailyMeans: number[],
  priorSd: number,
  priorStrengthDays: number,
): DailySpread {
  const priorVar = priorSd ** 2;
  if (dailyMeans.length < 3) {
    return { sd: priorSd, source: "prior", days: dailyMeans.length, priorSd };
  }
  const mu = mean(dailyMeans);
  const sampleVar =
    dailyMeans.reduce((s, x) => s + (x - mu) ** 2, 0) / (dailyMeans.length - 1);
  const postVar =
    (priorStrengthDays * priorVar + (dailyMeans.length - 1) * sampleVar) /
    (priorStrengthDays + dailyMeans.length - 1);
  return {
    sd: Math.sqrt(Math.max(postVar, 1e-6)),
    source: "updated",
    days: dailyMeans.length,
    priorSd,
  };
}

/** One daily reading: biological spread and instrument SEM, combined. */
export function observationSd(dailySd: number, sem: number): number {
  return Math.sqrt(dailySd ** 2 + sem ** 2);
}

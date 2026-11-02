/** Stated priors. These are assumptions, not measurements, until scans replace them. */

/** Day-to-day raw-score spread before any mornings have been seen. */
export const PRIOR_DAILY_SD = 3.5;

/** How many pseudo-days the daily-spread prior is worth. */
export const PRIOR_STRENGTH_DAYS = 4;

/** Posterior probability required before a verdict is allowed. */
export const DETECT_PROB = 0.95;

/** Share of simulated trials that must clear the bar. */
export const POWER = 0.8;

/** Used when a product states no magnitude. Spec: 10% of baseline. */
export const DEFAULT_EFFECT_FRACTION = 0.1;

export const MIN_NOISE_SCANS = 3;
export const TARGET_NOISE_SCANS = 5;

export { PRIOR_DAILY_SD, PRIOR_STRENGTH_DAYS, DETECT_PROB, POWER, DEFAULT_EFFECT_FRACTION } from "./constants";
export { noiseFloor, updateDailySpread, observationSd } from "./noise";
export type { NoiseFloor, DailySpread } from "./noise";
export { fitEffect, verdictFromFit, attributeDay, concernLabel } from "./model";
export type { DayRow, Fit, Verdict, VerdictKind, Attribution, Contributor } from "./model";
export { earliestHonestDay, falseWorkingRate, compareDesigns, simulateTrialPath, defaultDelta } from "./power";
export type { PowerResult, DesignComparison, SimulatedPoint } from "./power";

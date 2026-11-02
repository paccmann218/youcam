import { DETECT_PROB } from "./constants";
import { dot, identity, invert, matMul, matVec, mean, solve, std, transpose, variance } from "./linalg";
import { studentTCdf, studentTSf } from "./student";

export type CovariateName = "sleepDebt" | "rmssdZ" | "faceTouches" | "humidity" | "cycle";

export type DayRow = {
  y: number;
  /** 0 before the product starts, adherence (0..1) after. */
  product: number;
  sleepDebt?: number | null;
  rmssdZ?: number | null;
  faceTouches?: number | null;
  humidity?: number | null;
  cycle?: number | null;
};

export type VerdictKind = "working" | "too_early" | "no_effect" | "wrong_way" | "unidentified";

export type Coefficient = {
  name: string;
  mean: number;
  scale: number;
  df: number;
};

export type Fit = {
  identified: boolean;
  reason?: string;
  coefficients: Coefficient[];
  sigmaMean: number;
  n: number;
  product?: Coefficient;
};

export type Verdict = {
  kind: VerdictKind;
  probabilityBeyondMdc: number;
  probabilityWorse: number;
  probabilityInside: number;
  mdc: number;
  effectMean: number;
  line: string;
};

const COVARIATES: CovariateName[] = ["sleepDebt", "rmssdZ", "faceTouches", "humidity", "cycle"];

type Column = { name: string; values: number[] };

function usableColumns(rows: DayRow[]): { columns: Column[]; notes: string[] } {
  const notes: string[] = [];
  const columns: Column[] = [{ name: "intercept", values: rows.map(() => 1) }];
  const product = rows.map((r) => r.product);
  if (std(product) < 1e-8) {
    notes.push("product column has no before/after contrast");
  } else {
    columns.push({ name: "product", values: product });
  }
  for (const name of COVARIATES) {
    const raw = rows.map((r) => r[name]);
    const present = raw.filter((v): v is number => v != null && Number.isFinite(v));
    if (present.length < Math.max(3, rows.length * 0.5)) continue;
    const mu = mean(present);
    const filled = raw.map((v) => (v == null || !Number.isFinite(v) ? mu : v));
    const s = std(filled);
    if (s < 1e-8) continue;
    columns.push({ name, values: filled.map((v) => (v - mu) / s) });
  }
  return { columns, notes };
}

/**
 * Conjugate Normal-Inverse-Gamma linear regression.
 * y = X β + ε,  β | σ² ~ N(0, σ² Λ0⁻¹),  σ² ~ InvGamma(a0, b0).
 * Marginal posterior of each coefficient is Student-t.
 */
export function fitEffect(
  rows: DayRow[],
  sigmaPrior: number,
  options?: { productPrecision?: number; target?: "product" | "mean" },
): Fit {
  const target = options?.target ?? "product";
  if (rows.length < 4) {
    return { identified: false, reason: "fewer than 4 days", coefficients: [], sigmaMean: sigmaPrior, n: rows.length };
  }
  const { columns, notes } = usableColumns(rows);
  if (target === "product" && !columns.some((c) => c.name === "product")) {
    return {
      identified: false,
      reason: notes[0] ?? "effect is not identified",
      coefficients: [],
      sigmaMean: sigmaPrior,
      n: rows.length,
    };
  }
  const p = columns.length;
  const n = rows.length;
  const y = rows.map((r) => r.y);
  const x = rows.map((_, i) => columns.map((c) => c.values[i]));
  const xt = transpose(x);
  const xtx = matMul(xt, x);
  const precision = columns.map((c) => {
    if (c.name === "intercept") return 0.02;
    if (c.name === "product") return options?.productPrecision ?? 0.35;
    return 0.5;
  });
  const lambda0 = precision.map((lam, i) =>
    precision.map((_, j) => (i === j ? lam : 0)),
  );
  const lambdaN = xtx.map((row, i) => row.map((v, j) => v + lambda0[i][j] + (i === j ? 1e-8 : 0)));
  let beta: number[];
  let lambdaInv: number[][];
  try {
    beta = solve(lambdaN, matVec(xt, y));
    lambdaInv = invert(lambdaN);
  } catch {
    return { identified: false, reason: "model did not solve", coefficients: [], sigmaMean: sigmaPrior, n };
  }
  const a0 = 4;
  const b0 = (a0 - 1) * sigmaPrior ** 2;
  const yty = dot(y, y);
  const quad = dot(beta, matVec(lambdaN, beta));
  const aN = a0 + n / 2;
  const bN = Math.max(1e-6, b0 + 0.5 * (yty - quad));
  const df = 2 * aN;
  const sigma2Mean = bN / (aN - 1);
  const coefficients: Coefficient[] = columns.map((c, j) => ({
    name: c.name,
    mean: beta[j],
    scale: Math.sqrt(Math.max(1e-12, (bN / aN) * lambdaInv[j][j])),
    df,
  }));
  const effectName = target === "mean" ? "intercept" : "product";
  return {
    identified: true,
    coefficients,
    sigmaMean: Math.sqrt(sigma2Mean),
    n,
    product: coefficients.find((c) => c.name === effectName),
  };
}

export function tailProbability(coef: Coefficient, threshold: number): number {
  return studentTSf((threshold - coef.mean) / coef.scale, coef.df);
}

export function cdfProbability(coef: Coefficient, threshold: number): number {
  return studentTCdf((threshold - coef.mean) / coef.scale, coef.df);
}

export function verdictFromFit(fit: Fit, mdc: number, detectProb = DETECT_PROB): Verdict {
  if (!fit.identified || !fit.product) {
    return {
      kind: "unidentified",
      probabilityBeyondMdc: 0,
      probabilityWorse: 0,
      probabilityInside: 0,
      mdc,
      effectMean: 0,
      line: fit.reason
        ? `Too early. ${fit.reason.charAt(0).toUpperCase()}${fit.reason.slice(1)}.`
        : "Too early. The product effect is not identified yet.",
    };
  }
  const coef = fit.product;
  const pUp = tailProbability(coef, mdc);
  const pDown = cdfProbability(coef, -mdc);
  const pInside = Math.max(0, cdfProbability(coef, mdc) - cdfProbability(coef, -mdc));
  const base = {
    probabilityBeyondMdc: pUp,
    probabilityWorse: pDown,
    probabilityInside: pInside,
    mdc,
    effectMean: coef.mean,
  };
  if (pUp >= detectProb) {
    return {
      ...base,
      kind: "working",
      line: `Working, on your numbers. The product effect is +${coef.mean.toFixed(1)} raw points, past your noise of ${mdc.toFixed(1)}.`,
    };
  }
  if (pDown >= detectProb) {
    return {
      ...base,
      kind: "wrong_way",
      line: `Moving the wrong way. Scores fell past your noise of ${mdc.toFixed(1)}, and the drop lines up with days you used it.`,
    };
  }
  if (pInside >= detectProb) {
    return {
      ...base,
      kind: "no_effect",
      line: `No detectable effect. The change sits inside your noise of ${mdc.toFixed(1)}.`,
    };
  }
  return {
    ...base,
    kind: "too_early",
    line: "Too early to tell.",
  };
}

export type Contributor = {
  name: string;
  /** Signed pull on today's score, in raw points. Positive is healthier. */
  pull: number;
  unusual: number;
};

export type Attribution = {
  ranked: Contributor[];
  serumUnlikely: boolean;
  modelReady: boolean;
  line: string;
};

const LABELS: Record<string, string> = {
  sleepDebt: "sleep",
  rmssdZ: "stress (RMSSD)",
  faceTouches: "face touches",
  humidity: "humidity",
  cycle: "cycle",
  product: "the product",
};

/**
 * On a morning that got worse, rank what else moved.
 * A fitted model is used once the effect is identified. Before that, rank
 * how unusual each signal is. Neither path calls the product the cause of one bad morning.
 */
export function attributeDay(rows: DayRow[], today: DayRow, sigmaPrior: number, mdc: number): Attribution {
  const worse = today.y < (mean(rows.map((r) => r.y)) || today.y) - mdc * 0.25;
  const fit = rows.length >= 6 ? fitEffect(rows, sigmaPrior) : null;
  if (fit?.identified) {
    const ranked: Contributor[] = [];
    for (const coef of fit.coefficients) {
      if (coef.name === "intercept" || coef.name === "product") continue;
      const key = coef.name as CovariateName;
      const history = rows
        .map((r) => r[key])
        .filter((v): v is number => v != null && Number.isFinite(v));
      const value = today[key];
      if (value == null || history.length < 3) continue;
      const mu = mean(history);
      const s = std(history) || 1;
      const z = (value - mu) / s;
      ranked.push({ name: coef.name, pull: coef.mean * z, unusual: Math.abs(z) });
    }
    ranked.sort((a, b) => Math.abs(b.pull) - Math.abs(a.pull));
    const product = fit.product;
    const productPull = product ? product.mean * today.product : 0;
    const confounderPull = ranked.reduce((s, c) => s + c.pull, 0);
    const serumUnlikely =
      worse &&
      ranked.length > 0 &&
      confounderPull < -mdc * 0.5 &&
      Math.abs(confounderPull) > Math.abs(productPull);
    const top = ranked[0];
    const line = !worse
      ? "This morning is inside the range of your other mornings."
      : serumUnlikely && top
        ? `The serum is unlikely to be the cause. ${LABELS[top.name] ?? top.name} accounts for more of this drop than the product.`
        : "Nothing else we measure explains this drop. It is still too early to blame the serum.";
    return { ranked, serumUnlikely, modelReady: true, line };
  }

  const ranked: Contributor[] = [];
  for (const name of COVARIATES) {
    const history = rows
      .map((r) => r[name])
      .filter((v): v is number => v != null && Number.isFinite(v));
    const value = today[name];
    if (value == null || history.length < 2) continue;
    const mu = mean(history);
    const s = std(history) || 1;
    const z = (value - mu) / s;
    ranked.push({ name, pull: -Math.abs(z), unusual: Math.abs(z) });
  }
  ranked.sort((a, b) => b.unusual - a.unusual);
  const top = ranked[0];
  const serumUnlikely = Boolean(worse && top && top.unusual >= 1.5);
  const line = !worse
    ? "This morning is not past your noise."
    : serumUnlikely && top
      ? `The serum is unlikely to be the cause. ${LABELS[top.name] ?? top.name} was unusual today, and there are not enough mornings for an effect estimate yet.`
      : "This is a ranking of how unusual today was. It is not an effect estimate yet, and it is too early to blame the serum.";
  return { ranked, serumUnlikely, modelReady: false, line };
}

export function concernLabel(name: string): string {
  return LABELS[name] ?? name;
}

/** Kept so a future caller can inspect the prior scale. */
export function priorScaleMatrix(p: number): number[][] {
  return identity(p);
}

export function columnVariance(values: number[]): number {
  return variance(values);
}

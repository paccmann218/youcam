/** Lanczos log-gamma and the regularized incomplete beta, for a Student-t CDF. */

const LANCZOS = [
  676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406,
  12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7,
];

export function lgamma(z: number): number {
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  }
  let x = 0.9999999999998099;
  const g = 7;
  for (let i = 0; i < LANCZOS.length; i++) x += LANCZOS[i] / (z - 1 + i + 1);
  const t = z - 1 + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z - 0.5) * Math.log(t) - t + Math.log(x);
}

function betacf(a: number, b: number, x: number): number {
  const FPMIN = 1e-30;
  const MAXIT = 200;
  const EPS = 3e-7;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularized incomplete beta I_x(a, b). */
export function regularizedBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lnBeta = lgamma(a) + lgamma(b) - lgamma(a + b);
  const bt = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lnBeta);
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** CDF of Student-t with `df` degrees of freedom. */
export function studentTCdf(t: number, df: number): number {
  if (!Number.isFinite(t)) return t > 0 ? 1 : 0;
  if (df <= 0) throw new Error("df must be positive");
  const x = df / (df + t * t);
  const a = df / 2;
  const b = 0.5;
  const ib = regularizedBeta(x, a, b);
  if (t >= 0) return 1 - 0.5 * ib;
  return 0.5 * ib;
}

/** Survival function P(T > t). */
export function studentTSf(t: number, df: number): number {
  return 1 - studentTCdf(t, df);
}

/** Small dense linear algebra. n is tiny (days × a handful of covariates). */

export function matVec(a: number[][], v: number[]): number[] {
  return a.map((row) => row.reduce((s, x, i) => s + x * v[i], 0));
}

export function transpose(a: number[][]): number[][] {
  const rows = a.length;
  const cols = a[0]?.length ?? 0;
  const out: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) out[j][i] = a[i][j];
  }
  return out;
}

export function matMul(a: number[][], b: number[][]): number[][] {
  const bt = transpose(b);
  return a.map((row) => bt.map((col) => row.reduce((s, x, i) => s + x * col[i], 0)));
}

export function add(a: number[][], b: number[][]): number[][] {
  return a.map((row, i) => row.map((x, j) => x + b[i][j]));
}

export function identity(n: number): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
}

export function diag(values: number[]): number[][] {
  return identity(values.length).map((row, i) => row.map((x, j) => (i === j ? values[i] : x)));
}

/** Solve A x = b by Gaussian elimination with partial pivoting. A is copied. */
export function solve(matrix: number[][], vector: number[]): number[] {
  const n = vector.length;
  const a = matrix.map((row, i) => [...row, vector[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    }
    if (Math.abs(a[pivot][col]) < 1e-12) {
      throw new Error("singular matrix");
    }
    if (pivot !== col) {
      const tmp = a[col];
      a[col] = a[pivot];
      a[pivot] = tmp;
    }
    const div = a[col][col];
    for (let j = col; j <= n; j++) a[col][j] /= div;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = a[r][col];
      for (let j = col; j <= n; j++) a[r][j] -= factor * a[col][j];
    }
  }
  return a.map((row) => row[n]);
}

export function invert(matrix: number[][]): number[][] {
  const n = matrix.length;
  const cols: number[][] = [];
  for (let j = 0; j < n; j++) {
    const e = Array(n).fill(0);
    e[j] = 1;
    cols.push(solve(matrix, e));
  }
  return transpose(cols);
}

export function dot(a: number[], b: number[]): number {
  return a.reduce((s, x, i) => s + x * b[i], 0);
}

export function mean(xs: number[]): number {
  if (xs.length === 0) return NaN;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

export function variance(xs: number[], mu = mean(xs)): number {
  if (xs.length < 2) return 0;
  return xs.reduce((s, x) => s + (x - mu) ** 2, 0) / (xs.length - 1);
}

export function std(xs: number[]): number {
  return Math.sqrt(variance(xs));
}

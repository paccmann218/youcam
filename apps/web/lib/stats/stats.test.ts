import { describe, expect, it } from "vitest";
import { solve } from "./linalg";
import { regularizedBeta, studentTCdf } from "./student";
import { noiseFloor, updateDailySpread } from "./noise";
import { attributeDay, fitEffect, verdictFromFit, type DayRow } from "./model";
import { compareDesigns, earliestHonestDay, falseWorkingRate } from "./power";
import { mulberry32, normal } from "./random";

describe("student t", () => {
  it("puts half the mass of a symmetric beta at 0.5", () => {
    expect(regularizedBeta(0.5, 2.5, 2.5)).toBeCloseTo(0.5, 3);
  });

  it("matches a normal tail at large df", () => {
    const upper = 1 - studentTCdf(1.96, 5000);
    expect(upper).toBeGreaterThan(0.02);
    expect(upper).toBeLessThan(0.03);
  });
});

describe("linalg", () => {
  it("solves a 2x2 system", () => {
    const x = solve(
      [
        [2, 1],
        [1, 3],
      ],
      [5, 10],
    );
    expect(x[0]).toBeCloseTo(1, 6);
    expect(x[1]).toBeCloseTo(3, 6);
  });
});

describe("noise floor", () => {
  it("uses MDC95 = 1.96 · √2 · SEM", () => {
    const samples = [70, 71, 69, 70.5, 69.5];
    const floor = noiseFloor(samples);
    expect(floor.n).toBe(5);
    expect(floor.mdc95).toBeCloseTo(1.96 * Math.SQRT2 * floor.sem, 8);
    expect(floor.mdc95).toBeGreaterThan(0);
  });

  it("keeps the daily spread at the prior until three mornings exist", () => {
    const early = updateDailySpread([70, 71], 3.5, 4);
    expect(early.source).toBe("prior");
    const later = updateDailySpread([70, 74, 68, 73, 69], 3.5, 4);
    expect(later.source).toBe("updated");
    expect(later.sd).not.toBeCloseTo(3.5, 1);
  });
});

describe("effect model", () => {
  it("calls a large injected effect Working", () => {
    const rows: DayRow[] = [];
    for (let i = 0; i < 8; i++) rows.push({ y: 60 + (i % 3) * 0.1, product: 0 });
    for (let i = 0; i < 16; i++) rows.push({ y: 74 + (i % 3) * 0.1, product: 1 });
    const fit = fitEffect(rows, 2);
    const verdict = verdictFromFit(fit, 2);
    expect(fit.identified).toBe(true);
    expect(verdict.kind).toBe("working");
  });

  it("does not call pure noise Working", () => {
    const rate = falseWorkingRate({
      sigma: 4,
      mdc: 3,
      days: 24,
      trials: 200,
      seed: 7,
      confounders: 4,
    });
    expect(rate).toBeLessThanOrEqual(0.05);
  });

  it("refuses a series with no off-product days", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ y: 70 + i * 0.1, product: 1 }));
    const fit = fitEffect(rows, 3);
    expect(fit.identified).toBe(false);
    expect(verdictFromFit(fit, 2).kind).toBe("unidentified");
  });

  it("does not give a confounder-only drop to the product", () => {
    const rows: DayRow[] = [];
    for (let i = 0; i < 16; i++) {
      const debt = i === 5 || i === 15 ? 3 : 0;
      rows.push({
        y: 72 - 4 * debt,
        product: i >= 4 ? 1 : 0,
        sleepDebt: debt,
        rmssdZ: 0,
        faceTouches: 2,
        humidity: 50,
      });
    }
    const fit = fitEffect(rows, 1.2);
    const verdict = verdictFromFit(fit, 2);
    expect(verdict.kind).not.toBe("working");
    const today = rows[rows.length - 1];
    const attribution = attributeDay(rows.slice(0, -1), today, 1.2, 2);
    expect(attribution.serumUnlikely).toBe(true);
    expect(attribution.ranked[0]?.name).toBe("sleepDebt");
    expect(attribution.line.toLowerCase()).toContain("unlikely");
  });
});

describe("earliest honest day", () => {
  it("moves earlier when noise drops", () => {
    const noisy = earliestHonestDay({
      sigma: 8,
      delta: 8,
      mdc: 2,
      trials: 40,
      seed: 11,
      confounders: 2,
      maxDay: 48,
    });
    const quiet = earliestHonestDay({
      sigma: 2.5,
      delta: 8,
      mdc: 2,
      trials: 40,
      seed: 11,
      confounders: 2,
      maxDay: 48,
    });
    expect(quiet.earliestDay).not.toBeNull();
    if (noisy.earliestDay == null) {
      expect(quiet.earliestDay!).toBeLessThan(48);
    } else {
      expect(quiet.earliestDay!).toBeLessThan(noisy.earliestDay);
    }
  });

  it("reaches a verdict sooner on a split face when nights are noisy", () => {
    const compared = compareDesigns({
      dailySigma: 7,
      instrumentSigma: 1.2,
      delta: 6,
      mdc: 1.5,
      trials: 60,
      seed: 21,
    });
    expect(compared.splitFace.earliestDay).not.toBeNull();
    const splitDay = compared.splitFace.earliestDay!;
    const beforeDay = compared.beforeAfter.earliestDay;
    expect(beforeDay == null || splitDay < beforeDay).toBe(true);
  });
});

describe("rng", () => {
  it("is stable for a seed", () => {
    const a = mulberry32(4);
    const b = mulberry32(4);
    expect(normal(a)).toBeCloseTo(normal(b), 10);
  });
});

import { describe, expect, it } from "vitest";
import { buildView, withinPhase } from "../derive";
import { activeUser } from "../http";
import { earliestHonestDay } from "../stats";
import type { Db, ProofEvent, User } from "../store/db";
import { DEMO_TRIAL, clearDemo, seedDemo } from "./seed";

const NOW = new Date("2026-11-02T15:00:00.000Z");

function user(id: string, createdAt = "2026-11-02T11:30:00.000Z"): User {
  return { id, pairCode: "123456", consentAt: createdAt, place: null, latitude: null, longitude: null, tzOffsetMinutes: 330, createdAt };
}

function emptyDb(...users: User[]): Db {
  return { users, scans: [], scores: [], events: [], trials: [], products: [], nights: [], gestures: [], profiles: [], bags: [], orders: [] };
}

function touches(userId: string, count: number, at = "2026-11-02T12:00:00.000Z"): ProofEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `real-${userId}-${i}`,
    userId,
    createdAt: new Date(Date.parse(at) + i * 30_000).toISOString(),
    type: "face_touch" as const,
    payload: { source: "watch" },
  }));
}

describe("within-phase spread", () => {
  it("does not count a working product's step as wobble", () => {
    const points = [64, 64.5, 63.5, 64, 68, 68.5, 67.5, 68].map((raw, i) => ({ raw, on: i >= 4 }));
    const centred = withinPhase(points);
    expect(Math.max(...centred.map(Math.abs))).toBeLessThan(0.6);
    expect(withinPhase([{ raw: 70, on: false }, { raw: 72, on: true }])).toEqual([70, 72]);
  });
});

describe("demo seed", () => {
  it("fills every view with a consistent story", () => {
    const me = user("u1");
    const db = emptyDb(me);
    const summary = seedDemo(db, me, NOW);
    const view = buildView(db, me, NOW);

    expect(view.demo).toBe(true);
    expect(view.trial?.productName).toBe(DEMO_TRIAL.productName);
    expect(summary.trialDay).toBe(21);
    expect(view.noise.map((item) => item.concern).sort()).toEqual(["acne", "pore", "redness", "texture"]);
    expect(view.noise.every((item) => item.n === 5 && item.mdc95 > 0.4 && item.mdc95 < 1.2)).toBe(true);
    expect(view.daily.pore).toHaveLength(27);
    expect(view.verdict?.kind).toBe("working");
    const power = view.powerInput;
    expect(power).not.toBeNull();
    expect(earliestHonestDay({ sigma: power!.sigma, delta: power!.delta, mdc: power!.mdc, trials: 200, seed: 1729, confounders: 4, maxDay: 56 }).earliestDay).toBeLessThanOrEqual(summary.trialDay);
    expect(view.latest).toHaveLength(4);
    expect(view.latest.find((item) => item.concern === "pore")?.delta).toBeGreaterThan(2);
    expect(view.latest.find((item) => item.concern === "acne")?.delta).toBeLessThan(-1.5);
    expect(view.attribution?.serumUnlikely).toBe(true);
    expect(view.lastNight?.sleepHours).toBe(4.6);
    expect(view.humidity).not.toBeNull();
    expect(view.faceTouchesToday).toBe(14);
    expect(view.checkoffs).toEqual({ morning: true, evening: false });
    expect(view.watchSeenAt).not.toBeNull();
    expect(view.latency.n).toBeGreaterThan(20);
    expect(view.gestures).toEqual({ faceFace: 18, faceOther: 2, otherFace: 1, otherOther: 19 });
    expect(view.lighting).toHaveLength(4);
    for (const item of view.lighting) expect(item.gated.spread ?? 99).toBeLessThan(item.ungated.spread ?? 0);
    expect(db.profiles).toHaveLength(1);
    expect(db.products.map((note) => note.decision)).toEqual(["test", "skip", "test"]);
  });

  it("stays working with real watch data on top", () => {
    const me = user("u1");
    const db = emptyDb(me);
    db.events.push(...touches("u1", 47));
    db.events.push({ id: "real-evening", userId: "u1", createdAt: "2026-11-02T14:50:00.000Z", type: "checkoff", payload: { slot: "evening" } });
    seedDemo(db, me, NOW);
    const view = buildView(db, me, NOW);
    expect(view.verdict?.kind).toBe("working");
    expect(view.attribution?.serumUnlikely).toBe(true);
    expect(view.faceTouchesToday).toBe(61);
  });

  it("works early in the morning, before today's scan would exist", () => {
    const me = user("u1", "2026-10-01T00:00:00.000Z");
    const db = emptyDb(me);
    seedDemo(db, me, new Date("2026-11-02T01:30:00.000Z"));
    const view = buildView(db, me, new Date("2026-11-02T01:30:00.000Z"));
    expect(view.verdict?.kind).toBe("working");
    expect(db.scans.every((scan) => scan.createdAt < "2026-11-02T01:30:00.000Z")).toBe(true);
  });

  it("replaces itself, keeps real rows, and clears cleanly", () => {
    const me = user("u1");
    const db = emptyDb(me);
    db.events.push(...touches("u1", 3));
    db.nights.push({ id: "real-empty", userId: "u1", day: "2026-11-02", sleepHours: null, sleepScore: null, rmssd: null, restingHr: null, humidity: null, cyclePhase: null });
    db.nights.push({ id: "real-night", userId: "u1", day: "2026-11-01", sleepHours: 7.4, sleepScore: 80, rmssd: null, restingHr: null, humidity: null, cyclePhase: null });
    seedDemo(db, me, NOW);
    const first = JSON.stringify({ scans: db.scans.length, events: db.events.length, nights: db.nights.length });
    seedDemo(db, me, NOW);
    expect(JSON.stringify({ scans: db.scans.length, events: db.events.length, nights: db.nights.length })).toBe(first);
    expect(db.nights.filter((night) => night.day === "2026-11-02")).toHaveLength(1);
    expect(db.nights.find((night) => night.day === "2026-11-01")?.id).toBe("real-night");

    clearDemo(db, "u1");
    expect(db.scans).toHaveLength(0);
    expect(db.scores).toHaveLength(0);
    expect(db.trials).toHaveLength(0);
    expect(db.profiles).toHaveLength(0);
    expect(db.events.map((event) => event.id)).toEqual(["real-u1-0", "real-u1-1", "real-u1-2"]);
    expect(db.nights.map((night) => night.id)).toEqual(["real-night"]);
    expect(buildView(db, me, NOW).demo).toBe(false);
  });

  it("never moves the watch to another account", () => {
    const laptop = user("laptop", "2026-11-02T11:30:00.000Z");
    const phone = user("phone", "2026-11-02T14:20:00.000Z");
    const db = emptyDb(laptop, phone);
    db.events.push(...touches("phone", 1, "2026-11-02T14:40:00.000Z"));
    expect(activeUser(db)?.id).toBe("phone");
    seedDemo(db, laptop, NOW);
    expect(activeUser(db)?.id).toBe("phone");
  });
});

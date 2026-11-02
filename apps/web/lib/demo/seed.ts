import { randomUUID } from "crypto";
import { noiseFloor } from "../stats/noise";
import { mulberry32, normal, type Rng } from "../stats/random";
import {
  DEMO_PREFIX,
  isDemoId,
  type ColorProfile,
  type Db,
  type GestureLog,
  type Night,
  type ProductNote,
  type ProofEvent,
  type Scan,
  type Score,
  type Trial,
  type User,
} from "../store/db";

/**
 * Four weeks of sample data for one account, ending this morning:
 * a 5-scan noise floor, daily scans, nights, watch touches and check-offs, a light test,
 * gesture labels, three claim checks, a colour profile, and a niacinamide test that started three weeks ago.
 * Pores improve once the serum starts. This morning acne dips after a short night and a lot of face touching,
 * so the breakout page has something to explain.
 */

const CONCERNS = ["acne", "pore", "redness", "texture"] as const;
type Concern = (typeof CONCERNS)[number];

/** Day offsets from the latest morning (0). */
const FIRST_NIGHT = -28;
const FIRST_MORNING = -27;
const TRIAL_START = -20;
const MISSED_SCAN = -12;
const LIGHT_TEST = -26;

const FLOOR: Record<Concern, { mean: number; sd: number }> = {
  acne: { mean: 79.2, sd: 0.6 },
  pore: { mean: 64.1, sd: 0.75 },
  redness: { mean: 71.4, sd: 0.65 },
  texture: { mean: 68.3, sd: 0.8 },
};

/** Back-to-back offsets with mean 0 and SD ≈ 0.91, so each floor lands where it was meant to. */
const BURST = [-1.3, 0.5, 1.1, -0.4, 0.1];

const SLEEP: Record<number, number> = { [-23]: 5.4, [-15]: 5.6, [-8]: 5.8, [-3]: 6.0, 0: 4.6 };
const TOUCHES: Record<number, number> = { [-18]: 12, [-11]: 11, [-5]: 11, 0: 14 };

const LIGHTS: { label: string; open: Record<Concern, number>; kit: Record<Concern, number> }[] = [
  {
    label: "Bathroom",
    open: { acne: -2.8, pore: -3.6, redness: -4.1, texture: -2.2 },
    kit: { acne: -0.4, pore: -0.5, redness: -0.6, texture: -0.3 },
  },
  {
    label: "Window",
    open: { acne: 2.4, pore: 3.1, redness: 2.9, texture: 3.4 },
    kit: { acne: 0.3, pore: 0.4, redness: 0.5, texture: 0.6 },
  },
  {
    label: "Desk lamp",
    open: { acne: -4.6, pore: -5.2, redness: -6.3, texture: -4.8 },
    kit: { acne: -0.6, pore: -0.7, redness: -0.8, texture: -0.5 },
  },
];

export const DEMO_TRIAL = {
  productName: "Lumen Lab Niacinamide serum",
  active: "niacinamide",
  concern: "pore",
  claim: "Visibly minimises the look of pores.",
  claimDelta: 3.1,
} as const;

export type DemoSummary = {
  mornings: number;
  nights: number;
  faceTouches: number;
  trialDay: number;
};

type DayContext = { hours: number; touches: number; rmssd: number };

const demoId = () => `${DEMO_PREFIX}${randomUUID()}`;
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const round1 = (value: number) => Math.round(value * 10) / 10;

/** Removes this account's sample rows. Returns how many rows went. */
export function clearDemo(db: Db, userId: string): number {
  const before = countRows(db);
  const keep = <T extends { userId: string }>(rows: T[], demo: (row: T) => boolean) =>
    rows.filter((row) => row.userId !== userId || !demo(row));
  db.scans = keep(db.scans, (row) => isDemoId(row.id));
  db.scores = keep(db.scores, (row) => isDemoId(row.id));
  db.events = keep(db.events, (row) => isDemoId(row.id));
  db.trials = keep(db.trials, (row) => isDemoId(row.id));
  db.products = keep(db.products, (row) => isDemoId(row.id));
  db.nights = keep(db.nights, (row) => isDemoId(row.id));
  db.gestures = keep(db.gestures, (row) => isDemoId(row.id));
  db.profiles = keep(db.profiles ?? [], (row) => isDemoId(row.scanId));
  return before - countRows(db);
}

function countRows(db: Db): number {
  return (
    db.scans.length +
    db.scores.length +
    db.events.length +
    db.trials.length +
    db.products.length +
    db.nights.length +
    db.gestures.length +
    (db.profiles ?? []).length
  );
}

/** Replaces this account's sample rows with a fresh set that ends at `now`. Real rows are kept. */
export function seedDemo(db: Db, user: User, now = new Date()): DemoSummary {
  clearDemo(db, user.id);
  const rng = mulberry32(20261102);
  const zone = user.tzOffsetMinutes ?? 0;
  const nowMs = now.getTime();

  const local = new Date(nowMs + zone * 60_000);
  const anchorUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - (local.getUTCHours() < 9 ? 86_400_000 : 0);
  const dayString = (offset: number) => new Date(anchorUtc + offset * 86_400_000).toISOString().slice(0, 10);
  const at = (offset: number, hours: number, minutes = 0, seconds = 0) => {
    const ms = anchorUtc + offset * 86_400_000 + ((hours * 60 + minutes) * 60 + seconds) * 1000 - zone * 60_000;
    return new Date(Math.min(ms, nowMs - 60_000)).toISOString();
  };

  const context = new Map<number, DayContext>();
  for (let offset = FIRST_NIGHT; offset <= 0; offset++) {
    const hours = round1(SLEEP[offset] ?? clamp(7.05 + 0.45 * normal(rng), 6.2, 8.3));
    const touches = TOUCHES[offset] ?? Math.round(clamp(6 + 1.6 * normal(rng), 2, 10));
    const rmssd = Math.round(clamp(48 + 5.5 * (hours - 7) + 3 * normal(rng), 24, 68));
    context.set(offset, { hours, touches, rmssd });
  }

  const scans: Scan[] = [];
  const scores: Score[] = [];
  const addScan = (args: { createdAt: string; purpose: Scan["purpose"]; gated: boolean; lightLabel?: string; groupId?: string; values: Record<Concern, number> }) => {
    const scan: Scan = {
      id: demoId(),
      userId: user.id,
      createdAt: args.createdAt,
      purpose: args.purpose,
      mode: "sd",
      gated: args.gated,
      lightLabel: args.lightLabel ?? null,
      groupId: args.groupId ?? null,
      latencyMs: latency(rng),
      cached: false,
      taskId: `${DEMO_PREFIX}task`,
      imageFile: null,
    };
    scans.push(scan);
    for (const concern of CONCERNS) {
      const raw = round1(args.values[concern]);
      scores.push({
        id: demoId(),
        scanId: scan.id,
        userId: user.id,
        concern,
        raw,
        ui: Math.round(raw),
        region: "whole",
        maskFile: null,
        left: null,
        right: null,
      });
    }
    return scan;
  };

  const burst: Record<Concern, number[]> = { acne: [], pore: [], redness: [], texture: [] };
  BURST.forEach((_, index) => {
    const values = {} as Record<Concern, number>;
    CONCERNS.forEach((concern, shift) => {
      values[concern] = FLOOR[concern].mean + FLOOR[concern].sd * BURST[(index + shift) % BURST.length];
      burst[concern].push(round1(values[concern]));
    });
    addScan({ createdAt: at(FIRST_NIGHT, 8, 0, index * 45), purpose: "noise", gated: true, values });
  });
  const mdc = (concern: Concern) => Math.round(noiseFloor(burst[concern]).mdc95 * 100) / 100;

  let mornings = 0;
  let latestScanId = "";
  for (let offset = FIRST_MORNING; offset <= 0; offset++) {
    if (offset === MISSED_SCAN) continue;
    const day = context.get(offset) as DayContext;
    const debt = Math.max(0, 7 - day.hours);
    const stress = (day.rmssd - 48) / 6;
    const onDays = offset - TRIAL_START;
    const serum = onDays >= 0 ? 1.6 + 2.4 * (1 - Math.exp(-onDays / 3)) : 0;
    const values: Record<Concern, number> = {
      acne: 79.0 - 0.95 * debt - 0.2 * (day.touches - 6) + 0.35 * stress + 0.5 * normal(rng),
      pore: 64.0 + serum - 0.2 * debt + 0.4 * normal(rng),
      redness: 71.3 - 0.45 * debt + 0.2 * stress + 0.5 * normal(rng),
      texture: 68.2 + (onDays >= 0 ? 0.06 * onDays : 0) - 0.2 * debt + 0.5 * normal(rng),
    };
    const minute = 20 + Math.round(10 * normal(rng));
    latestScanId = addScan({ createdAt: at(offset, 8, clamp(minute, 2, 50)), purpose: "daily", gated: true, values }).id;
    mornings++;
  }

  LIGHTS.forEach((light, index) => {
    for (const gated of [false, true]) {
      const values = {} as Record<Concern, number>;
      for (const concern of CONCERNS) {
        values[concern] = FLOOR[concern].mean + (gated ? light.kit[concern] : light.open[concern]) + 0.2 * normal(rng);
      }
      addScan({
        createdAt: at(LIGHT_TEST, 19, 30 + index * 4 + (gated ? 1 : 0)),
        purpose: "lighting",
        gated,
        lightLabel: light.label,
        groupId: `${DEMO_PREFIX}lights`,
        values,
      });
    }
  });

  const seededDays = new Set<string>();
  const nights: Night[] = [];
  for (let offset = FIRST_NIGHT; offset <= 0; offset++) {
    const day = context.get(offset) as DayContext;
    seededDays.add(dayString(offset));
    nights.push({
      id: demoId(),
      userId: user.id,
      day: dayString(offset),
      sleepHours: day.hours,
      sleepScore: Math.round(clamp(50 + 11 * (day.hours - 4.5) + 3 * normal(rng), 35, 96)),
      rmssd: day.rmssd,
      restingHr: Math.round(59 - 1.8 * (day.hours - 7) + 1.2 * normal(rng)),
      humidity: Math.round(clamp(63 + 4 * normal(rng), 52, 76)),
      cyclePhase: null,
    });
  }
  const realNights = db.nights.filter((night) => night.userId === user.id && seededDays.has(night.day));
  const emptyNight = (night: Night) =>
    night.sleepHours == null && night.sleepScore == null && night.rmssd == null && night.restingHr == null && night.humidity == null;
  const placeholders = new Set(realNights.filter(emptyNight).map((night) => night.id));
  const realDays = new Set(realNights.filter((night) => !emptyNight(night)).map((night) => night.day));
  db.nights = db.nights.filter((night) => !placeholders.has(night.id));

  const events: ProofEvent[] = [];
  const event = (createdAt: string, type: ProofEvent["type"], payload: Record<string, unknown>) =>
    events.push({ id: demoId(), userId: user.id, createdAt, type, payload });
  let faceTouches = 0;
  for (let offset = FIRST_MORNING; offset <= 0; offset++) {
    const day = context.get(offset) as DayContext;
    event(at(offset, 8, 5, Math.round(30 * rng())), "checkoff", { slot: "morning", source: "watch" });
    if (offset >= TRIAL_START && offset < 0) {
      event(at(offset, 22, 15 + Math.round(20 * rng())), "checkoff", { slot: "evening", source: "watch" });
    }
    const start = 9 * 60;
    const end = offset === 0 ? clamp((nowMs - (anchorUtc - zone * 60_000)) / 60_000 - 3, start + 30, 22 * 60) : 22 * 60;
    const times = Array.from({ length: day.touches }, () => start + rng() * (end - start)).sort((a, b) => a - b);
    for (const minute of times) {
      event(at(offset, 0, Math.floor(minute), Math.floor((minute % 1) * 60)), "face_touch", { model: "watch4", source: "watch" });
      faceTouches++;
    }
  }

  const gestures: GestureLog[] = [];
  const labels: [GestureLog["label"], GestureLog["predicted"], number][] = [
    ["face", "face", 18],
    ["face", "other", 2],
    ["other", "face", 1],
    ["other", "other", 19],
  ];
  let second = 0;
  for (const [label, predicted, count] of labels) {
    for (let i = 0; i < count; i++) {
      gestures.push({ id: demoId(), userId: user.id, createdAt: at(FIRST_MORNING, 21, 0, (second += 17)), label, predicted });
    }
  }

  const note = (offset: number, name: string, claimText: string, concern: Concern, intensity: number, delta: number, decision: ProductNote["decision"]): ProductNote => ({
    id: demoId(),
    userId: user.id,
    createdAt: at(offset, 18, 10),
    name,
    claimText,
    concern,
    barcode: null,
    requestedIntensity: intensity,
    measuredDelta: delta,
    mdc: mdc(concern),
    decision,
    renderFile: null,
  });
  const products: ProductNote[] = [
    note(TRIAL_START - 1, "Niacinamide serum", DEMO_TRIAL.claim, "pore", 45, DEMO_TRIAL.claimDelta, "test"),
    note(-3, "Salicylic acid gel", "Visibly reduces blemishes.", "acne", 40, 0.4, "skip"),
    note(-2, "Centella calming cream", "Visibly reduces redness.", "redness", 35, 2.1, "test"),
  ];

  const trial: Trial = {
    id: demoId(),
    userId: user.id,
    productName: DEMO_TRIAL.productName,
    active: DEMO_TRIAL.active,
    concern: DEMO_TRIAL.concern,
    design: "before_after",
    startedOn: dayString(TRIAL_START),
    claimText: DEMO_TRIAL.claim,
    claimDelta: DEMO_TRIAL.claimDelta,
    createdAt: at(TRIAL_START - 1, 21, 40),
  };

  db.scans.push(...scans);
  db.scores.push(...scores);
  db.nights.push(...nights.filter((night) => !realDays.has(night.day)));
  db.events.push(...events);
  db.gestures.push(...gestures);
  db.products.push(...products);
  db.trials.push(trial);
  if (!(db.profiles ?? []).some((profile) => profile.userId === user.id)) {
    const profile: ColorProfile = {
      userId: user.id,
      createdAt: at(TRIAL_START - 1, 18, 0),
      scanId: latestScanId,
      skin: "#c08a63",
      lip: "#a5615a",
      eye: "#3a2a22",
      brow: "#2b211c",
      hair: "#1c1816",
      undertone: "warm",
    };
    db.profiles = [...(db.profiles ?? []), profile];
  }

  return { mornings, nights: nights.length, faceTouches, trialDay: -TRIAL_START + 1 };
}

function latency(rng: Rng): number {
  const slow = rng() < 0.08;
  return Math.round(slow ? 5200 + 900 * rng() : 2700 + 1300 * rng());
}

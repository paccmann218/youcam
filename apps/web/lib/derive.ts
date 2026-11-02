import { mean } from "./stats/linalg";
import {
  attributeDay,
  defaultDelta,
  fitEffect,
  noiseFloor,
  observationSd,
  updateDailySpread,
  verdictFromFit,
  type Attribution,
  type DayRow,
  type Verdict,
} from "./stats";
import { PRIOR_DAILY_SD, PRIOR_STRENGTH_DAYS } from "./stats/constants";
import { isDemoId, type Db, type Night, type Score, type Trial, type User } from "./store/db";

export function dayOf(iso: string, offsetMinutes: number): string {
  return new Date(new Date(iso).getTime() + offsetMinutes * 60_000).toISOString().slice(0, 10);
}

export type NoiseView = {
  concern: string;
  n: number;
  mean: number;
  sd: number;
  sem: number;
  mdc95: number;
};

export type DailyPoint = {
  day: string;
  raw: number;
  on: boolean;
  adherence: number;
  left: number | null;
  right: number | null;
};

export type LightingSpread = {
  concern: string;
  gated: { n: number; spread: number | null };
  ungated: { n: number; spread: number | null };
};

export type View = {
  user: User;
  trial: Trial | null;
  noise: NoiseView[];
  daily: Record<string, DailyPoint[]>;
  verdict: Verdict | null;
  splitVerdict: Verdict | null;
  splitLive: boolean;
  attribution: Attribution | null;
  latest: { concern: string; raw: number; delta: number | null; line: string }[];
  faceTouchesToday: number;
  /** Latest event sent by the watch (face touch, wake, gesture test, or a watch check-off). */
  watchSeenAt: string | null;
  lastNight: Night | null;
  humidity: number | null;
  latency: { n: number; mean: number | null; p95: number | null };
  lighting: LightingSpread[];
  gestures: { faceFace: number; faceOther: number; otherFace: number; otherOther: number };
  powerInput: { sigma: number; instrument: number; delta: number; mdc: number; baseline: number } | null;
  checkoffs: { morning: boolean; evening: boolean };
  /** True while sample rows from /api/demo are in this account. */
  demo: boolean;
};

function scoresFor(db: Db, scanId: string): Score[] {
  return db.scores.filter((score) => score.scanId === scanId);
}

export function buildView(db: Db, user: User, now = new Date()): View {
  const zone = user.tzOffsetMinutes ?? 0;
  const today = dayOf(now.toISOString(), zone);
  const onDay = (iso: string) => dayOf(iso, zone);
  const scans = db.scans.filter((scan) => scan.userId === user.id);
  const trial = [...db.trials].reverse().find((item) => item.userId === user.id) ?? null;

  const noiseScans = scans.filter((scan) => scan.purpose === "noise");
  const byConcern = new Map<string, number[]>();
  for (const scan of noiseScans) {
    for (const score of scoresFor(db, scan.id)) {
      const list = byConcern.get(score.concern) ?? [];
      list.push(score.raw);
      byConcern.set(score.concern, list);
    }
  }
  const noise: NoiseView[] = [];
  for (const [concern, samples] of byConcern) {
    if (samples.length < 2) continue;
    const floor = noiseFloor(samples);
    noise.push({ concern, ...floor });
  }

  const nights = db.nights.filter((night) => night.userId === user.id);
  const events = db.events.filter((event) => event.userId === user.id);
  const touchesByDay = new Map<string, number>();
  for (const event of events) {
    if (event.type !== "face_touch") continue;
    const day = onDay(event.createdAt);
    touchesByDay.set(day, (touchesByDay.get(day) ?? 0) + 1);
  }
  const rmssdValues = nights.map((night) => night.rmssd).filter((value): value is number => value != null);
  const rmssdMean = rmssdValues.length ? mean(rmssdValues) : null;
  const rmssdSd =
    rmssdValues.length > 1
      ? Math.sqrt(rmssdValues.reduce((sum, value) => sum + (value - (rmssdMean ?? 0)) ** 2, 0) / (rmssdValues.length - 1))
      : null;

  function rowContext(day: string, _onProduct: boolean): Omit<DayRow, "y" | "product"> & { adherence: number } {
    const night = nights.find((item) => item.day === day) ?? null;
    const evening = events.some(
      (event) => event.type === "checkoff" && onDay(event.createdAt) === day && event.payload.slot === "evening",
    );
    const adherence = evening ? 1 : 0;
    const sleepDebt = night?.sleepHours == null ? null : Math.max(0, 7 - night.sleepHours);
    const rmssdZ =
      night?.rmssd == null || rmssdMean == null || !rmssdSd ? null : (night.rmssd - rmssdMean) / rmssdSd;
    return {
      adherence,
      sleepDebt,
      rmssdZ,
      faceTouches: touchesByDay.get(day) ?? 0,
      humidity: night?.humidity ?? null,
      cycle: phaseCode(night?.cyclePhase ?? null),
    };
  }

  const dailyScans = scans.filter((scan) => scan.purpose === "daily");
  const concerns = new Set<string>([...noise.map((item) => item.concern), trial?.concern ?? "acne"]);
  for (const scan of dailyScans) for (const score of scoresFor(db, scan.id)) concerns.add(score.concern);

  const daily: Record<string, DailyPoint[]> = {};
  for (const concern of concerns) {
    const buckets = new Map<string, { raw: number[]; left: number[]; right: number[] }>();
    for (const scan of dailyScans) {
      const score = scoresFor(db, scan.id).find((item) => item.concern === concern);
      if (!score) continue;
      const day = onDay(scan.createdAt);
      const bucket = buckets.get(day) ?? { raw: [], left: [], right: [] };
      bucket.raw.push(score.raw);
      if (score.left != null) bucket.left.push(score.left);
      if (score.right != null) bucket.right.push(score.right);
      buckets.set(day, bucket);
    }
    const points: DailyPoint[] = [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, bucket]) => {
        const on = Boolean(trial && day >= trial.startedOn);
        const ctx = rowContext(day, on);
        return {
          day,
          raw: mean(bucket.raw),
          on,
          adherence: ctx.adherence,
          left: bucket.left.length ? mean(bucket.left) : null,
          right: bucket.right.length ? mean(bucket.right) : null,
        };
      });
    if (points.length) daily[concern] = points;
  }

  const focus = trial?.concern ?? noise[0]?.concern ?? "acne";
  const floor = noise.find((item) => item.concern === focus) ?? null;
  const points = daily[focus] ?? [];
  let verdict: Verdict | null = null;
  let splitVerdict: Verdict | null = null;
  let splitLive = false;
  let powerInput: View["powerInput"] = null;

  if (!floor) {
    verdict = {
      kind: "unidentified",
      probabilityBeyondMdc: 0,
      probabilityWorse: 0,
      probabilityInside: 0,
      mdc: 0,
      effectMean: 0,
      line: "Too early. Measure the noise floor first: five scans, back to back, same light.",
    };
  } else {
    const preRows: DayRow[] = [];
    const hasOffDay = points.some((point) => !point.on);
    if (!hasOffDay) {
      preRows.push({
        y: floor.mean,
        product: 0,
        ...blankContext(),
      });
    }
    const rows: DayRow[] = [
      ...preRows,
      ...points.map((point) => {
        const night = nights.find((item) => item.day === point.day);
        const ctx = rowContext(point.day, point.on);
        return {
          y: point.raw,
          product: point.on ? ctx.adherence : 0,
          sleepDebt: night ? ctx.sleepDebt : ctx.sleepDebt,
          rmssdZ: ctx.rmssdZ,
          faceTouches: ctx.faceTouches,
          humidity: ctx.humidity,
          cycle: ctx.cycle,
        };
      }),
    ];
    const spread = updateDailySpread(withinPhase(points), PRIOR_DAILY_SD, PRIOR_STRENGTH_DAYS);
    const sigma = observationSd(spread.sd, floor.sem);
    const fit = fitEffect(rows, sigma);
    verdict = verdictFromFit(fit, floor.mdc95);
    const baseline = floor.mean;
    const delta = trial?.claimDelta && trial.claimDelta > 0 ? trial.claimDelta : defaultDelta(baseline);
    powerInput = { sigma, instrument: floor.sem, delta, mdc: floor.mdc95, baseline };

    const diffs = points.filter((point) => point.left != null && point.right != null);
    if (trial?.design === "split_face" && diffs.length >= 4) {
      splitLive = true;
      const splitRows: DayRow[] = diffs.map((point) => ({
        y: (point.left ?? 0) - (point.right ?? 0),
        product: 1,
      }));
      const splitSpread = updateDailySpread(
        splitRows.map((row) => row.y),
        floor.sem * Math.SQRT2,
        PRIOR_STRENGTH_DAYS,
      );
      splitVerdict = verdictFromFit(
        fitEffect(splitRows, Math.max(splitSpread.sd, floor.sem), { target: "mean" }),
        floor.mdc95 * Math.SQRT2,
      );
    }
  }

  const latestScan = [...dailyScans, ...noiseScans].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1);
  const latest = latestScan
    ? scoresFor(db, latestScan.id).map((score) => {
        const base = noise.find((item) => item.concern === score.concern);
        const delta = base ? score.raw - base.mean : null;
        return {
          concern: score.concern,
          raw: score.raw,
          delta,
          line: delta == null || !base ? "No noise floor for this concern yet." : reading(score.concern, delta, base.mdc95),
        };
      })
    : [];

  let attribution: Attribution | null = null;
  const acneFloor = noise.find((item) => item.concern === "acne");
  const acnePoints = daily.acne ?? [];
  const acneToday = acnePoints.at(-1);
  if (acneFloor && acneToday && acneFloor.mean - acneToday.raw > acneFloor.mdc95) {
    const rows: DayRow[] = acnePoints.slice(0, -1).map((point) => ({
      y: point.raw,
      product: point.on ? point.adherence : 0,
      ...contextFor(point.day, nights, touchesByDay, rmssdMean, rmssdSd),
    }));
    const todayRow: DayRow = {
      y: acneToday.raw,
      product: acneToday.on ? acneToday.adherence : 0,
      ...contextFor(acneToday.day, nights, touchesByDay, rmssdMean, rmssdSd),
    };
    attribution = attributeDay(rows, todayRow, powerInput?.sigma ?? PRIOR_DAILY_SD, acneFloor.mdc95);
  }

  const latencies = scans.filter((scan) => !scan.cached && scan.latencyMs > 0).map((scan) => scan.latencyMs);
  latencies.sort((a, b) => a - b);
  const p95 = latencies.length ? latencies[Math.min(latencies.length - 1, Math.ceil(latencies.length * 0.95) - 1)] : null;

  const gestures = { faceFace: 0, faceOther: 0, otherFace: 0, otherOther: 0 };
  for (const gesture of db.gestures.filter((item) => item.userId === user.id)) {
    if (gesture.label === "face" && gesture.predicted === "face") gestures.faceFace++;
    else if (gesture.label === "face") gestures.faceOther++;
    else if (gesture.predicted === "face") gestures.otherFace++;
    else gestures.otherOther++;
  }

  const lastNight = [...nights].reverse().find((night) => night.day <= today) ?? null;

  return {
    user,
    trial,
    noise,
    daily,
    verdict,
    splitVerdict,
    splitLive,
    attribution,
    latest,
    faceTouchesToday: touchesByDay.get(today) ?? 0,
    watchSeenAt:
      events
        .filter((event) => ["face_touch", "wake", "gesture_test", "hr_ibi"].includes(event.type) || event.payload?.source === "watch")
        .map((event) => event.createdAt)
        .sort()
        .at(-1) ?? null,
    lastNight,
    humidity: lastNight?.humidity ?? null,
    latency: {
      n: latencies.length,
      mean: latencies.length ? mean(latencies) : null,
      p95,
    },
    lighting: lightingSpread(db, user.id),
    gestures,
    powerInput,
    checkoffs: {
      morning: events.some((event) => event.type === "checkoff" && onDay(event.createdAt) === today && event.payload.slot === "morning"),
      evening: events.some((event) => event.type === "checkoff" && onDay(event.createdAt) === today && event.payload.slot === "evening"),
    },
    demo: scans.some((scan) => isDemoId(scan.id)),
  };
}

/**
 * Daily scores centred on their own phase (before the product, on the product), so the step a working
 * product makes is not counted as day-to-day wobble. Scaled so the spread keeps n − 1 in its denominator
 * after the phase means are taken out. A phase with one morning carries no spread and is left out.
 */
export function withinPhase(points: { raw: number; on: boolean }[]): number[] {
  const phases = [points.filter((point) => !point.on), points.filter((point) => point.on)].filter((phase) => phase.length >= 2);
  const n = phases.reduce((sum, phase) => sum + phase.length, 0);
  if (n - phases.length < 2) return points.map((point) => point.raw);
  const scale = Math.sqrt((n - 1) / (n - phases.length));
  return phases.flatMap((phase) => {
    const centre = mean(phase.map((point) => point.raw));
    return phase.map((point) => (point.raw - centre) * scale);
  });
}

function blankContext() {
  return { sleepDebt: null, rmssdZ: null, faceTouches: null, humidity: null, cycle: null };
}

function phaseCode(phase: string | null): number | null {
  if (!phase) return null;
  const map: Record<string, number> = { menstrual: 0, follicular: 1, ovulatory: 2, luteal: 3 };
  return map[phase] ?? null;
}

function contextFor(
  day: string,
  nights: Night[],
  touches: Map<string, number>,
  rmssdMean: number | null,
  rmssdSd: number | null,
) {
  const night = nights.find((item) => item.day === day);
  return {
    sleepDebt: night?.sleepHours == null ? null : Math.max(0, 7 - night.sleepHours),
    rmssdZ: night?.rmssd == null || rmssdMean == null || !rmssdSd ? null : (night.rmssd - rmssdMean) / rmssdSd,
    faceTouches: touches.get(day) ?? 0,
    humidity: night?.humidity ?? null,
    cycle: phaseCode(night?.cyclePhase ?? null),
  };
}

export function reading(concern: string, delta: number, mdc: number): string {
  const name = concern[0].toUpperCase() + concern.slice(1);
  const signed = `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`;
  if (Math.abs(delta) <= mdc) return `${name} ${signed}: within noise, don't celebrate yet.`;
  if (delta > 0) return `${name} ${signed}: past your noise of ${mdc.toFixed(1)}. One morning is not a verdict.`;
  return `${name} ${signed}: worse by more than your noise of ${mdc.toFixed(1)}.`;
}

function lightingSpread(db: Db, userId: string): LightingSpread[] {
  const scans = db.scans.filter((scan) => scan.userId === userId && scan.purpose === "lighting");
  const groups = new Map<string, { gated: number[]; open: number[] }>();
  for (const scan of scans) {
    for (const score of db.scores.filter((item) => item.scanId === scan.id)) {
      const bucket = groups.get(score.concern) ?? { gated: [], open: [] };
      (scan.gated ? bucket.gated : bucket.open).push(score.raw);
      groups.set(score.concern, bucket);
    }
  }
  return [...groups.entries()].map(([concern, bucket]) => ({
    concern,
    gated: summarize(bucket.gated),
    ungated: summarize(bucket.open),
  }));
}

function summarize(values: number[]) {
  if (values.length < 2) return { n: values.length, spread: null };
  return { n: values.length, spread: Math.max(...values) - Math.min(...values) };
}

export function trialDayNumber(trial: Trial | null, today: string): number | null {
  if (!trial) return null;
  const start = Date.parse(trial.startedOn);
  const now = Date.parse(today);
  if (!Number.isFinite(start) || !Number.isFinite(now)) return null;
  return Math.floor((now - start) / 86_400_000) + 1;
}

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { compareDesigns, earliestHonestDay, falseWorkingRate, simulateTrialPath } from "@/lib/stats";
import { PRIOR_DAILY_SD } from "@/lib/stats/constants";
import { buildView } from "@/lib/derive";
import { json, options, resolveUser } from "@/lib/http";
import { observationSd } from "@/lib/stats";
import { readDb } from "@/lib/store/db";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

type CacheFile = Record<string, unknown>;

export async function GET(request: Request) {
  const user = await resolveUser(request);
  if (!user) return json({ error: "Pair this browser first." }, 401);
  const db = await readDb();
  const view = buildView(db, user);
  if (!view.powerInput) return json({ error: "No noise floor yet." }, 400);
  const url = new URL(request.url);
  const trials = Math.min(1000, Math.max(50, Number(url.searchParams.get("trials") ?? 400)));
  const input = view.powerInput;
  const key = JSON.stringify({
    s: round(input.sigma),
    i: round(input.instrument),
    d: round(input.delta),
    m: round(input.mdc),
    b: round(input.baseline),
    trials,
  });
  const cached = await readCache(key);
  if (cached) return json(cached);

  const currentSigma = input.sigma;
  const priorSigma = observationSd(PRIOR_DAILY_SD, input.instrument);
  const shared = { delta: input.delta, mdc: input.mdc, trials, seed: 1729, confounders: 4, maxDay: 56 };
  const result = {
    prior: earliestHonestDay({ ...shared, sigma: priorSigma }),
    current: earliestHonestDay({ ...shared, sigma: currentSigma }),
    designs: compareDesigns({
      dailySigma: currentSigma,
      instrumentSigma: Math.max(input.instrument, 0.4),
      delta: input.delta,
      mdc: input.mdc,
      trials: Math.min(trials, 250),
      seed: 1729,
    }),
    falseWorking: falseWorkingRate({
      sigma: currentSigma,
      mdc: input.mdc,
      days: 24,
      trials: Math.min(trials, 400),
      seed: 1729,
      confounders: 4,
    }),
    simulated: simulateTrialPath({
      baseline: input.baseline,
      delta: input.delta,
      sigma: currentSigma,
      seed: 1729,
    }),
    assumption:
      "The effect size is the measured claim when one exists, otherwise 10% of your baseline raw score. Daily spread starts at a stated prior of 3.5 and updates from your mornings. These paths are simulated. They are not scans.",
    trials,
  };
  await writeCache(key, result);
  return json(result);
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

async function cachePath() {
  const dir = path.join(process.cwd(), ".data");
  await mkdir(dir, { recursive: true });
  return path.join(dir, "power-cache.json");
}

async function readCache(key: string) {
  try {
    const file = JSON.parse(await readFile(await cachePath(), "utf8")) as CacheFile;
    return file[key] ?? null;
  } catch {
    return null;
  }
}

async function writeCache(key: string, value: unknown) {
  const file = ((await readCache("__all__")) as CacheFile | null) ?? {};
  const current = await (async () => {
    try {
      return JSON.parse(await readFile(await cachePath(), "utf8")) as CacheFile;
    } catch {
      return {} as CacheFile;
    }
  })();
  current[key] = value;
  await writeFile(await cachePath(), JSON.stringify(current));
  return file;
}

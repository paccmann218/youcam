import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type ScanPurpose = "noise" | "daily" | "lighting" | "claim";

export type User = {
  id: string;
  pairCode: string;
  consentAt: string | null;
  place: string | null;
  latitude: number | null;
  longitude: number | null;
  tzOffsetMinutes: number;
  createdAt: string;
};

export type Scan = {
  id: string;
  userId: string;
  createdAt: string;
  purpose: ScanPurpose;
  mode: "sd" | "hd";
  gated: boolean;
  lightLabel: string | null;
  groupId: string | null;
  latencyMs: number;
  cached: boolean;
  taskId: string;
  imageFile: string | null;
};

export type Score = {
  id: string;
  scanId: string;
  userId: string;
  concern: string;
  raw: number;
  ui: number;
  region: string;
  maskFile: string | null;
  /** Mean mask intensity on each half, 0..1, when a midline was supplied. */
  left: number | null;
  right: number | null;
};

export type ProofEvent = {
  id: string;
  userId: string;
  createdAt: string;
  type: "face_touch" | "checkoff" | "hr_ibi" | "gesture_test" | "wake";
  payload: Record<string, unknown>;
};

export type Trial = {
  id: string;
  userId: string;
  productName: string;
  active: string;
  concern: string;
  design: "split_face" | "before_after";
  startedOn: string;
  claimText: string | null;
  claimDelta: number | null;
  createdAt: string;
};

export type ProductNote = {
  id: string;
  userId: string;
  createdAt: string;
  name: string;
  claimText: string;
  concern: string;
  barcode: string | null;
  requestedIntensity: number | null;
  measuredDelta: number | null;
  mdc: number | null;
  decision: "skip" | "test" | "unmeasured" | null;
  renderFile: string | null;
};

export type Night = {
  id: string;
  userId: string;
  day: string;
  sleepHours: number | null;
  sleepScore: number | null;
  rmssd: number | null;
  restingHr: number | null;
  humidity: number | null;
  cyclePhase: string | null;
};

export type GestureLog = {
  id: string;
  userId: string;
  createdAt: string;
  label: "face" | "other";
  predicted: "face" | "other";
};

export type ColorProfile = {
  userId: string;
  createdAt: string;
  scanId: string;
  skin: string | null;
  lip: string | null;
  eye: string | null;
  brow: string | null;
  hair: string | null;
  undertone: string | null;
};

export type Db = {
  users: User[];
  scans: Scan[];
  scores: Score[];
  events: ProofEvent[];
  trials: Trial[];
  products: ProductNote[];
  nights: Night[];
  gestures: GestureLog[];
  /** Added later; older ledgers do not have it. */
  profiles?: ColorProfile[];
};

const empty = (): Db => ({
  users: [],
  scans: [],
  scores: [],
  events: [],
  trials: [],
  products: [],
  nights: [],
  gestures: [],
  profiles: [],
});

function dbPath() {
  return path.join(process.cwd(), ".data", "db.json");
}

let chain: Promise<unknown> = Promise.resolve();

function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function readDb(): Promise<Db> {
  try {
    return JSON.parse(await readFile(dbPath(), "utf8")) as Db;
  } catch {
    return empty();
  }
}

export async function updateDb<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  return locked(async () => {
    await mkdir(path.dirname(dbPath()), { recursive: true });
    const db = await readDb();
    const result = await fn(db);
    await writeFile(dbPath(), JSON.stringify(db, null, 2));
    await replicate(db);
    return result;
  });
}

function supabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function replicate(db: Db) {
  const client = supabase();
  if (!client) return;
  const tables: [string, unknown[]][] = [
    ["users", db.users],
    ["scans", db.scans],
    ["concern_scores", db.scores],
    ["events", db.events],
    ["trials", db.trials],
    ["products", db.products],
    ["nights", db.nights],
    ["gestures", db.gestures],
  ];
  for (const [table, rows] of tables) {
    if (rows.length === 0) continue;
    const { error } = await client.from(table).upsert(rows as Record<string, unknown>[]);
    if (error) console.error(`supabase ${table}: ${error.message}`);
  }
}

export async function deleteUserEverywhere(userId: string) {
  await updateDb((db) => {
    db.users = db.users.filter((u) => u.id !== userId);
    db.scans = db.scans.filter((s) => s.userId !== userId);
    db.scores = db.scores.filter((s) => s.userId !== userId);
    db.events = db.events.filter((e) => e.userId !== userId);
    db.trials = db.trials.filter((t) => t.userId !== userId);
    db.products = db.products.filter((p) => p.userId !== userId);
    db.nights = db.nights.filter((n) => n.userId !== userId);
    db.gestures = db.gestures.filter((g) => g.userId !== userId);
    db.profiles = (db.profiles ?? []).filter((item) => item.userId !== userId);
  });
  const client = supabase();
  if (!client) return;
  for (const table of ["concern_scores", "scans", "events", "trials", "products", "nights", "gestures", "users"]) {
    await client.from(table).delete().eq(table === "users" ? "id" : "userId", userId);
  }
}

type Listener = (event: ProofEvent) => void;

const bus = ((globalThis as unknown as { __proofBus?: { listeners: Set<Listener> } }).__proofBus ??= {
  listeners: new Set<Listener>(),
});

export function emitEvent(event: ProofEvent) {
  for (const listener of bus.listeners) listener(event);
}

export function subscribe(listener: Listener): () => void {
  bus.listeners.add(listener);
  return () => bus.listeners.delete(listener);
}

export function publicStatus() {
  return {
    youcam: Boolean(process.env.YOUCAM_API_KEY),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    supabase: supabaseConfigured(),
    mode: process.env.YOUCAM_MODE === "hd" ? "hd" : "sd",
  };
}

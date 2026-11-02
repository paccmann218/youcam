import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const BASE = process.env.YOUCAM_API_BASE || "https://yce-api-01.makeupar.com";

export class YouCamError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "YouCamError";
  }
}

export function youcamConfigured(): boolean {
  return Boolean(process.env.YOUCAM_API_KEY);
}

export type UploadedFile = { fileId: string; contentType: string };

type Json = Record<string, unknown>;

async function authFetch(url: string, init: RequestInit): Promise<Response> {
  const key = process.env.YOUCAM_API_KEY;
  if (!key) throw new YouCamError("YOUCAM_API_KEY is not set on the server.");
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(init.headers ?? {}),
    },
  });
}

export async function uploadImage(bytes: Buffer, contentType: string, fileName: string): Promise<UploadedFile> {
  const meta = await authFetch(`${BASE}/s2s/v2.0/file`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      files: [{ content_type: contentType, file_name: fileName, file_size: bytes.length }],
    }),
  });
  const metaJson = (await meta.json()) as Json;
  if (!meta.ok) {
    throw new YouCamError(`File API failed (${meta.status})`, undefined, meta.status);
  }
  const file = (((metaJson.data as Json)?.files as Json[]) ?? [])[0];
  const fileId = String(file?.file_id ?? "");
  const request = ((file?.requests as Json[]) ?? [])[0];
  const uploadUrl = String(request?.url ?? "");
  if (!fileId || !uploadUrl) throw new YouCamError("File API did not return an upload URL.");
  const headers = (request?.headers as Record<string, string>) ?? {};
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": headers["Content-Type"] ?? contentType,
      "Content-Length": String(bytes.length),
    },
    body: new Uint8Array(bytes),
  });
  if (!put.ok) throw new YouCamError(`Image upload failed (${put.status})`, undefined, put.status);
  return { fileId, contentType };
}

export type TaskResult = {
  taskId: string;
  raw: Json;
  latencyMs: number;
  cached: boolean;
};

function cacheDir() {
  return path.join(process.cwd(), ".data", "cache");
}

function cacheKey(endpoint: string, body: Json, imageHash: string) {
  // src_file_id changes on every upload of the same bytes, so it must not be part of the key.
  // The image itself is already identified by imageHash.
  const { src_file_id: _fileId, ...stable } = body;
  return createHash("sha256").update(JSON.stringify({ endpoint, body: stable, imageHash })).digest("hex");
}

export async function runTask(args: {
  endpoint: string;
  body: Json;
  imageHash: string;
}): Promise<TaskResult> {
  await mkdir(cacheDir(), { recursive: true });
  const key = cacheKey(args.endpoint, args.body, args.imageHash);
  const file = path.join(cacheDir(), `${key}.json`);
  try {
    const hit = JSON.parse(await readFile(file, "utf8")) as TaskResult;
    return { ...hit, cached: true, latencyMs: 0 };
  } catch {
    /* miss */
  }
  const started = Date.now();
  const created = await authFetch(`${BASE}${args.endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args.body),
  });
  const createdJson = (await created.json()) as Json;
  if (!created.ok) {
    throw new YouCamError(
      `Task create failed (${created.status}): ${JSON.stringify(createdJson).slice(0, 400)}`,
      undefined,
      created.status,
    );
  }
  const taskId = String((createdJson.data as Json)?.task_id ?? "");
  if (!taskId) throw new YouCamError("YouCam did not return a task id.");
  const raw = await pollTask(`${args.endpoint}/${encodeURIComponent(taskId)}`);
  const result: TaskResult = { taskId, raw, latencyMs: Date.now() - started, cached: false };
  if (taskStatus(raw) === "success") {
    await writeFile(file, JSON.stringify(result));
  }
  return result;
}

export function taskStatus(raw: Json): string {
  return String((raw.data as Json)?.task_status ?? "");
}

async function pollTask(path: string): Promise<Json> {
  for (let i = 0; i < 40; i++) {
    const res = await authFetch(`${BASE}${path}`, { method: "GET" });
    const json = (await res.json()) as Json;
    if (!res.ok) throw new YouCamError(`Poll failed (${res.status})`, undefined, res.status);
    const status = taskStatus(json);
    if (status === "success") return json;
    if (status === "error") {
      const data = (json.data as Json) ?? {};
      throw new YouCamError(
        String(data.error_message ?? data.error ?? "YouCam task failed"),
        String(data.error ?? ""),
      );
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new YouCamError("YouCam task timed out.");
}

export const SD_CONCERNS = ["acne", "pore", "redness", "texture"] as const;
export const HD_CONCERNS = ["hd_acne", "hd_pore", "hd_redness", "hd_texture"] as const;

export function concernsFor(mode: "sd" | "hd"): string[] {
  return mode === "hd" ? [...HD_CONCERNS] : [...SD_CONCERNS];
}

export function concernKey(action: string): string {
  return action.replace(/^hd_/, "");
}

export type ConcernScore = {
  concern: string;
  action: string;
  region: string;
  raw: number;
  ui: number;
  maskUrl?: string;
};

export function parseScores(raw: Json): ConcernScore[] {
  const data = (raw.data as Json) ?? {};
  const results = (data.results as Json) ?? {};
  const output = (results.output as Json[]) ?? [];
  const scores: ConcernScore[] = [];
  for (const item of output) {
    const action = String(item.type ?? "");
    if (!action || action === "llm_results") continue;
    const rawScore = Number(item.raw_score);
    if (!Number.isFinite(rawScore)) continue;
    const region = String(item.region ?? "whole");
    const masks = (item.mask_urls as string[]) ?? [];
    scores.push({
      concern: concernKey(action),
      action,
      region,
      raw: rawScore,
      ui: Number(item.ui_score),
      maskUrl: masks[0],
    });
  }
  const preferred = new Map<string, ConcernScore>();
  for (const score of scores) {
    const current = preferred.get(score.concern);
    if (!current || score.region === "whole") preferred.set(score.concern, score);
  }
  return [...preferred.values()];
}

export function findImageUrl(value: unknown): string | null {
  if (typeof value === "string" && /^https?:\/\//.test(value) && /\.(png|jpe?g|webp)(\?|$)/i.test(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findImageUrl(item);
      if (found) return found;
    }
  } else if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["url", "download_url", "image_url", "dst_url"]) {
      if (typeof record[key] === "string" && /^https?:\/\//.test(record[key] as string)) return record[key] as string;
    }
    for (const nested of Object.values(record)) {
      const found = findImageUrl(nested);
      if (found) return found;
    }
  }
  return null;
}

export async function download(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new YouCamError(`Could not download result (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

const SIM_KEYS = ["acne", "pores", "redness", "texture", "wrinkle", "radiance", "spots", "dark_circle", "oiliness", "eye_bags"] as const;

export function simulationKey(concern: string): (typeof SIM_KEYS)[number] | null {
  const map: Record<string, (typeof SIM_KEYS)[number]> = {
    acne: "acne",
    pore: "pores",
    pores: "pores",
    redness: "redness",
    texture: "texture",
    wrinkle: "wrinkle",
    wrinkles: "wrinkle",
    radiance: "radiance",
    spot: "spots",
    spots: "spots",
    dark_circle: "dark_circle",
    oiliness: "oiliness",
    eye_bag: "eye_bags",
    eye_bags: "eye_bags",
  };
  return map[concern] ?? null;
}

export function hashBytes(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

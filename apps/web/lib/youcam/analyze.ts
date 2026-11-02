import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  concernsFor,
  download,
  hashBytes,
  parseScores,
  runTask,
  uploadImage,
  type ConcernScore,
} from "./client";
import { updateDb, type Scan, type ScanPurpose, type Score } from "../store/db";

export async function saveImage(id: string, bytes: Buffer): Promise<string> {
  const dir = path.join(process.cwd(), ".data", "images");
  await mkdir(dir, { recursive: true });
  const ext = bytes[0] === 0x89 && bytes[1] === 0x50 ? "png" : "jpg";
  const name = `${id}.${ext}`;
  await writeFile(path.join(dir, name), bytes);
  return name;
}

export async function scoreImage(bytes: Buffer, contentType: string, mode: "sd" | "hd") {
  const uploaded = await uploadImage(bytes, contentType, `proof-${Date.now()}.jpg`);
  const actions = concernsFor(mode);
  const task = await runTask({
    endpoint: "/s2s/v2.0/task/skin-analysis",
    imageHash: hashBytes(bytes),
    body: {
      src_file_id: uploaded.fileId,
      dst_actions: actions,
      format: "json",
    },
  });
  const scores = parseScores(task.raw).filter((score) =>
    actions.some((action) => score.action === action || score.concern === action.replace(/^hd_/, "")),
  );
  if (scores.length === 0) {
    throw new Error("YouCam returned no raw scores. The photo may have failed the face check.");
  }
  return { scores, task, fileId: uploaded.fileId };
}

export async function analyzeFace(args: {
  userId: string;
  bytes: Buffer;
  contentType: string;
  purpose: ScanPurpose;
  gated: boolean;
  mode: "sd" | "hd";
  lightLabel?: string | null;
  groupId?: string | null;
}): Promise<{ scan: Scan; scores: Score[] }> {
  const { scores: parsed, task } = await scoreImage(args.bytes, args.contentType, args.mode);
  const scanId = randomUUID();
  const imageFile = await saveImage(scanId, args.bytes);
  const scores: Score[] = [];
  for (const score of parsed) {
    let maskFile: string | null = null;
    if (score.maskUrl) {
      try {
        const mask = await download(score.maskUrl);
        maskFile = await saveImage(`${scanId}-${score.concern}`, mask);
      } catch {
        maskFile = null;
      }
    }
    scores.push({
      id: randomUUID(),
      scanId,
      userId: args.userId,
      concern: score.concern,
      raw: score.raw,
      ui: score.ui,
      region: score.region,
      maskFile,
      left: null,
      right: null,
    });
  }
  const scan: Scan = {
    id: scanId,
    userId: args.userId,
    createdAt: new Date().toISOString(),
    purpose: args.purpose,
    mode: args.mode,
    gated: args.gated,
    lightLabel: args.lightLabel ?? null,
    groupId: args.groupId ?? null,
    latencyMs: task.latencyMs,
    cached: task.cached,
    taskId: task.taskId,
    imageFile,
  };
  await updateDb((db) => {
    db.scans.push(scan);
    db.scores.push(...scores);
  });
  return { scan, scores };
}

/** A shop photo. It is the face for try-on and colour matching, and it is not a trial morning. */
export async function savePortrait(args: {
  userId: string;
  bytes: Buffer;
  contentType: string;
  mode: "sd" | "hd";
}): Promise<{ scan: Scan; scores: Score[]; imageFile: string; scoreError: string | null }> {
  const scanId = randomUUID();
  const imageFile = await saveImage(scanId, args.bytes);
  const scores: Score[] = [];
  let scoreError: string | null = null;
  let latencyMs = 0;
  let cached = false;
  let taskId = "portrait";
  try {
    const { scores: parsed, task } = await scoreImage(args.bytes, args.contentType, args.mode);
    latencyMs = task.latencyMs;
    cached = task.cached;
    taskId = task.taskId;
    for (const score of parsed) {
      let maskFile: string | null = null;
      if (score.maskUrl) {
        try {
          maskFile = await saveImage(`${scanId}-${score.concern}`, await download(score.maskUrl));
        } catch {
          maskFile = null;
        }
      }
      scores.push({
        id: randomUUID(),
        scanId,
        userId: args.userId,
        concern: score.concern,
        raw: score.raw,
        ui: score.ui,
        region: score.region,
        maskFile,
        left: null,
        right: null,
      });
    }
  } catch (error) {
    scoreError = error instanceof Error ? error.message : "YouCam could not score this photo.";
  }
  const scan: Scan = {
    id: scanId,
    userId: args.userId,
    createdAt: new Date().toISOString(),
    purpose: "portrait",
    mode: args.mode,
    gated: false,
    lightLabel: null,
    groupId: null,
    latencyMs,
    cached,
    taskId,
    imageFile,
  };
  await updateDb((db) => {
    db.scans.push(scan);
    db.scores.push(...scores);
  });
  return { scan, scores, imageFile, scoreError };
}

export function primaryScores(scores: ConcernScore[] | Score[]) {
  return scores;
}

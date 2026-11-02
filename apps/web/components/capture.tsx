"use client";

import { useState } from "react";
import { Icon } from "./icons";
import { buttonClass } from "./ui/button";
import { Callout } from "./ui/callout";
import { Field, Input } from "./ui/field";
import { Segmented } from "./ui/segmented";

export async function prepareImage(source: Blob, mode: "sd" | "hd"): Promise<{ blob: Blob; warning: string | null }> {
  const bitmap = await createImageBitmap(source);
  const limit = mode === "hd" ? 2560 : 1920;
  const scale = Math.min(1, limit / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(bitmap.width * scale));
  canvas.height = Math.max(2, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read the photo.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Could not encode the photo."))), "image/jpeg", 0.92);
  });
  const shortSide = Math.min(canvas.width, canvas.height);
  const warning =
    mode === "hd" && shortSide < 1080
      ? `This frame's short side is ${shortSide}px. HD wants 1080. Use SD, or a closer camera.`
      : mode === "sd" && shortSide < 480
        ? `This frame's short side is ${shortSide}px. SD wants 480.`
        : null;
  return { blob, warning };
}

type Ymk = {
  init: (opts: Record<string, unknown>) => void;
  openCameraKit: () => void;
  close: () => void;
  addEventListener: (name: string, fn: (payload: { images?: { image: string | Blob }[] }) => void) => void;
};

export function openCameraKit(mode: "sd" | "hd", onImage: (image: string | Blob) => void) {
  const w = window as unknown as { YMK?: Ymk; YMKAsyncInit?: () => void };
  w.YMKAsyncInit = () => {
    const ymk = w.YMK;
    if (!ymk) return;
    ymk.addEventListener("faceDetectionCaptured", (result) => {
      const image = result.images?.[0]?.image;
      if (image) onImage(image);
      try {
        ymk.close();
      } catch {
        /* kit already closed */
      }
    });
    ymk.init({
      faceDetectionMode: mode === "hd" ? "hdskincare" : "skincare",
      imageFormat: "base64",
      language: "enu",
      qualityLevel: "strict",
      videoQuality: mode === "hd" ? "1920p" : "1080p",
    });
    ymk.openCameraKit();
  };
  if (w.YMK) {
    w.YMKAsyncInit();
    return;
  }
  const existing = document.querySelector("script[data-youcam-kit]");
  if (existing) return;
  const script = document.createElement("script");
  script.src = "https://plugins-media.makeupar.com/v2.5-camera-kit/sdk.js";
  script.async = true;
  script.dataset.youcamKit = "1";
  document.body.appendChild(script);
}

export async function uploadScan(args: {
  blob: Blob;
  purpose: "noise" | "daily" | "lighting";
  gated: boolean;
  mode: "sd" | "hd";
  lightLabel?: string;
  groupId?: string;
}) {
  const body = new FormData();
  body.set("image", args.blob, "face.jpg");
  body.set("purpose", args.purpose);
  body.set("gated", args.gated ? "1" : "0");
  body.set("mode", args.mode);
  if (args.lightLabel) body.set("lightLabel", args.lightLabel);
  if (args.groupId) body.set("groupId", args.groupId);
  const res = await fetch("/api/scan", { method: "POST", body });
  const json = (await res.json()) as {
    error?: string;
    scan?: { id: string };
    scores?: { concern: string; raw: number; ui: number; maskFile: string | null }[];
  };
  if (!res.ok) throw new Error(json.error || "Scan failed.");
  return json;
}

export function CaptureForm({
  purpose,
  onDone,
}: {
  purpose: "noise" | "daily" | "lighting";
  onDone: () => Promise<void>;
}) {
  const [mode, setMode] = useState<"sd" | "hd">("sd");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [light, setLight] = useState("Bathroom");
  const target = purpose === "noise" ? 5 : 1;
  const [count, setCount] = useState(0);

  async function send(source: Blob | string, gated: boolean) {
    setBusy(true);
    setError(null);
    try {
      const blob = typeof source === "string" ? await (await fetch(source)).blob() : source;
      const prepared = await prepareImage(blob, mode);
      setNote(prepared.warning);
      if (prepared.warning && mode === "hd") throw new Error(prepared.warning);
      const result = await uploadScan({
        blob: prepared.blob,
        purpose,
        gated,
        mode,
        lightLabel: purpose === "lighting" ? light : undefined,
        groupId: purpose === "lighting" ? "lighting" : undefined,
      });
      if (result.scan && result.scores) await splitHalves(result.scan.id, prepared.blob, result.scores);
      const next = count + 1;
      setCount(next);
      setNote(purpose === "noise" && next < target ? `${next} of ${target}. Same light. Don't move.` : "Scored and saved with YouCam's raw score.");
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div id="YMK-module" />
      <div>
        <p className="kicker mb-2 text-quiet">Resolution</p>
        <Segmented
          label="Scan resolution"
          value={mode}
          onChange={setMode}
          options={[
            { value: "sd", label: "SD", hint: "4 concerns" },
            { value: "hd", label: "HD", hint: "more units" },
          ]}
        />
      </div>
      {purpose === "lighting" ? (
        <Field label="Name this light">
          <Input value={light} onChange={(e) => setLight(e.target.value)} />
        </Field>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={busy}
          className={buttonClass("accent", "lg", "w-full")}
          onClick={() => openCameraKit(mode, (image) => void send(image, true))}
        >
          <Icon name="camera" size={18} />
          {busy ? "Scoring…" : "Scan with Camera Kit"}
        </button>
        <label className={buttonClass("secondary", "lg", "w-full cursor-pointer")}>
          <Icon name="upload" size={18} />
          Upload a photo
          <input
            className="hidden"
            type="file"
            accept="image/*"
            capture="user"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void send(file, false);
            }}
          />
        </label>
      </div>
      {busy ? (
        <div className="flex items-center gap-2 text-sm text-quiet" aria-live="polite">
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-clay" />
          Sending to YouCam Skin Analysis…
        </div>
      ) : null}
      {purpose === "noise" ? (
        <div className="rounded-2xl border border-line bg-paper/60 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-quiet">Back-to-back scans</span>
            <span className="num font-mono font-medium">
              {count} / {target}
            </span>
          </div>
          <div className="mt-3 flex gap-2" aria-hidden="true">
            {Array.from({ length: target }, (_, index) => (
              <span key={index} className={`h-2 flex-1 rounded-full transition ${index < count ? "bg-clay" : "bg-line"}`} />
            ))}
          </div>
        </div>
      ) : null}
      {note ? <Callout kind="info">{note}</Callout> : null}
      {error ? <Callout kind="danger">{error}</Callout> : null}
    </div>
  );
}

async function splitHalves(
  scanId: string,
  face: Blob,
  scores: { concern: string; maskFile: string | null }[],
) {
  const halves: { concern: string; left: number; right: number }[] = [];
  const faceUrl = URL.createObjectURL(face);
  let fraction = 0.5;
  try {
    fraction = await landmarkMidline(faceUrl);
  } catch {
    fraction = 0.5;
  }
  for (const score of scores) {
    if (!score.maskFile) continue;
    const split = await maskHalves(`/api/images/${score.maskFile}`, fraction);
    if (split) halves.push({ concern: score.concern, ...split });
  }
  URL.revokeObjectURL(faceUrl);
  if (halves.length === 0) return;
  await fetch("/api/scan/split", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scanId, halves }),
  });
}

async function landmarkMidline(url: string): Promise<number> {
  const importer = new Function("u", "return import(u)") as (u: string) => Promise<{
    FilesetResolver: { forVisionTasks: (path: string) => Promise<unknown> };
    FaceLandmarker: {
      createFromOptions: (files: unknown, opts: unknown) => Promise<{
        detect: (image: HTMLImageElement) => { faceLandmarks?: { x: number }[][] };
      }>;
    };
  }>;
  const vision = await importer("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm");
  const files = await vision.FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm",
  );
  const landmarker = await vision.FaceLandmarker.createFromOptions(files, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    },
    numFaces: 1,
  });
  const image = await loadImage(url);
  const result = landmarker.detect(image);
  const marks = result.faceLandmarks?.[0];
  if (!marks || marks.length < 455) throw new Error("no face");
  return (marks[234].x + marks[454].x) / 2;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image"));
    image.src = url;
  });
}

async function maskHalves(url: string, fraction: number): Promise<{ left: number; right: number } | null> {
  const image = await loadImage(url).catch(() => null);
  if (!image) return null;
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const cut = Math.round(canvas.width * Math.min(0.8, Math.max(0.2, fraction)));
  let left = 0;
  let leftN = 0;
  let right = 0;
  let rightN = 0;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const lum = data[i] + data[i + 1] + data[i + 2];
      if (lum < 40) continue;
      if (x < cut) {
        left += lum;
        leftN++;
      } else {
        right += lum;
        rightN++;
      }
    }
  }
  if (leftN < 30 || rightN < 30) return null;
  return { left: left / leftN / (255 * 3), right: right / rightN / (255 * 3) };
}

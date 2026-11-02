import { readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { phrase, readProductPhoto } from "@/lib/agent/phrase";
import { guardrail } from "@/lib/agent/linter";
import { json, options, resolveUser } from "@/lib/http";
import { concernFromClaim, intensityForClaim, lookupBarcode } from "@/lib/integrations/outside";
import { readDb, updateDb, type ProductNote } from "@/lib/store/db";
import { buildView } from "@/lib/derive";
import { download, findImageUrl, hashBytes, runTask, simulationKey, uploadImage } from "@/lib/youcam/client";
import { saveImage, scoreImage } from "@/lib/youcam/analyze";
import { YouCamError } from "@/lib/youcam/client";
import { latestFace } from "@/lib/youcam/profile";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

export async function POST(request: Request) {
  const user = await resolveUser(request);
  if (!user?.consentAt) return json({ error: "Consent comes before a product photo." }, 403);
  const form = await request.formData();
  const typed = String(form.get("claim") ?? "").trim();
  const barcode = String(form.get("barcode") ?? "").trim();
  const photo = form.get("photo");
  let name = String(form.get("name") ?? "").trim();
  let claimText = typed;
  let concern = String(form.get("concern") ?? "").trim();
  let source = claimText ? "typed" : "";

  if (barcode) {
    const listed = await lookupBarcode(barcode);
    if (listed) {
      name = name || listed.name;
      source = source || "open-beauty-facts";
      if (!claimText && listed.ingredients) claimText = `${listed.name}. Ingredients include ${listed.ingredients.slice(0, 280)}`;
    }
  }
  if (photo instanceof File && photo.size > 0) {
    const bytes = Buffer.from(await photo.arrayBuffer());
    const read = await readProductPhoto(bytes, photo.type || "image/jpeg");
    if (read) {
      name = name || read.name;
      claimText = claimText || read.claimText;
      concern = concern || read.concern;
      source = "packaging";
    }
  }
  if (!claimText) {
    return json({ error: "Type the claim, scan a barcode that Open Beauty Facts lists, or add an API key so the pack photo can be read." }, 400);
  }
  concern = concern || concernFromClaim(claimText);
  const simKey = simulationKey(concern);
  const db = await readDb();
  const view = buildView(db, user);
  const floor = view.noise.find((item) => item.concern === concern) ?? view.noise[0] ?? null;
  const face = latestFace(db, user.id);
  if (!face?.imageFile) {
    return json({ error: "Add a face photo on Shop & try on, or take a scan, before checking a claim." }, 400);
  }
  const original = db.scores.find((score) => score.scanId === face.id && score.concern === (floor?.concern ?? concern));
  if (!original) return json({ error: "This face photo has no score for that concern. Upload it again from Shop so WorthIt can measure it." }, 400);

  const intensity = intensityForClaim(claimText);
  let measuredDelta: number | null = null;
  let renderFile: string | null = null;
  let error: string | null = null;
  if (!simKey) {
    error = "That concern has no Skin Simulation control. The claim is stored, and the render was not run.";
  } else {
    try {
      const faceBytes = await readFile(path.join(process.cwd(), ".data", "images", face.imageFile));
      const uploaded = await uploadImage(faceBytes, "image/jpeg", face.imageFile);
      const simulated = await runTask({
        endpoint: "/s2s/v2.0/task/skin-simulation",
        imageHash: hashBytes(faceBytes) + simKey + intensity,
        body: { src_file_id: uploaded.fileId, [simKey]: intensity },
      });
      const renderUrl = findImageUrl(simulated.raw);
      if (!renderUrl) throw new Error("Skin Simulation finished without an image.");
      const renderBytes = await download(renderUrl);
      renderFile = await saveImage(`render-${randomUUID()}`, renderBytes);
      const scored = await scoreImage(renderBytes, "image/jpeg", face.mode);
      const after = scored.scores.find((score: { concern: string; raw: number }) => score.concern === original.concern);
      if (!after) throw new Error("The render could be scored, but not for the claimed concern.");
      measuredDelta = after.raw - original.raw;
    } catch (err) {
      error = err instanceof YouCamError ? err.message : err instanceof Error ? err.message : "Claim render failed.";
    }
  }

  const mdc = floor?.mdc95 ?? null;
  const decision = measuredDelta == null || mdc == null ? "unmeasured" : measuredDelta < mdc ? "skip" : "test";
  const moved = measuredDelta == null ? "" : `${measuredDelta >= 0 ? "+" : ""}${measuredDelta.toFixed(1)}`;
  const fallback =
    measuredDelta == null
      ? "The claim could not be re-measured on your face. No SKIP or TEST IT until it can."
      : mdc == null
        ? `The render moved ${original.concern} by ${moved} raw points. SKIP or TEST IT waits until five baseline scans measure your normal wobble.`
        : decision === "skip"
          ? `Even if this is true, you couldn't see it. The render moved ${original.concern} by ${moved} raw points. Your noise is ${mdc.toFixed(1)}.`
          : `The render moved ${original.concern} by ${moved} raw points, past your noise of ${mdc.toFixed(1)}. Worth a personal test. Not a result.`;
  const spoken = await phrase(
    "claim",
    `Claim: ${claimText}\nConcern: ${original.concern}\nRequested simulation intensity: ${intensity}\nMeasured raw change: ${measuredDelta}\nNoise MDC95: ${mdc}\nDecision: ${decision}`,
    fallback,
  );
  const note: ProductNote = {
    id: randomUUID(),
    userId: user.id,
    createdAt: new Date().toISOString(),
    name: name || "Product",
    claimText,
    concern: original.concern,
    barcode: barcode || null,
    requestedIntensity: simKey ? intensity : null,
    measuredDelta,
    mdc,
    decision,
    renderFile,
  };
  await updateDb((draft) => {
    draft.products.push(note);
  });
  return json({ note, line: guardrail(spoken.text), model: spoken.model, source, error });
}

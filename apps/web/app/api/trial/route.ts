import { randomUUID } from "crypto";
import { phrase } from "@/lib/agent/phrase";
import { buildView, trialDayNumber, dayOf } from "@/lib/derive";
import { json, options, resolveDevice, resolveUser } from "@/lib/http";
import { geocode, humidityAt } from "@/lib/integrations/outside";
import { readDb, updateDb, type Trial } from "@/lib/store/db";

export function OPTIONS() {
  return options();
}

export async function POST(request: Request) {
  const user = await resolveUser(request);
  if (!user?.consentAt) return json({ error: "Consent comes before a protocol." }, 403);
  const body = (await request.json()) as {
    productName?: string;
    active?: string;
    concern?: string;
    design?: "split_face" | "before_after";
    startedOn?: string;
  };
  const productName = body.productName?.trim();
  const active = body.active?.trim() || "a leave-on active";
  if (!productName) return json({ error: "Name the product." }, 400);
  const concern = body.concern || "acne";
  const design = body.design === "before_after" ? "before_after" : "split_face";
  const trial: Trial = {
    id: randomUUID(),
    userId: user.id,
    productName,
    active,
    concern,
    design,
    startedOn: body.startedOn || dayOf(new Date().toISOString(), user.tzOffsetMinutes),
    claimText: null,
    claimDelta: null,
    createdAt: new Date().toISOString(),
  };
  await updateDb((db) => {
    db.trials.push(trial);
  });
  const db = await readDb();
  const view = buildView(db, user);
  const fallback = [
    `You bought ${productName}. This is a personal test.`,
    design === "split_face"
      ? `Use ${active} on one side of your face only. Sleep and weather hit both sides, so they fall out of the left-minus-right difference.`
      : `Scan for a few mornings before you start ${active}, then keep going. Without a before, the effect is not identified.`,
    "Same light. Same time. Do not read a result before the earliest honest day, and that day does not exist until the noise floor is measured.",
    "If the mask cannot be split, the one-side advantage stays a simulation from your noise.",
  ].join(" ");
  const spoken = await phrase(
    "protocol",
    `Product: ${productName}\nActive: ${active}\nDesign: ${design}\nConcern: ${concern}\nNoise ready: ${Boolean(view.noise.length)}`,
    fallback,
  );
  return json({ trial, protocol: spoken.text, model: spoken.model });
}

/** The watch's summary. No pairing: see resolveDevice. */
export async function GET(request: Request) {
  const user = await resolveDevice(request);
  if (!user) return json({ error: "No WorthIt account yet. Open the web app and agree to the consent screen first." }, 401);
  const db = await readDb();
  const view = buildView(db, user);
  const today = dayOf(new Date().toISOString(), user.tzOffsetMinutes);
  return json({
    line: view.verdict?.line ?? "No verdict yet.",
    kind: view.verdict?.kind ?? "unidentified",
    trialDay: trialDayNumber(view.trial, today),
    faceTouches: view.faceTouchesToday,
    checkoffs: view.checkoffs,
    phrase: "Same light. Same time.",
  });
}

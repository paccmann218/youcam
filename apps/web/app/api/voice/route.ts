import { randomUUID } from "crypto";
import { dayOf, trialDayNumber } from "@/lib/derive";
import { json, options, resolveDevice } from "@/lib/http";
import { emitEvent, readDb, updateDb, type ProofEvent, type Trial } from "@/lib/store/db";
import {
  LAST_PRODUCT,
  concernFor,
  ingredientFrom,
  knownProduct,
  productFrom,
  sameProduct,
  spokenStart,
  startOffset,
} from "@/lib/voice/product-log";
import { sarvamConfigured, speak, transcribe } from "@/lib/voice/sarvam";

export const runtime = "nodejs";

type Step = "start" | "product" | "ingredient" | "when" | "done";

type Reply = {
  next: Step;
  say: string;
  /** What is read aloud when it differs from the words on screen. */
  spoken?: string;
  heard?: string;
  product?: string;
  ingredient?: string;
  trialDay?: number | null;
};

export function OPTIONS() {
  return options();
}

/**
 * The watch's spoken product log. Each turn the watch sends the step it is on, the clip it
 * recorded and what it already knows; the laptop transcribes with Sarvam and answers in speech.
 *   start      -> "Which product did you use? Last time you used Minimalist moisturizer."
 *   product    -> "Which ingredient is in it?"
 *   ingredient -> saves when a start day was said too, otherwise asks when
 *   when       -> saves the test and tonight's use
 */
export async function POST(request: Request) {
  const user = await resolveDevice(request);
  if (!user) return json({ error: "No WorthIt account yet. Open the web app and agree to the consent screen first." }, 401);
  if (!sarvamConfigured()) return json({ error: "Add SARVAM_API_KEY to the laptop's .env.local." }, 503);

  const form = await request.formData().catch(() => null);
  const field = (name: string) => {
    const value = form?.get(name);
    return typeof value === "string" ? value.trim() : "";
  };
  const step = (field("step") || "start") as Step;
  let product = field("product");
  let ingredient = field("ingredient");

  let heard = field("text");
  const audio = form?.get("audio");
  if (!heard && audio instanceof Blob && audio.size > 2000) {
    try {
      heard = await transcribe(audio);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Could not transcribe." }, 502);
    }
  }

  const now = new Date();
  const today = dayOf(now.toISOString(), user.tzOffsetMinutes);
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  let reply: Reply;

  if (step === "start") {
    reply = { next: "product", say: `Yes, tell me which product you used. Last time you used ${LAST_PRODUCT}.` };
  } else if (step === "product") {
    const said = productFrom(heard);
    if (!said) {
      reply = { next: "product", say: "Sorry, I did not catch that. Which product did you use?", heard };
    } else {
      product = said;
      const known = knownProduct(product);
      reply = {
        next: "ingredient",
        say: `Got it, ${product}. What is the main ingredient in it?`,
        spoken: known ? `Got it, ${known.spoken}. What is the main ingredient in it?` : undefined,
        heard,
        product,
      };
    }
  } else if (step === "ingredient" || step === "when") {
    const known = knownProduct(product);
    if (step === "ingredient") ingredient = (heard && known ? known.ingredient : ingredientFrom(heard)) ?? "";
    const offset = startOffset(heard, weekday);
    if (!ingredient) {
      reply = { next: "ingredient", say: "Sorry, which ingredient was that?", heard, product };
    } else if (offset === null && step === "ingredient") {
      reply = {
        next: "when",
        say: `Got it, ${ingredient}. And when did you start using it?`,
        spoken: known ? `Got it, ${known.spokenIngredient}. And when did you start using it?` : undefined,
        heard,
        product,
        ingredient,
      };
    } else {
      reply = { ...(await save(user, product || LAST_PRODUCT, ingredient, offset ?? 0, now, today)), heard };
    }
  } else {
    return json({ error: "Unknown step." }, 400);
  }

  let speech: string | null = null;
  try {
    speech = (await speak(reply.spoken ?? reply.say)).toString("base64");
  } catch {
    /* the watch still shows the words */
  }
  return json({ ...reply, audio: speech });
}

async function save(
  user: { id: string; tzOffsetMinutes: number },
  product: string,
  ingredient: string,
  offset: number,
  now: Date,
  today: string,
): Promise<Reply> {
  const startedOn = new Date(Date.parse(`${today}T00:00:00Z`) - offset * 86_400_000).toISOString().slice(0, 10);
  const db = await readDb();
  const current = [...db.trials].reverse().find((trial) => trial.userId === user.id) ?? null;
  const continuing = current && sameProduct(current.productName, product) ? current : null;
  const trial: Trial = continuing ?? {
    id: randomUUID(),
    userId: user.id,
    productName: product,
    active: ingredient,
    concern: concernFor(ingredient, product),
    design: "before_after",
    startedOn,
    claimText: null,
    claimDelta: null,
    createdAt: now.toISOString(),
  };
  const event: ProofEvent = {
    id: randomUUID(),
    userId: user.id,
    createdAt: now.toISOString(),
    type: "checkoff",
    payload: { slot: "evening", source: "voice", product, ingredient },
  };
  await updateDb((data) => {
    if (!continuing) data.trials.push(trial);
    data.events.push(event);
  });
  emitEvent(event);

  const day = trialDayNumber(trial, today);
  const known = knownProduct(product);
  const line = (name: string, active: string) =>
    continuing
      ? `Logged tonight's ${name}. That is day ${day ?? 1} of your test.`
      : `Done. I am tracking ${name} with ${active}, ${spokenStart(offset)}. Tonight's use is logged.`;
  return {
    next: "done",
    say: line(product, ingredient),
    spoken: known ? line(known.spoken, known.spokenIngredient) : undefined,
    product,
    ingredient,
    trialDay: day,
  };
}

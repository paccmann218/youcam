import { guardrail, lintClaim } from "./linter";

export type AgentName = "breakout" | "claim" | "protocol";

const SYSTEMS: Record<AgentName, string> = {
  breakout: `You write one or two sentences for a personal skincare test called WorthIt.
Use only the numbers in the user message. Do not add causes that are not listed.
Never diagnose, treat, cure, guarantee, or call this a clinical trial.
Say "personal test". If a confounder outranks the product, say the serum is unlikely to be the cause and name that confounder.
Higher YouCam raw_score means healthier-looking skin. A drop means that concern looks worse.`,
  claim: `You write one sentence about a brand claim that was rendered and re-measured.
Use only the measured raw-score change and the person's noise floor.
Never diagnose, treat, cure, guarantee, or call this a clinical trial.
If the measured change is smaller than the noise, say they could not see it even if the picture is true.
If it is larger, say it is large enough to be worth a personal test. Do not say the product works.`,
  protocol: `You write a short personal-test protocol.
For a single leave-on active, the default is one side of the face, because the left-minus-right difference cancels sleep and weather.
Never diagnose, treat, cure, guarantee, or call this a clinical trial. Call it a personal test.
Mention scanning in the same light, at the same time, and not reading a result before the earliest honest day.`,
};

export async function phrase(agent: AgentName, facts: string, fallback: string): Promise<{ text: string; model: boolean }> {
  const key = process.env.ANTHROPIC_API_KEY;
  const safeFallback = guardrail(fallback);
  if (!key) return { text: safeFallback, model: false };
  const model =
    agent === "claim"
      ? process.env.ANTHROPIC_FAST_MODEL || "claude-sonnet-5-5"
      : process.env.ANTHROPIC_AGENT_MODEL || "claude-opus-5-5";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 280,
        system: SYSTEMS[agent],
        messages: [{ role: "user", content: facts }],
      }),
    });
    if (!res.ok) return { text: safeFallback, model: false };
    const json = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = json.content?.find((block) => block.type === "text")?.text?.trim();
    if (!text) return { text: safeFallback, model: false };
    const lint = lintClaim(text);
    if (!lint.ok) return { text: safeFallback, model: true };
    return { text, model: true };
  } catch {
    return { text: safeFallback, model: false };
  }
}

export async function readProductPhoto(bytes: Buffer, mediaType: string): Promise<{
  name: string;
  claimText: string;
  concern: string;
  actives: string;
} | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.ANTHROPIC_FAST_MODEL || "claude-sonnet-5-5";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      system:
        "Extract product packaging into JSON with keys name, claimText, concern, actives. concern is one of acne, pore, redness, texture, wrinkle, radiance, spots, oiliness, dark_circle. claimText is the sentence on the pack, verbatim. No medical advice.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: bytes.toString("base64") },
            },
            { type: "text", text: "Read this product. Reply with JSON only." },
          ],
        },
      ],
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = json.content?.find((block) => block.type === "text")?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as { name?: string; claimText?: string; concern?: string; actives?: string };
    if (!parsed.claimText) return null;
    return {
      name: parsed.name || "Unlabeled product",
      claimText: parsed.claimText,
      concern: parsed.concern || "texture",
      actives: parsed.actives || "",
    };
  } catch {
    return null;
  }
}

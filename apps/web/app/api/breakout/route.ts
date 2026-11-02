import { phrase } from "@/lib/agent/phrase";
import { buildView } from "@/lib/derive";
import { json, options, resolveUser } from "@/lib/http";
import { readDb } from "@/lib/store/db";

export function OPTIONS() {
  return options();
}

export async function POST(request: Request) {
  const user = await resolveUser(request);
  if (!user) return json({ error: "Pair this browser first." }, 401);
  const db = await readDb();
  const view = buildView(db, user);
  if (!view.attribution) {
    return json({
      line: "Acne is not past your noise on the latest morning. There is nothing to rank.",
      attribution: null,
    });
  }
  const facts = [
    view.attribution.line,
    `Model ready: ${view.attribution.modelReady}`,
    ...view.attribution.ranked.map((item) => `${item.name} pull ${item.pull.toFixed(2)} unusual ${item.unusual.toFixed(2)}`),
  ].join("\n");
  const spoken = await phrase("breakout", facts, view.attribution.line);
  return json({ line: spoken.text, model: spoken.model, attribution: view.attribution });
}

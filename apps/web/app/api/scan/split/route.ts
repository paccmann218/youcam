import { json, options, resolveUser } from "@/lib/http";
import { updateDb } from "@/lib/store/db";

export function OPTIONS() {
  return options();
}

export async function POST(request: Request) {
  const user = await resolveUser(request);
  if (!user) return json({ error: "Pair this browser first." }, 401);
  const body = (await request.json()) as {
    scanId?: string;
    halves?: { concern: string; left: number; right: number }[];
  };
  if (!body.scanId || !body.halves?.length) return json({ error: "Missing halves." }, 400);
  await updateDb((db) => {
    for (const half of body.halves ?? []) {
      const score = db.scores.find(
        (item) => item.scanId === body.scanId && item.userId === user.id && item.concern === half.concern,
      );
      if (!score) continue;
      if (half.left == null || half.right == null) continue;
      score.left = half.left;
      score.right = half.right;
    }
  });
  return json({ ok: true });
}

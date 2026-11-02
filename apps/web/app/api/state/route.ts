import { buildView } from "@/lib/derive";
import { json, options, resolveUser } from "@/lib/http";
import { publicStatus, readDb } from "@/lib/store/db";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

export async function GET(request: Request) {
  const user = await resolveUser(request);
  if (!user) return json({ user: null, status: publicStatus() });
  const db = await readDb();
  return json({ view: buildView(db, user), status: publicStatus() });
}

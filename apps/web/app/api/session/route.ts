import { cookies } from "next/headers";
import { ensureUser, json, options, userFromCookie } from "@/lib/http";
import { updateDb } from "@/lib/store/db";

export function OPTIONS() {
  return options();
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { tzOffsetMinutes?: number; consent?: boolean };
  const jar = await cookies();
  let id = jar.get("proof_uid")?.value;
  if (!id) {
    id = crypto.randomUUID();
    jar.set("proof_uid", id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 400 });
  }
  await ensureUser(id);
  const user = await updateDb((db) => {
    const found = db.users.find((item) => item.id === id);
    if (!found) throw new Error("missing user");
    if (typeof body.tzOffsetMinutes === "number") found.tzOffsetMinutes = body.tzOffsetMinutes;
    if (body.consent && !found.consentAt) found.consentAt = new Date().toISOString();
    return found;
  });
  return json({ user });
}

export async function GET() {
  const user = await userFromCookie();
  return json({ user });
}

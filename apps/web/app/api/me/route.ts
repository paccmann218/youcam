import { json, options, resolveUser } from "@/lib/http";
import { deleteUserEverywhere } from "@/lib/store/db";
import { cookies } from "next/headers";

export function OPTIONS() {
  return options();
}

export async function DELETE(request: Request) {
  const user = await resolveUser(request);
  if (!user) return json({ error: "Nothing to delete." }, 404);
  await deleteUserEverywhere(user.id);
  const jar = await cookies();
  jar.set("proof_uid", "", { httpOnly: true, path: "/", maxAge: 0 });
  return json({ deleted: true });
}

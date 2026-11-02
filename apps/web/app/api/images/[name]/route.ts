import { readFile } from "fs/promises";
import path from "path";

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  if (!/^[\w.-]+$/.test(name)) return new Response("Bad name", { status: 400 });
  try {
    const bytes = await readFile(path.join(process.cwd(), ".data", "images", name));
    const type = name.endsWith(".png") ? "image/png" : "image/jpeg";
    return new Response(bytes, {
      headers: { "Content-Type": type, "Cache-Control": "private, max-age=86400" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

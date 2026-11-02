import { options, resolveUser } from "@/lib/http";
import { subscribe } from "@/lib/store/db";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

export async function GET(request: Request) {
  const user = await resolveUser(request);
  if (!user) return new Response("pair first", { status: 401 });
  let unsubscribe = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: unknown) => {
        if (!event || (event as { userId?: string }).userId !== user.id) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      unsubscribe = subscribe(send);
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "hello" })}\n\n`));
    },
    cancel() {
      unsubscribe();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

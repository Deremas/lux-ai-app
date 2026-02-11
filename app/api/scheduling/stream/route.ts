import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const limit = await applyRateLimit(req, RATE_LIMIT_RULES.scheduling);
  if (!limit.ok) {
    return new Response("Too many requests", {
      status: 429,
      headers: limit.headers,
    });
  }

  let interval: ReturnType<typeof setInterval> | null = null;
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (payload: string) => {
        controller.enqueue(encoder.encode(payload));
      };

      send(`event: ping\ndata: ${Date.now()}\n\n`);
      interval = setInterval(() => {
        send(`event: ping\ndata: ${Date.now()}\n\n`);
      }, 15000);
    },
    cancel() {
      if (interval) clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}

// Streams public counts only. Timers stop on disconnect and queries never
// overlap. A short lifetime allows serverless instances to close cleanly;
// EventSource reconnects automatically without reloading the document.
export function createContributionStream(request: Request, initialCount: number, loadCount: () => Promise<number>): Response {
  const encoder = new TextEncoder();
  let stop: (cancelled?: boolean) => void = () => {};
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let previous = initialCount;
      let pollTimer: ReturnType<typeof setTimeout> | undefined;
      const deadline = setTimeout(() => stop(), 50_000);
      const close = (cancelled = false) => {
        if (closed) return;
        closed = true;
        clearTimeout(deadline);
        clearTimeout(pollTimer);
        request.signal.removeEventListener("abort", onAbort);
        if (!cancelled) controller.close();
      };
      const onAbort = () => close();
      stop = close;
      const send = (count: number) => controller.enqueue(encoder.encode(`data: ${JSON.stringify({ count })}\n\n`));
      const poll = async () => {
        try {
          const count = await loadCount();
          if (closed) return;
          if (count !== previous) { send(count); previous = count; }
          else controller.enqueue(encoder.encode(": keep-alive\n\n"));
          pollTimer = setTimeout(() => { void poll(); }, 3_000);
        } catch {
          close();
        }
      };
      request.signal.addEventListener("abort", onAbort, { once: true });
      if (request.signal.aborted) { close(); return; }
      controller.enqueue(encoder.encode("retry: 3000\n\n"));
      send(initialCount);
      pollTimer = setTimeout(() => { void poll(); }, 3_000);
    },
    cancel() { stop(true); },
  });
  return new Response(body, { headers: {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-store, no-transform",
    "X-Accel-Buffering": "no",
  } });
}

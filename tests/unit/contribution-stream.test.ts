// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createContributionStream } from "@/lib/contribution-stream";

const decoder = new TextDecoder();
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

async function open(count: number, load: () => Promise<number>) {
  const abort = new AbortController();
  const response = createContributionStream(new Request("https://example.com/events", { signal: abort.signal }), count, load);
  const reader = response.body!.getReader();
  expect(decoder.decode((await reader.read()).value)).toBe("retry: 3000\n\n");
  expect(decoder.decode((await reader.read()).value)).toBe(`data: ${JSON.stringify({ count })}\n\n`);
  return { abort, response, reader };
}

describe("public confirmed-contribution stream", () => {
  it("sends 0→1→2 only when authoritative counts change, with no donor or payment details", async () => {
    const load = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const { reader, response } = await open(0, load);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(response.headers.get("cache-control")).toContain("no-store");
    for (const expected of ['data: {"count":1}\n\n', ': keep-alive\n\n', 'data: {"count":2}\n\n']) {
      await vi.advanceTimersByTimeAsync(3000);
      expect(decoder.decode((await reader.read()).value)).toBe(expected);
    }
    await reader.cancel();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not overlap a slow count query, and disconnecting stops future work", async () => {
    let resolve!: (value: number) => void;
    const load = vi.fn().mockReturnValue(new Promise<number>(done => { resolve = done; }));
    const { reader, abort } = await open(0, load);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(load).toHaveBeenCalledTimes(1);
    abort.abort();
    resolve(1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(load).toHaveBeenCalledTimes(1);
    expect((await reader.read()).done).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("closes on a database failure without sending zero or private diagnostics", async () => {
    const { reader } = await open(5, vi.fn().mockRejectedValue(new Error("private database diagnostic")));
    await vi.advanceTimersByTimeAsync(3000);
    expect((await reader.read()).done).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("ends the stream before the serverless duration limit and clears all timers", async () => {
    const { reader } = await open(0, vi.fn().mockResolvedValue(0));
    await vi.advanceTimersByTimeAsync(50_000);
    expect(vi.getTimerCount()).toBe(0);
    while (!(await reader.read()).done) { /* Drain keep-alive comments. */ }
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/lib/meta/client", () => ({ metaCheckoutFetch: mocks.fetch }));
import { requestHostedCheckout } from "@/lib/stripe/hosted-checkout-client";

beforeEach(() => { vi.useFakeTimers(); mocks.fetch.mockReset(); });
afterEach(() => { vi.useRealTimers(); });
const deadline = { timeoutMs: 1000, message: "Unit timeout" };

describe("bounded hosted checkout requests", () => {
  it("clears the timer after receiving the complete response", async () => {
    mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ url: "https://checkout.stripe.com/unit" })));
    const result = await requestHostedCheckout({ campaignId: "unit" }, deadline);
    expect(result.data.url).toBe("https://checkout.stripe.com/unit");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("recovers even when a pending fetch ignores abort", async () => {
    mocks.fetch.mockReturnValue(new Promise<Response>(() => {}));
    const result = requestHostedCheckout({}, deadline);
    const assertion = expect(result).rejects.toMatchObject({ name: "HostedCheckoutTimeoutError", message: "Unit timeout" });
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    expect(mocks.fetch.mock.calls[0][1].signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("also bounds response-body loading instead of stopping the deadline at headers", async () => {
    mocks.fetch.mockResolvedValue({ json: () => new Promise(() => {}) });
    const result = requestHostedCheckout({}, deadline);
    const assertion = expect(result).rejects.toThrow("Unit timeout");
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });

  it("does not replace a network failure with a later timeout", async () => {
    mocks.fetch.mockRejectedValue(new TypeError("Unit network failure"));
    await expect(requestHostedCheckout({}, deadline)).rejects.toThrow("Unit network failure");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("leaves unaffected callers without an artificial deadline", async () => {
    mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ error: "Unit response" }), { status: 400 }));
    expect((await requestHostedCheckout({})).response.status).toBe(400);
    expect(mocks.fetch.mock.calls[0][1].signal).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("turns a non-JSON gateway error into the supplied user-facing message and clears the timer", async () => {
    mocks.fetch.mockResolvedValue(new Response("Gateway error", { status: 504 }));
    await expect(requestHostedCheckout({}, { ...deadline, responseErrorMessage: "Unit checkout unavailable" })).rejects.toThrow("Unit checkout unavailable");
    expect(vi.getTimerCount()).toBe(0);
  });
});

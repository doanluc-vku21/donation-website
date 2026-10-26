import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const loader = vi.hoisted(() => ({ loadStripe: vi.fn(() => Promise.resolve({})) }));
vi.mock("@stripe/stripe-js/pure", () => ({ loadStripe: loader.loadStripe }));
vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_singleton_unit_only");
afterAll(() => { vi.unstubAllEnvs(); });
beforeEach(() => { vi.resetModules(); loader.loadStripe.mockReset().mockResolvedValue({}); });

describe("shared browser Stripe controller", () => {
  it("does not load Stripe merely because card and wallet modules are imported", async () => {
    await Promise.all([
      import("@/components/donation/donation-payment"),
      import("@/components/donation/donation-express-checkout"),
    ]);
    expect(loader.loadStripe).not.toHaveBeenCalled();
    const { getStripePromise } = await import("@/lib/stripe/client");
    const first = getStripePromise();
    expect(getStripePromise()).toBe(first);
    expect(loader.loadStripe).toHaveBeenCalledOnce();
    expect(loader.loadStripe).toHaveBeenCalledWith("pk_test_singleton_unit_only");
  });
  it("shares the speculative prewarm with the mounted payment provider", async () => {
    const { prepareStripe, getStripePromise } = await import("@/lib/stripe/client");
    prepareStripe(); await getStripePromise();
    expect(loader.loadStripe).toHaveBeenCalledOnce();
  });
  it("allows checkout to retry a failed speculative SDK load", async () => {
    loader.loadStripe.mockRejectedValueOnce(new Error("temporary network failure")).mockResolvedValue({});
    const { prepareStripe, getStripePromise } = await import("@/lib/stripe/client");
    prepareStripe();
    await vi.waitFor(() => { expect(loader.loadStripe).toHaveBeenCalledOnce(); });
    await getStripePromise();
    expect(loader.loadStripe).toHaveBeenCalledTimes(2);
  });
});

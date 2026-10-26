import { afterAll, describe, expect, it, vi } from "vitest";

const loader = vi.hoisted(() => ({ loadStripe: vi.fn(() => Promise.resolve({})) }));
vi.mock("@stripe/stripe-js", () => ({ loadStripe: loader.loadStripe }));
vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_singleton_unit_only");
afterAll(() => { vi.unstubAllEnvs(); });

describe("shared browser Stripe controller", () => {
  it("creates one Stripe instance when both card and wallet checkout modules load", async () => {
    await Promise.all([
      import("@/components/donation/donation-payment"),
      import("@/components/donation/donation-express-checkout"),
    ]);
    expect(loader.loadStripe).toHaveBeenCalledOnce();
    expect(loader.loadStripe).toHaveBeenCalledWith("pk_test_singleton_unit_only");
  });
});

import { afterEach, expect, it, vi } from "vitest";
import { applePayBootstrapScript } from "@/lib/stripe/apple-pay-bootstrap";

afterEach(() => {
  document.querySelectorAll('script[src^="https://js.stripe.com/"]').forEach((script) => script.remove());
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("lets the real pure loader reuse the bootstrap script and initialize one controller", async () => {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (iPhone)");
  // jsdom does not fetch this script. Complete its load with an inert vendor
  // factory, so the actual package's script discovery is exercised offline.
  new Function(applePayBootstrapScript)();
  const script = document.querySelector<HTMLScriptElement>('script[src^="https://js.stripe.com/"]')!;
  expect(script).not.toBeNull();
  const { loadStripe } = await import("@stripe/stripe-js/pure");
  const controller = {};
  const factory = vi.fn(() => controller);
  const promise = loadStripe("pk_test_bootstrap_unit_only");
  vi.stubGlobal("Stripe", factory);
  script.dispatchEvent(new Event("load"));
  expect(await promise).toBe(controller);
  expect(factory).toHaveBeenCalledOnce();
  expect(document.querySelectorAll('script[src^="https://js.stripe.com/"]')).toHaveLength(1);
  expect(document.querySelector('script[src^="https://js.stripe.com/"]')).toBe(script);
});

// @vitest-environment node
import { describe, expect, it } from "vitest";
import { shouldDeferCheckoutWarmup } from "@/lib/stripe/checkout-warmup";

function navigatorWith(connection?: { saveData?: boolean; effectiveType?: string }) {
  return { connection } as unknown as Navigator;
}

describe("shouldDeferCheckoutWarmup", () => {
  it("keeps the background warm-up on fast connections", () => {
    expect(shouldDeferCheckoutWarmup(navigatorWith({ effectiveType: "4g" }))).toBe(false);
  });

  it("skips the warm-up when the browser reports a missing network hint", () => {
    expect(shouldDeferCheckoutWarmup(navigatorWith(undefined))).toBe(false);
  });

  it("skips data-saver visitors", () => {
    expect(shouldDeferCheckoutWarmup(navigatorWith({ saveData: true, effectiveType: "4g" }))).toBe(true);
  });

  it.each(["slow-2g", "2g", "3g"])("skips %s visitors", (effectiveType) => {
    expect(shouldDeferCheckoutWarmup(navigatorWith({ effectiveType }))).toBe(true);
  });
});

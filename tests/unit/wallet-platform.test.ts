import { afterEach, describe, expect, it, vi } from "vitest";
import { getWalletPlatform, shouldPrewarmApplePay } from "@/lib/stripe/wallet-platform";

afterEach(() => { vi.unstubAllGlobals(); });

describe("payment warm-up platform selection", () => {
  it.each([
    [{ userAgent: "Mozilla/5.0 (iPhone)", platform: "iPhone", maxTouchPoints: 5 }, "ios"],
    [{ userAgent: "Mozilla/5.0 (Macintosh) Safari", platform: "MacIntel", maxTouchPoints: 5 }, "ios"],
    [{ userAgent: "Mozilla/5.0 (Linux; Android 14)", platform: "Linux armv8l", maxTouchPoints: 5 }, "android"],
    [{ userAgent: "Mozilla/5.0 (Macintosh) Safari", platform: "MacIntel", maxTouchPoints: 0 }, "desktop"],
  ] as const)("classifies %j as %s", (device, platform) => {
    expect(getWalletPlatform(device)).toBe(platform);
  });

  it("does not prewarm Google Pay or attempt a wallet during server rendering", () => {
    vi.stubGlobal("navigator", undefined);
    expect(getWalletPlatform()).toBe("desktop");
    expect(shouldPrewarmApplePay()).toBe(false);
  });
});

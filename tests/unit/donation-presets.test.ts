import { describe, expect, it } from "vitest";
import { withTwentyFiveDollarPresets } from "@/lib/donation-presets";
import { getDonationPageMinimumUsdCents } from "@/lib/donation-page-policy";
import type { DonationOption } from "@/lib/sample-data";

describe("requested $25 preset buttons", () => {
  it("replaces $20, preserves frequency and avoids duplicate $25 buttons without mutating CMS data", () => {
    const options: DonationOption[] = [
      { amountUsd: 2000, frequency: "monthly", impactText: "Monthly" },
      { amountUsd: 2500, frequency: "monthly", impactText: "Duplicate" },
      { amountUsd: 2000, frequency: "one_time", impactText: "Single" },
      { amountUsd: 5000, frequency: "monthly", featured: true, impactText: "Recommended" },
    ];
    const result = withTwentyFiveDollarPresets(options);
    expect(result.map(option => [option.frequency, option.amountUsd])).toEqual([["monthly", 2500], ["one_time", 2500], ["monthly", 5000]]);
    expect(options[0].amountUsd).toBe(2000);
    expect(result[2].featured).toBe(true);
  });
  it("keeps the existing custom-amount minimum policy separate from preset choices", () => {
    expect(getDonationPageMinimumUsdCents("/help-mango-seller", "one_time")).toBe(2000);
    expect(getDonationPageMinimumUsdCents("/akram-shake-2", "monthly")).toBe(2000);
    expect(getDonationPageMinimumUsdCents("/akram-shake-2", "one_time")).toBe(2500);
    expect(getDonationPageMinimumUsdCents("/help-street-vendor", "one_time")).toBe(2000);
  });
});

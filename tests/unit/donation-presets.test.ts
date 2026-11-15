import { describe, expect, it } from "vitest";
import { familyFeedingPresets, withTwentyFiveDollarPresets } from "@/lib/donation-presets";
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
  it("keeps the custom-amount minimum at $5 on every entry page", () => {
    expect(getDonationPageMinimumUsdCents("/help-mango-seller", "one_time")).toBe(500);
    expect(getDonationPageMinimumUsdCents("/help-mango-seller-1", "one_time")).toBe(500);
    expect(getDonationPageMinimumUsdCents("/help-mango-seller-1", "monthly")).toBe(500);
    expect(getDonationPageMinimumUsdCents("/akram-shake-2", "monthly")).toBe(500);
    expect(getDonationPageMinimumUsdCents("/akram-shake-2", "one_time")).toBe(500);
    expect(getDonationPageMinimumUsdCents("/help-street-vendor", "one_time")).toBe(500);
    expect(getDonationPageMinimumUsdCents("/help-gaza", "monthly")).toBe(500);
    expect(getDonationPageMinimumUsdCents("/gaza-help", "one_time")).toBe(500);
  });
});

describe("family feeding preset ladder", () => {
  it("offers the six gifts highest-first with their impact copy", () => {
    const presets = familyFeedingPresets("one_time");
    expect(presets.map(option => option.amountUsd)).toEqual([100_000, 50_000, 25_000, 10_000, 5_000, 2_500]);
    expect(presets.map(option => option.impactText)).toEqual([
      "Feeds 5 families for 1 month",
      "Feeds 2 families for 1 month",
      "Feeds a family for 1 month",
      "Feeds a family for 2 weeks",
      "Feeds a family for 1 week",
      "Feeds a family for 3 days",
    ]);
    expect(presets.every(option => option.frequency === "one_time")).toBe(true);
    expect(presets.filter(option => option.featured).map(option => option.amountUsd)).toEqual([5_000]);
  });

  it("rebuilds the same ladder for monthly gifts without sharing object identity", () => {
    const monthly = familyFeedingPresets("monthly");
    const oneTime = familyFeedingPresets("one_time");
    expect(monthly.map(option => option.amountUsd)).toEqual(oneTime.map(option => option.amountUsd));
    expect(monthly.every(option => option.frequency === "monthly")).toBe(true);
    expect(monthly[0]).not.toBe(oneTime[0]);
    monthly[0].amountUsd = 1;
    expect(familyFeedingPresets("monthly")[0].amountUsd).toBe(100_000);
  });
});

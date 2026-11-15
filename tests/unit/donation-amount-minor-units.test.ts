// @vitest-environment node

import { describe, expect, it } from "vitest";
import { getDonationAmounts } from "@/lib/stripe/donation-amount";

describe("getDonationAmounts minor unit scaling", () => {
  it("keeps USD amounts unchanged", () => {
    const usd = getDonationAmounts(2_500, true, 1, "USD");
    expect(usd.feeAmountCents).toBe(103);
    expect(usd.totalAmountCents).toBe(2_603);
    expect(usd.normalizedDonationUsdCents).toBe(2_500);
    expect(usd.normalizedTotalUsdCents).toBe(2_603);
  });

  it("charges zero-decimal currencies in whole units", () => {
    // 3,800 JPY is $25; Stripe receives 3800, not 380000.
    const jpy = getDonationAmounts(3_800, true, 152, "JPY");
    expect(jpy.feeAmountCents).toBe(156);
    expect(jpy.totalAmountCents).toBe(3_956);
    expect(jpy.normalizedDonationUsdCents).toBe(2_500);
    expect(jpy.normalizedFeeUsdCents).toBe(103);
  });

  it("charges three-decimal currencies in thousandths", () => {
    const kwd = getDonationAmounts(2_500, false, 0.307, "KWD");
    expect(kwd.feeAmountCents).toBe(0);
    expect(kwd.totalAmountCents).toBe(2_500);
    expect(kwd.normalizedDonationUsdCents).toBe(814);
  });
});

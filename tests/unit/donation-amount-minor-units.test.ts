// @vitest-environment node

import { describe, expect, it } from "vitest";
import { currencies, getCurrencyChargeStep } from "@/lib/currency";
import { convertUsdMinimumToWholeCurrencyMinor } from "@/lib/money";
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

describe("chargeable totals across every supported currency", () => {
  it.each([1, 0.8, 0.307, 152, 3700, 125])("keeps donations and fees on Stripe's step at rate %s", (rate) => {
    for (const currency of currencies) {
      const step = getCurrencyChargeStep(currency);
      // Start from a realistic amount that already respects the minor unit.
      const minimum = convertUsdMinimumToWholeCurrencyMinor(500, rate, currency);
      for (const amount of [minimum, minimum + 1, Math.round(minimum * 2.37)]) {
        const amounts = getDonationAmounts(amount, true, rate, currency);
        expect(amounts.donationAmountCents % step).toBe(0);
        expect(amounts.feeAmountCents % step).toBe(0);
        expect(amounts.totalAmountCents % step).toBe(0);
        expect(amounts.totalAmountCents).toBe(amounts.donationAmountCents + amounts.feeAmountCents);
      }
    }
  });
});

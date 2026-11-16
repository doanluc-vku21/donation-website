import type { Currency } from "@/lib/currency";
import { normalizeChargeableMinorUnits } from "@/lib/currency";
import { calculateFeeContribution, convertCurrencyMinorToUsd } from "@/lib/money";

// Keep Checkout creation and in-place wallet updates on the same calculation.
// Both the donation and the fee are snapped to Stripe's smallest chargeable
// unit, so the sum stays chargeable for three-decimal and ISK/UGX currencies.
export function getDonationAmounts(amountCents: number, coverFee: boolean, exchangeRate: number, currency: Currency = "USD") {
  const donationAmountCents = normalizeChargeableMinorUnits(amountCents, currency);
  const feeAmountCents = coverFee
    ? normalizeChargeableMinorUnits(calculateFeeContribution(donationAmountCents, exchangeRate, currency), currency)
    : 0;
  const totalAmountCents = donationAmountCents + feeAmountCents;
  const normalizedDonationUsdCents = convertCurrencyMinorToUsd(donationAmountCents, exchangeRate, currency);
  const normalizedFeeUsdCents = coverFee ? convertCurrencyMinorToUsd(feeAmountCents, exchangeRate, currency) : 0;
  return {
    donationAmountCents, feeAmountCents, totalAmountCents, normalizedDonationUsdCents,
    normalizedFeeUsdCents, normalizedTotalUsdCents: normalizedDonationUsdCents + normalizedFeeUsdCents,
  };
}

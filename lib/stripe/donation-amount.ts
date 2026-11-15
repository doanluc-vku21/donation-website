import type { Currency } from "@/lib/currency";
import { calculateFeeContribution, convertCurrencyMinorToUsd } from "@/lib/money";

// Keep Checkout creation and in-place wallet updates on the same calculation.
export function getDonationAmounts(amountCents: number, coverFee: boolean, exchangeRate: number, currency: Currency = "USD") {
  const feeAmountCents = coverFee ? calculateFeeContribution(amountCents, exchangeRate, currency) : 0;
  const totalAmountCents = amountCents + feeAmountCents;
  const normalizedDonationUsdCents = convertCurrencyMinorToUsd(amountCents, exchangeRate, currency);
  const normalizedFeeUsdCents = coverFee ? convertCurrencyMinorToUsd(feeAmountCents, exchangeRate, currency) : 0;
  return {
    feeAmountCents, totalAmountCents, normalizedDonationUsdCents,
    normalizedFeeUsdCents, normalizedTotalUsdCents: normalizedDonationUsdCents + normalizedFeeUsdCents,
  };
}

import { calculateFeeContribution, convertCurrencyMinorToUsd } from "@/lib/money";

// Keep Checkout creation and in-place wallet updates on the same calculation.
export function getDonationAmounts(amountCents: number, coverFee: boolean, exchangeRate: number) {
  const feeAmountCents = coverFee ? calculateFeeContribution(amountCents, exchangeRate) : 0;
  const totalAmountCents = amountCents + feeAmountCents;
  const normalizedDonationUsdCents = convertCurrencyMinorToUsd(amountCents, exchangeRate);
  const normalizedFeeUsdCents = coverFee ? convertCurrencyMinorToUsd(feeAmountCents, exchangeRate) : 0;
  return {
    feeAmountCents, totalAmountCents, normalizedDonationUsdCents,
    normalizedFeeUsdCents, normalizedTotalUsdCents: normalizedDonationUsdCents + normalizedFeeUsdCents,
  };
}

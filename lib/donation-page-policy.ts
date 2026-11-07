import type { DonationFrequency } from "@/lib/sample-data";

export function getDonationPageMinimumUsdCents(pathname: string | null | undefined, frequency: DonationFrequency = "one_time"): number {
  return isStandardUpsellDonationPage(pathname) && frequency === "one_time" ? 2500 : 1000;
}

// The new beneficiary keeps the existing /akram-shake-2 checkout behavior.
export function isStandardUpsellDonationPage(pathname: string | null | undefined): boolean {
  return pathname === "/akram-shake-2" || pathname === "/help-mango-seller";
}

// Keep this policy scoped to public entry pages; campaigns can share their data
// with other pages that still support one-time gifts.
export function isMonthlyOnlyDonationPage(pathname: string | null | undefined): boolean {
  return pathname === "/gaza-food" ||
    pathname === "/gaza-food/donate" ||
    pathname === "/akram-shake-1" ||
    pathname === "/akram-shake-3";
}

export function areDonorNamesOptional(pathname: string | null | undefined, frequency: DonationFrequency): boolean {
  return isStandardUpsellDonationPage(pathname) ||
    (pathname === "/akram-shake-1" && frequency === "monthly");
}

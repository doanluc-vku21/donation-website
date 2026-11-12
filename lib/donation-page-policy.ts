import type { DonationFrequency } from "@/lib/sample-data";

export function getDonationPageMinimumUsdCents(pathname: string | null | undefined, frequency: DonationFrequency = "one_time"): number {
  if (
    pathname === "/help-mango-seller" ||
    pathname === "/help-mango-seller-1" ||
    pathname === "/help-street-vendor" ||
    pathname === "/help-gaza"
  ) {
    return 2000;
  }
  if (isStandardUpsellDonationPage(pathname)) {
    return frequency === "monthly" ? 2000 : 2500;
  }
  return 1000;
}

// The new beneficiary keeps the existing /akram-shake-2 checkout behavior.
export function isStandardUpsellDonationPage(pathname: string | null | undefined): boolean {
  return pathname === "/akram-shake-2" ||
    pathname === "/help-mango-seller" ||
    pathname === "/help-mango-seller-1" ||
    pathname === "/help-street-vendor" ||
    pathname === "/help-gaza";
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

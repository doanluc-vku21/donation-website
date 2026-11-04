import type { DonationFrequency } from "@/lib/sample-data";

export function getDonationPageMinimumUsdCents(pathname: string | null | undefined): number {
  return pathname === "/akram-shake-2" ? 2500 : 1000;
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
  return pathname === "/akram-shake-1" && frequency === "monthly";
}

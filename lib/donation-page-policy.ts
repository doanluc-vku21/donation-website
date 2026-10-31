// Keep this policy scoped to public entry pages; campaigns can share their data
// with other pages that still support one-time gifts.
export function isMonthlyOnlyDonationPage(pathname: string | null | undefined): boolean {
  return pathname === "/gaza-food" ||
    pathname === "/gaza-food/donate" ||
    pathname === "/akram-shake-3";
}

import type { RecentDonation } from "@/lib/sample-data";

// The owner identified this payment as a test and requested that its public
// contribution be hidden from public lists and latest-donation hints.
// Payment records and campaign accounting remain.
const hiddenContributionIds = new Set([
  "838ce591-f138-439c-9258-0f421dff2d4d",
]);

export function getPublicDonations(donations: RecentDonation[]): RecentDonation[] {
  return donations.filter(donation => !hiddenContributionIds.has(donation.id));
}

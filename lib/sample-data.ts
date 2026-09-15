export type DonationFrequency = "one_time" | "monthly";

export type DonationOption = {
  amountUsd: number;
  impactText: string;
  featured?: boolean;
};

export type RecentDonation = {
  id: string;
  displayName: string;
  amountUsd: number;
  frequency: DonationFrequency;
  relativeTime: string;
};

export type Campaign = {
  id: string;
  title: string;
  organizationName: string;
  eyebrow: string;
  summary: string;
  story: string[];
  goalAmountUsd: number;
  raisedAmountUsd: number;
  donorCount: number;
  donationOptions: DonationOption[];
  recentDonations: RecentDonation[];
};

export const sampleCampaign: Campaign = {
  id: "sample-campaign",
  title: "Give a Child a Brighter Tomorrow",
  organizationName: "Open Hands Relief",
  eyebrow: "A future shaped by care",
  summary:
    "A safe place to learn, nutritious meals, and steady support can change the direction of a child's life.",
  story: [
    "Across communities facing hardship, children are often asked to carry burdens far beyond their years. Reliable support gives families room to breathe and helps children stay focused on growing, learning, and dreaming.",
    "Your gift supports locally led programs that prioritize food security, school essentials, safe spaces, and family care. Every contribution becomes part of a consistent circle of support around a child.",
  ],
  goalAmountUsd: 100_000_00,
  raisedAmountUsd: 37_425_00,
  donorCount: 638,
  donationOptions: [
    { amountUsd: 25_00, impactText: "Helps provide nourishing meals" },
    { amountUsd: 50_00, impactText: "Supports school essentials", featured: true },
    { amountUsd: 100_00, impactText: "Strengthens health and learning" },
    { amountUsd: 250_00, impactText: "Extends care to a whole family" },
  ],
  recentDonations: [
    { id: "1", displayName: "Anonymous", amountUsd: 100_00, frequency: "one_time", relativeTime: "4 minutes ago" },
    { id: "2", displayName: "Maya R.", amountUsd: 50_00, frequency: "monthly", relativeTime: "18 minutes ago" },
    { id: "3", displayName: "Anonymous", amountUsd: 25_00, frequency: "one_time", relativeTime: "42 minutes ago" },
  ],
};

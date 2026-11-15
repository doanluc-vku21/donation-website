import type { DonationFrequency, DonationOption } from "@/lib/sample-data";

// Six family-feeding gifts, highest first so the grid reads 1000 / 500 / 250 then 100 / 50 / 25.
const FAMILY_FEEDING_PRESETS: ReadonlyArray<{ amountUsd: number; impactText: string }> = [
  { amountUsd: 100_000, impactText: "Feeds 5 families for 1 month" },
  { amountUsd: 50_000, impactText: "Feeds 2 families for 1 month" },
  { amountUsd: 25_000, impactText: "Feeds a family for 1 month" },
  { amountUsd: 10_000, impactText: "Feeds a family for 2 weeks" },
  { amountUsd: 5_000, impactText: "Feeds a family for 1 week" },
  { amountUsd: 2_500, impactText: "Feeds a family for 3 days" },
];

export function familyFeedingPresets(frequency: DonationFrequency): DonationOption[] {
  return FAMILY_FEEDING_PRESETS.map(({ amountUsd, impactText }) => ({
    amountUsd,
    frequency,
    featured: amountUsd === 5_000,
    impactText,
  }));
}

// Changing preset buttons does not change custom-amount payment validation.
export function withTwentyFiveDollarPresets(options: DonationOption[]): DonationOption[] {
  const seen = new Set<string>();
  return options.map(option => option.amountUsd === 2000 ? { ...option, amountUsd: 2500 } : option)
    .filter(option => {
      const key = `${option.frequency}:${option.amountUsd}`;
      if (option.amountUsd < 2500 || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

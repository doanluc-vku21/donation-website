import type { DonationOption } from "@/lib/sample-data";

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

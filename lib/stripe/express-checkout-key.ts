import type { Currency } from "@/lib/currency";
import type { Locale } from "@/lib/i18n";
import type { DonationFrequency } from "@/lib/sample-data";

// Both the campaign's warm-up and the mounted wallet must identify the same
// selection. A different field order silently discards a ready Stripe Session.
export function getExpressCheckoutKey({
  campaignId, campaignPath, frequency, amount, currency, coverFee, displayPublicly, locale,
}: {
  campaignId: string;
  campaignPath: string;
  frequency: DonationFrequency;
  amount: number;
  currency: Currency;
  coverFee: boolean;
  displayPublicly: boolean;
  locale: Locale;
}) {
  return [campaignId, frequency, amount, currency, coverFee ? "fee" : "no-fee",
    displayPublicly ? "public" : "anonymous", locale, campaignPath].join(":");
}

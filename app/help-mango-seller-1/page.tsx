import { cache } from "react";
import { notFound } from "next/navigation";
import { CampaignPage } from "@/components/campaign/campaign-page";
import { getCampaignMetadata } from "@/lib/campaign-metadata";
import { getCurrencyContext } from "@/lib/currency-server";
import { getLocale } from "@/lib/i18n-server";
import { withTwentyFiveDollarPresets } from "@/lib/donation-presets";
import {
  localizeMangoSellerCampaign,
  MANGO_SELLER_ALT_SLUG,
  MANGO_SELLER_BASE_RAISED_USD,
  MANGO_SELLER_ONE_TIME_DONATION_OPTIONS,
  MANGO_SELLER_SEED_DONATIONS,
  MANGO_SELLER_SLUG,
} from "@/lib/mango-seller-campaign";
import { getCampaignBySlug } from "@/lib/queries/campaigns";
import { getBeneficiaryContent } from "@/lib/queries/beneficiary-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const getContent = cache(async () => {
  const [content, locale] = await Promise.all([getBeneficiaryContent(MANGO_SELLER_SLUG), getLocale()]);
  return localizeMangoSellerCampaign(content, locale);
});

export async function generateMetadata() {
  return getCampaignMetadata(await getContent(), `/${MANGO_SELLER_ALT_SLUG}`);
}

export default async function MangoSellerAltPage() {
  // /help-mango-seller-1 is a second public entry point for the same mango-seller campaign.
  const [campaign, content, locale, { currency, exchangeRate }] = await Promise.all([
    getCampaignBySlug(MANGO_SELLER_SLUG), getContent(), getLocale(), getCurrencyContext(),
  ]);
  if (!campaign) notFound();

  return (
    <CampaignPage
      campaign={{
        ...campaign, title: content.title, organizationName: "MEAL SUPPORT INC",
        summary: content.summary ?? "",
        raisedAmountUsd: campaign.raisedAmountUsd + MANGO_SELLER_BASE_RAISED_USD,
        donorCount: campaign.donorCount + MANGO_SELLER_SEED_DONATIONS.length,
        recentDonations: [...campaign.recentDonations, ...MANGO_SELLER_SEED_DONATIONS],
        donationOptions: [
          ...withTwentyFiveDollarPresets(campaign.donationOptions.filter(option => option.frequency === "monthly")),
          ...MANGO_SELLER_ONE_TIME_DONATION_OPTIONS,
        ],
      }}
      content={content}
      showDonationTimes={false}
      showOneTimeLabels
      showOrganizationCharityStatus
      showOrganizationVerification
      showSummary={false}
      showStory={false}
      showFundUsage={false}
      expandStory
      locale={locale}
      currency={currency}
      exchangeRate={exchangeRate}
    />
  );
}

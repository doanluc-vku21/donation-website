import { cache } from "react";
import { notFound } from "next/navigation";
import { CampaignPage } from "@/components/campaign/campaign-page";
import { HistoricalDonorSummary } from "@/components/campaign/historical-donor-summary";
import { getCampaignMetadata } from "@/lib/campaign-metadata";
import { getCurrencyContext } from "@/lib/currency-server";
import { getLocale } from "@/lib/i18n-server";
import { getBeneficiaryContent } from "@/lib/queries/beneficiary-content";
import { getCampaignBySlug } from "@/lib/queries/campaigns";
import { getCampaignContributionCount } from "@/lib/queries/campaign-contributions";
import {
  localizeStreetVendorCampaign,
  STREET_VENDOR_BASE_RAISED_USD,
  STREET_VENDOR_SEED_DONATIONS,
  STREET_VENDOR_SLUG,
  withStreetVendorDonationOptions,
} from "@/lib/street-vendor-campaign";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const getContent = cache(async () => {
  const [content, locale] = await Promise.all([getBeneficiaryContent(STREET_VENDOR_SLUG), getLocale()]);
  return localizeStreetVendorCampaign(content, locale);
});

export async function generateMetadata() {
  return getCampaignMetadata(await getContent(), `/${STREET_VENDOR_SLUG}`);
}

export default async function StreetVendorPage() {
  const [campaign, content, locale, { currency, exchangeRate }] = await Promise.all([
    getCampaignBySlug(STREET_VENDOR_SLUG), getContent(), getLocale(), getCurrencyContext(),
  ]);
  if (!campaign) notFound();

  const liveContributionCount = await getCampaignContributionCount(campaign.id);
  const contributionCount = liveContributionCount + STREET_VENDOR_SEED_DONATIONS.length;
  const donorSummary = <HistoricalDonorSummary contributionCount={contributionCount} locale={locale} />;

  return (
    <CampaignPage
      campaign={{
        ...campaign,
        title: content.title,
        summary: content.summary ?? "",
        organizationName: "MEAL SUPPORT INC",
        raisedAmountUsd: campaign.raisedAmountUsd + STREET_VENDOR_BASE_RAISED_USD,
        recentDonations: [...campaign.recentDonations, ...STREET_VENDOR_SEED_DONATIONS],
        donationOptions: withStreetVendorDonationOptions(campaign.donationOptions),
      }}
      content={content}
      donorSummary={donorSummary}
      contributionCount={contributionCount}
      liveContributionCount={liveContributionCount}
      autoRefresh
      compactHeadline
      mobileHeroObjectPosition="center 15%"
      showDonationTimes
      showOneTimeLabels
      showOrganizationCharityStatus
      showOrganizationVerification
      showSummary={false}
      expandStory
      locale={locale}
      currency={currency}
      exchangeRate={exchangeRate}
    />
  );
}

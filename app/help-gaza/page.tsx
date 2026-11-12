import { cache } from "react";
import { notFound } from "next/navigation";
import { CampaignPage } from "@/components/campaign/campaign-page";
import { getCampaignMetadata } from "@/lib/campaign-metadata";
import { getCurrencyContext } from "@/lib/currency-server";
import { withTwentyFiveDollarPresets } from "@/lib/donation-presets";
import {
  HELP_GAZA_CAMPAIGN_SLUG,
  HELP_GAZA_ONE_TIME_DONATION_OPTIONS,
  HELP_GAZA_PATH,
  localizeHelpGazaCampaign,
} from "@/lib/help-gaza-campaign";
import { getLocale } from "@/lib/i18n-server";
import { getCampaignBySlug } from "@/lib/queries/campaigns";
import { sanityClient } from "@/sanity/lib/client";
import { CAMPAIGN_QUERY } from "@/sanity/lib/queries";
import type { SanityCampaign } from "@/sanity/types/campaign";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const getContent = cache(async () => {
  const [content, locale] = await Promise.all([
    sanityClient.fetch<SanityCampaign | null>(
      CAMPAIGN_QUERY,
      { slug: HELP_GAZA_CAMPAIGN_SLUG },
      { cache: "no-store" },
    ),
    getLocale(),
  ]);
  if (!content) return null;
  return localizeHelpGazaCampaign(content, locale);
});

export async function generateMetadata() {
  const content = await getContent();
  if (!content) notFound();
  return getCampaignMetadata(content, HELP_GAZA_PATH);
}

export default async function HelpGazaPage() {
  const [campaign, content, locale, { currency, exchangeRate }] = await Promise.all([
    getCampaignBySlug(HELP_GAZA_CAMPAIGN_SLUG),
    getContent(),
    getLocale(),
    getCurrencyContext(),
  ]);
  if (!campaign || !content) notFound();

  return (
    <CampaignPage
      campaign={{
        ...campaign,
        title: content.title,
        organizationName: "MEAL SUPPORT INC",
        summary: content.summary ?? "",
        donationOptions: [
          ...withTwentyFiveDollarPresets(campaign.donationOptions.filter(option => option.frequency === "monthly")),
          ...HELP_GAZA_ONE_TIME_DONATION_OPTIONS,
        ],
      }}
      content={content}
      showMobileHeroHeadline={false}
      showDonationTimes={false}
      showOneTimeLabels
      showOrganizationCharityStatus
      showOrganizationVerification
      showSummary={false}
      showStory
      showFundUsage={false}
      expandStory
      locale={locale}
      currency={currency}
      exchangeRate={exchangeRate}
    />
  );
}

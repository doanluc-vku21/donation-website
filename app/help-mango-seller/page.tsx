import { cache } from "react";
import { notFound } from "next/navigation";
import { CampaignPage } from "@/components/campaign/campaign-page";
import { getCampaignMetadata } from "@/lib/campaign-metadata";
import { getCurrencyContext } from "@/lib/currency-server";
import { getLocale } from "@/lib/i18n-server";
import {
  localizeMangoSellerCampaign,
  MANGO_SELLER_BASE_RAISED_USD,
  MANGO_SELLER_SEED_DONATIONS,
  MANGO_SELLER_SLUG,
} from "@/lib/mango-seller-campaign";
import { getCampaignBySlug } from "@/lib/queries/campaigns";
import { sanityClient } from "@/sanity/lib/client";
import { CAMPAIGN_BRANDING_QUERY, CAMPAIGN_QUERY } from "@/sanity/lib/queries";
import type { SanityCampaign } from "@/sanity/types/campaign";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const getContent = cache(async () => {
  const content = await sanityClient.fetch<SanityCampaign | null>(
    CAMPAIGN_QUERY, { slug: MANGO_SELLER_SLUG }, { cache: "no-store" },
  );
  const branding = content ? null : await sanityClient.fetch<Partial<SanityCampaign> | null>(
    CAMPAIGN_BRANDING_QUERY, { slug: "akram-shake" }, { cache: "no-store" },
  );
  return localizeMangoSellerCampaign(content ?? {
    ...branding,
    _id: "mango-seller-page-content",
    slug: MANGO_SELLER_SLUG,
    title: "",
  }, await getLocale());
});

export async function generateMetadata() {
  return getCampaignMetadata(await getContent(), `/${MANGO_SELLER_SLUG}`);
}

export default async function MangoSellerPage() {
  // Use this beneficiary's own campaign ID and totals, plus the supplied photo.
  // Shared organization branding cannot replace beneficiary content/accounting.
  const campaign = await getCampaignBySlug(MANGO_SELLER_SLUG);
  if (!campaign) notFound();

  const [content, locale, { currency, exchangeRate }] = await Promise.all([
    getContent(), getLocale(), getCurrencyContext(),
  ]);

  return (
    <CampaignPage
      campaign={{
        ...campaign, title: content.title, organizationName: "MEAL SUPPORT INC",
        summary: content.summary ?? "",
        raisedAmountUsd: campaign.raisedAmountUsd + MANGO_SELLER_BASE_RAISED_USD,
        donorCount: campaign.donorCount + MANGO_SELLER_SEED_DONATIONS.length,
        recentDonations: [...campaign.recentDonations, ...MANGO_SELLER_SEED_DONATIONS],
        donationOptions: campaign.donationOptions.filter(option => option.amountUsd >= 2500),
      }}
      content={content}
      showDonationTimes={false}
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

import {
  notFound,
} from "next/navigation";

import {
  CampaignPage,
} from "@/components/campaign/campaign-page";

import {
  getLocale,
} from "@/lib/i18n-server";

import {
  getCurrencyContext,
} from "@/lib/currency-server";

import {
  localizeCampaign,
} from "@/lib/localize-campaign";

import {
  getCampaignBySlug,
} from "@/lib/queries/campaigns";

import {
  sanityClient,
} from "@/sanity/lib/client";

import {
  CAMPAIGN_QUERY,
} from "@/sanity/lib/queries";

import type {
  SanityCampaign,
} from "@/sanity/types/campaign";

const CAMPAIGN_SLUG =
  "akram-shake";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

export default async function AkramShakePage() {
  const [
    campaign,
    content,
    locale,
    {
      currency,
      exchangeRate,
    },
  ] =
    await Promise.all([
      getCampaignBySlug(
        CAMPAIGN_SLUG,
      ),
      sanityClient.fetch<SanityCampaign>(
        CAMPAIGN_QUERY,
        {
          slug:
            CAMPAIGN_SLUG,
        },
        {
          cache:
            "no-store",
        },
      ),
      getLocale(),
      getCurrencyContext(),
    ]);

  if (!campaign || !content) {
    notFound();
  }

  // =========================================
  // LOCALIZED CONTENT
  // =========================================

  const localizedContent =
    localizeCampaign(
      content,
      locale,
    );

  return (
    <CampaignPage
      campaign={
        campaign
      }
      content={
        localizedContent
      }
      locale={
        locale
      }
      currency={
        currency
      }
      exchangeRate={
        exchangeRate
      }
    />
  );
}

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
  const campaign =
    await getCampaignBySlug(
      CAMPAIGN_SLUG,
    );

  if (!campaign) {
    notFound();
  }

  const content =
    await sanityClient.fetch<SanityCampaign>(
      CAMPAIGN_QUERY,
      {
        slug:
          CAMPAIGN_SLUG,
      },
      {
        cache:
          "no-store",
      },
    );

  if (!content) {
    notFound();
  }

  // =========================================
  // LANGUAGE
  // =========================================

  const locale =
    await getLocale();

  // =========================================
  // CURRENCY
  // =========================================

  const {
    currency,
    exchangeRate,
  } =
    await getCurrencyContext();

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

import {
  notFound,
} from "next/navigation";

import {
  DonatePage,
} from "@/components/donation/donate-page";

import {
  getCampaignBySlug,
} from "@/lib/queries/campaigns";

import {
  getLocale,
} from "@/lib/i18n-server";

import {
  getCurrencyContext,
} from "@/lib/currency-server";

import {
  localizePalestineMonthlyCampaign,
} from "@/lib/palestine-monthly-campaign";

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
  "give-a-child-a-brighter-tomorrow";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

export default async function GazaFoodDonatePage() {
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

  const localizedContent =
    localizePalestineMonthlyCampaign(
      content,
      locale,
    );

  const campaignWithGoal = {
    ...campaign,

    goalAmountUsd:
      localizedContent.goalAmount != null
        ? Math.round(
            localizedContent.goalAmount *
              100,
          )
        : campaign.goalAmountUsd,
  };

  return (
    <DonatePage
      campaign={
        campaignWithGoal
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

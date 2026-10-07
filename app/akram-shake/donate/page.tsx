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
  localizeCampaign,
} from "@/lib/localize-campaign";

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

export default async function AkramShakeDonatePage() {
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

  const locale =
    await getLocale();

  const {
    currency,
    exchangeRate,
  } =
    await getCurrencyContext();

  const localizedContent =
    localizeCampaign(
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
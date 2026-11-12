import {
  notFound,
} from "next/navigation";

import {
  CampaignPage,
} from "@/components/campaign/campaign-page";

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
  "give-a-child-a-brighter-tomorrow";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

export default async function GazaHelpPage() {
  /*
   * /gaza-help is a second public URL only.
   *
   * It intentionally uses the SAME Supabase campaign and
   * SAME Sanity content as /gaza-food.
   */
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

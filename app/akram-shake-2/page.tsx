import { withRyanCampaignName } from "@/lib/ryan-campaign";
import { withTwentyFiveDollarPresets } from "@/lib/donation-presets";
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

export default async function AkramShakeUpsellPage() {
  /*
   * /akram-shake-2 is an additional public entry point only.
   * It intentionally uses the SAME Supabase campaign and
   * SAME Sanity document as /akram-shake.
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

  const ryanContent = withRyanCampaignName(localizedContent);

  return (
    <CampaignPage
      campaign={{ ...campaign, title: ryanContent.title, donationOptions: withTwentyFiveDollarPresets(campaign.donationOptions) }}
      content={{ ...ryanContent, organizationName: "MEAL SUPPORT INC" }}
      showDonationTimes={false}
      showOrganizationCharityStatus
      showOrganizationVerification
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

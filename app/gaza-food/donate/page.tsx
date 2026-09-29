import { notFound } from "next/navigation";

import {
  DonatePage,
} from "@/components/donation/donate-page";

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
  "give-a-child-a-brighter-tomorrow";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

export default async function GazaFoodDonatePage() {
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
        slug: CAMPAIGN_SLUG,
      },
      {
        cache: "no-store",
      },
    );

  if (!content) {
    notFound();
  }

  return (
    <DonatePage
      campaign={{
        ...campaign,

        goalAmountUsd:
          content.goalAmount != null
            ? Math.round(
                content.goalAmount *
                  100,
              )
            : campaign.goalAmountUsd,
      }}
      content={content}
    />
  );
}
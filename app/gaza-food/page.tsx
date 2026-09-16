import { notFound } from "next/navigation";

import { CampaignPage } from "@/components/campaign/campaign-page";

import { getCampaignBySlug } from "@/lib/queries/campaigns";

import { sanityClient } from "@/sanity/lib/client";
import { CAMPAIGN_QUERY } from "@/sanity/lib/queries";
import type { SanityCampaign } from "@/sanity/types/campaign";

const CAMPAIGN_SLUG =
  "give-a-child-a-brighter-tomorrow";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GazaFoodPage() {
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
    <CampaignPage
      campaign={campaign}
      content={content}
    />
  );
}
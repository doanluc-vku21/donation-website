import { notFound } from "next/navigation";

import { CampaignPage } from "@/components/campaign/campaign-page";

import { getCampaignBySlug } from "@/lib/queries/campaigns";

export default async function Home() {
  const campaign =
    await getCampaignBySlug(
      "give-a-child-a-brighter-tomorrow",
    );

  if (!campaign) {
    notFound();
  }

  return (
    <CampaignPage
      campaign={campaign}
    />
  );
}
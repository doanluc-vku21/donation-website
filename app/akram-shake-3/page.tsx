import { notFound } from "next/navigation";
import { CampaignPage } from "@/components/campaign/campaign-page";
import { getLocale } from "@/lib/i18n-server";
import { getCurrencyContext } from "@/lib/currency-server";
import { localizeAkramMonthlyCampaign } from "@/lib/akram-monthly-campaign";
import { getCampaignBySlug } from "@/lib/queries/campaigns";
import { getMonthlySupporters } from "@/lib/queries/monthly-supporters";
import { sanityClient } from "@/sanity/lib/client";
import { CAMPAIGN_QUERY } from "@/sanity/lib/queries";
import type { SanityCampaign } from "@/sanity/types/campaign";

const CAMPAIGN_SLUG = "akram-shake";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AkramShakeMonthlyPage() {
  // Preserve the original campaign's accounting and media for this new entry.
  const [campaign, locale, { currency, exchangeRate }] = await Promise.all([
    getCampaignBySlug(CAMPAIGN_SLUG),
    getLocale(),
    getCurrencyContext(),
  ]);
  if (!campaign) notFound();

  const [content, supporters] = await Promise.all([
    sanityClient.fetch<SanityCampaign>(
      CAMPAIGN_QUERY, { slug: CAMPAIGN_SLUG }, { cache: "no-store" },
    ),
    getMonthlySupporters(campaign.id),
  ]);
  if (!content) notFound();

  const monthlyCampaign = {
    ...campaign,
    recentDonations: supporters ?? [],
    supporterProgress: { count: supporters?.length ?? null, goal: 100 },
  };

  return <CampaignPage campaign={monthlyCampaign} content={localizeAkramMonthlyCampaign(content, locale)}
    locale={locale} currency={currency} exchangeRate={exchangeRate} />;
}

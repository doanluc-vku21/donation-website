import { notFound } from "next/navigation";
import { CampaignPage } from "@/components/campaign/campaign-page";
import { getLocale } from "@/lib/i18n-server";
import { getCurrencyContext } from "@/lib/currency-server";
import { localizeAkramMonthlyCampaign } from "@/lib/akram-monthly-campaign";
import { getCampaignBySlug } from "@/lib/queries/campaigns";
import { getMonthlySupporterCount } from "@/lib/queries/monthly-supporters";
import { sanityClient } from "@/sanity/lib/client";
import { CAMPAIGN_QUERY } from "@/sanity/lib/queries";
import type { SanityCampaign } from "@/sanity/types/campaign";

const CAMPAIGN_SLUG = "akram-shake";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AkramShakeMonthlyPage() {
  // Preserve the original campaign's accounting and media for this new entry.
  const campaign = await getCampaignBySlug(CAMPAIGN_SLUG);
  if (!campaign) notFound();

  const content = await sanityClient.fetch<SanityCampaign>(
    CAMPAIGN_QUERY, { slug: CAMPAIGN_SLUG }, { cache: "no-store" },
  );
  if (!content) notFound();

  const locale = await getLocale();
  const { currency, exchangeRate } = await getCurrencyContext();
  const monthlySupporterCount = await getMonthlySupporterCount(campaign.id);
  const monthlyCampaign = { ...campaign, supporterProgress: { count: monthlySupporterCount, goal: 100 } };

  return <CampaignPage campaign={monthlyCampaign} content={localizeAkramMonthlyCampaign(content, locale)}
    locale={locale} currency={currency} exchangeRate={exchangeRate} />;
}

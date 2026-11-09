import { cache } from "react";
import { notFound } from "next/navigation";
import { CampaignPage } from "@/components/campaign/campaign-page";
import { getCampaignMetadata } from "@/lib/campaign-metadata";
import { getCurrencyContext } from "@/lib/currency-server";
import { getLocale } from "@/lib/i18n-server";
import { getBeneficiaryContent } from "@/lib/queries/beneficiary-content";
import { getCampaignBySlug } from "@/lib/queries/campaigns";
import { localizeStreetVendorCampaign, STREET_VENDOR_SLUG } from "@/lib/street-vendor-campaign";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const getContent = cache(async () => {
  const [content, locale] = await Promise.all([getBeneficiaryContent(STREET_VENDOR_SLUG), getLocale()]);
  return localizeStreetVendorCampaign(content, locale);
});

export async function generateMetadata() {
  return getCampaignMetadata(await getContent(), `/${STREET_VENDOR_SLUG}`);
}

export default async function StreetVendorPage() {
  const [campaign, content, locale, { currency, exchangeRate }] = await Promise.all([
    getCampaignBySlug(STREET_VENDOR_SLUG), getContent(), getLocale(), getCurrencyContext(),
  ]);
  if (!campaign) notFound();

  return (
    <CampaignPage
      campaign={{ ...campaign, title: content.title, summary: content.summary ?? "", organizationName: "MEAL SUPPORT INC" }}
      content={content}
      mobileHeroObjectPosition="center 15%"
      showDonationTimes={false}
      showOneTimeLabels
      showOrganizationCharityStatus
      showOrganizationVerification
      showSummary={false}
      expandStory
      locale={locale}
      currency={currency}
      exchangeRate={exchangeRate}
    />
  );
}

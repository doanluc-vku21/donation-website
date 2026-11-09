import "server-only";
import { cache } from "react";
import { sanityClient } from "@/sanity/lib/client";
import { CAMPAIGN_BRANDING_QUERY, CAMPAIGN_QUERY } from "@/sanity/lib/queries";
import type { SanityCampaign } from "@/sanity/types/campaign";

export const BENEFICIARY_CONTENT_QUERY = `{
  "campaign": ${CAMPAIGN_QUERY},
  "branding": ${CAMPAIGN_BRANDING_QUERY.replaceAll("$slug", "$brandingSlug")}
}`;

// One CMS round trip, even before this beneficiary has a published document.
// React cache shares the result between metadata and page rendering only;
// donation totals, cookies and localized HTML are never cached across visitors.
export const getBeneficiaryContent = cache(async (slug: string): Promise<SanityCampaign> => {
  const result = await sanityClient.fetch<{
    campaign: SanityCampaign | null;
    branding: Partial<SanityCampaign> | null;
  }>(BENEFICIARY_CONTENT_QUERY, { slug, brandingSlug: "akram-shake" }, { cache: "no-store" });
  return result.campaign ?? { ...result.branding, _id: `${slug}-page-content`, slug, title: "" };
});

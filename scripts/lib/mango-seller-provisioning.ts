import { MANGO_SELLER_SLUG, withMangoSellerCopy } from "@/lib/mango-seller-campaign";
import type { DonationFrequency } from "@/lib/sample-data";

export class MangoProvisioningError extends Error {}

export type ProvisionedCampaign = {
  id: string;
  slug: string;
  organization_name: string;
  is_active: boolean;
};

export type CampaignSeed = Omit<ProvisionedCampaign, "id"> & {
  title: string;
  eyebrow: string;
  summary: string;
  story: string[];
  goal_amount_cents: number;
  currency: string;
};

export type ProvisionedOption = {
  amount_cents: number;
  impact_text: string;
  featured: boolean;
  sort_order: number;
  frequency: DonationFrequency;
};

export type MangoProvisioningStore = {
  findCampaign(slug: string): Promise<ProvisionedCampaign | null>;
  createCampaign(seed: CampaignSeed): Promise<ProvisionedCampaign>;
  listOptions(id: string): Promise<ProvisionedOption[]>;
  insertOptions(id: string, options: ProvisionedOption[]): Promise<void>;
  activateCampaign(id: string): Promise<void>;
};

// This operation writes only a newly scoped campaign and its donation options.
// On retry, it fills missing options before activation; it never copies donors
// or totals and never updates the reference campaign or existing options.
export async function provisionMangoSeller(store: MangoProvisioningStore): Promise<{ id: string; optionCount: number }> {
  const source = await store.findCampaign("akram-shake");
  if (!source?.is_active) throw new MangoProvisioningError("Reference campaign is unavailable.");
  const options = (await store.listOptions(source.id)).filter(option => Number.isSafeInteger(option.amount_cents) && option.amount_cents >= 2500);
  if (!options.length) throw new MangoProvisioningError("Reference donation options are unavailable.");

  let campaign = await store.findCampaign(MANGO_SELLER_SLUG);
  if (!campaign) {
    const content = withMangoSellerCopy({ _id: "mango-content", slug: MANGO_SELLER_SLUG, title: "" });
    campaign = await store.createCampaign({
      slug: MANGO_SELLER_SLUG,
      title: content.title,
      organization_name: "MEAL SUPPORT INC",
      eyebrow: "",
      summary: content.summary ?? "",
      story: (content.story ?? []).map(block => block.children.map(span => span.text).join("")),
      goal_amount_cents: 250_000,
      currency: "USD",
      is_active: false,
    });
  }
  if (campaign.slug !== MANGO_SELLER_SLUG || campaign.id === source.id || campaign.organization_name !== "MEAL SUPPORT INC") {
    throw new MangoProvisioningError("Mango campaign identity does not match the authorized setup.");
  }

  const current = await store.listOptions(campaign.id);
  const key = (option: ProvisionedOption) => `${option.frequency}:${option.amount_cents}`;
  const existingKeys = new Set(current.map(key));
  const missing = options.filter(option => !existingKeys.has(key(option))).map(option => ({
    ...option,
    impact_text: option.impact_text.replace(/\b(?:Akram|Ryan)\b/gi, "the mango seller"),
  }));
  if (missing.length) await store.insertOptions(campaign.id, missing);
  const storedOptions = await store.listOptions(campaign.id);
  const storedKeys = new Set(storedOptions.map(key));
  if (!options.every(option => storedKeys.has(key(option)))) throw new MangoProvisioningError("Donation options did not persist; activation was skipped.");
  if (!campaign.is_active) await store.activateCampaign(campaign.id);
  const verified = await store.findCampaign(MANGO_SELLER_SLUG);
  if (verified?.id !== campaign.id || !verified.is_active) throw new MangoProvisioningError("Campaign activation could not be verified.");
  return { id: campaign.id, optionCount: storedOptions.length };
}

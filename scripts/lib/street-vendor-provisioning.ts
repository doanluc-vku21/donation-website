import { localizeStreetVendorCampaign, STREET_VENDOR_SLUG } from "@/lib/street-vendor-campaign";
import type { DonationFrequency } from "@/lib/sample-data";

export class StreetVendorProvisioningError extends Error {}

export type StreetVendorIdentity = {
  id: string;
  slug: string;
  organization_name: string;
  currency: string;
  goal_amount_cents: number;
  is_active: boolean;
};

export type StreetVendorSeed = Omit<StreetVendorIdentity, "id"> & {
  title: string;
  eyebrow: string;
  summary: string;
  story: string[];
};

export type StreetVendorOption = {
  frequency: DonationFrequency;
  amount_cents: number;
  impact_text: string;
  featured: boolean;
  sort_order: number;
};

export type StreetVendorStore = {
  findCampaign(): Promise<StreetVendorIdentity | null>;
  createCampaign(seed: StreetVendorSeed): Promise<StreetVendorIdentity>;
  listOptions(id: string): Promise<StreetVendorOption[]>;
  insertOptions(id: string, options: StreetVendorOption[]): Promise<void>;
  activateCampaign(id: string): Promise<void>;
};

export function streetVendorSeed(goalAmountCents: number): StreetVendorSeed {
  if (!Number.isSafeInteger(goalAmountCents) || goalAmountCents <= 0) {
    throw new StreetVendorProvisioningError("Supply a confirmed positive goal in USD cents.");
  }
  const content = localizeStreetVendorCampaign({ _id: "street-vendor-content", slug: STREET_VENDOR_SLUG, title: "" }, "en");
  return {
    slug: STREET_VENDOR_SLUG, title: content.title, organization_name: "MEAL SUPPORT INC", eyebrow: "",
    summary: content.summary ?? "",
    story: (content.story ?? []).map(block => block.children.map(span => span.text).join("")),
    goal_amount_cents: goalAmountCents, currency: "USD", is_active: false,
  };
}

export const streetVendorOptions: StreetVendorOption[] = (["one_time", "monthly"] as const).flatMap(frequency =>
  (frequency === "one_time" ? [2500, 5000, 7500] : [2500, 5000, 10000]).map((amount_cents, sort_order) => ({
    frequency, amount_cents, sort_order, impact_text: "", featured: amount_cents === 5000,
  })),
);

// Explicitly invoked only; never attached to builds. Start inactive, verify
// options, then optionally activate. Repeated runs do not overwrite existing
// campaigns, donation records, totals, or options.
export async function provisionStreetVendor(store: StreetVendorStore, goalAmountCents: number, activate = false): Promise<StreetVendorIdentity> {
  const seed = streetVendorSeed(goalAmountCents);
  let campaign = await store.findCampaign();
  if (!campaign) campaign = await store.createCampaign(seed);
  if (campaign.slug !== STREET_VENDOR_SLUG || campaign.organization_name !== "MEAL SUPPORT INC" ||
      campaign.currency !== "USD" || campaign.goal_amount_cents !== goalAmountCents) {
    throw new StreetVendorProvisioningError("Existing campaign identity or goal differs; no updates were made.");
  }
  const key = (option: StreetVendorOption) => `${option.frequency}:${option.amount_cents}`;
  const current = await store.listOptions(campaign.id);
  const existing = new Set(current.map(key));
  const missing = streetVendorOptions.filter(option => !existing.has(key(option)));
  if (missing.length) await store.insertOptions(campaign.id, missing);
  const persisted = new Set((await store.listOptions(campaign.id)).map(key));
  if (!streetVendorOptions.every(option => persisted.has(key(option)))) {
    throw new StreetVendorProvisioningError("Donation options did not persist; activation was skipped.");
  }
  if (activate && !campaign.is_active) await store.activateCampaign(campaign.id);
  const verified = await store.findCampaign();
  if (verified?.id !== campaign.id || verified.is_active !== (activate || campaign.is_active)) {
    throw new StreetVendorProvisioningError("Campaign readback did not match the requested state.");
  }
  return verified;
}

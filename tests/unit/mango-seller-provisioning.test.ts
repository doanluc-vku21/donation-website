// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { provisionMangoSeller, type CampaignSeed, type MangoProvisioningStore, type ProvisionedCampaign, type ProvisionedOption } from "@/scripts/lib/mango-seller-provisioning";

function fixture() {
  let campaign: ProvisionedCampaign | null = null;
  let options: ProvisionedOption[] = [];
  const sourceOptions: ProvisionedOption[] = [1000, 2500, 5000].flatMap(amount_cents => (["one_time", "monthly"] as const).map(frequency => ({
    amount_cents, frequency, impact_text: "Supports daily essentials", featured: amount_cents === 5000, sort_order: amount_cents,
  })));
  const store: MangoProvisioningStore = {
    findCampaign: vi.fn(async slug => slug === "akram-shake" ? { id: "old-id", slug, organization_name: "MEAL SUPPORT INC", is_active: true } : campaign),
    createCampaign: vi.fn(async (seed: CampaignSeed) => {
      campaign = { ...seed, id: "mango-id" };
      return campaign;
    }),
    listOptions: vi.fn(async id => id === "old-id" ? sourceOptions : options),
    insertOptions: vi.fn(async (_id, added) => { options = [...options, ...added]; }),
    activateCampaign: vi.fn(async () => { if (campaign) campaign.is_active = true; }),
  };
  return { store };
}

describe("independent mango campaign initialization", () => {
  it("creates zero-history accounting and preserves both reference frequencies above the minimum", async () => {
    const { store } = fixture();
    expect(await provisionMangoSeller(store)).toEqual({ id: "mango-id", optionCount: 4 });
    expect(store.createCampaign).toHaveBeenCalledWith(expect.objectContaining({ slug: "help-mango-seller", goal_amount_cents: 250000, is_active: false, currency: "USD" }));
    expect(Object.keys(vi.mocked(store.createCampaign).mock.calls[0][0])).not.toContain("raised_amount_cents");
    expect(store.insertOptions).toHaveBeenCalledWith("mango-id", expect.arrayContaining([
      expect.objectContaining({ amount_cents: 2500, frequency: "one_time" }),
      expect.objectContaining({ amount_cents: 2500, frequency: "monthly" }),
    ]));
    expect(store.activateCampaign).toHaveBeenCalledWith("mango-id");
  });

  it("is idempotent on a subsequent release attempt", async () => {
    const { store } = fixture();
    await provisionMangoSeller(store);
    await provisionMangoSeller(store);
    expect(store.createCampaign).toHaveBeenCalledOnce();
    expect(store.insertOptions).toHaveBeenCalledOnce();
    expect(store.activateCampaign).toHaveBeenCalledOnce();
  });

  it("leaves a partial campaign inactive and recovers the missing options on retry", async () => {
    const { store } = fixture();
    vi.mocked(store.insertOptions).mockRejectedValueOnce(new Error("Temporary write failure"));
    await expect(provisionMangoSeller(store)).rejects.toThrow("Temporary write failure");
    expect(store.activateCampaign).not.toHaveBeenCalled();
    expect(await provisionMangoSeller(store)).toEqual({ id: "mango-id", optionCount: 4 });
    expect(store.createCampaign).toHaveBeenCalledOnce();
  });

  it("does not activate when options fail readback", async () => {
    const { store } = fixture();
    vi.mocked(store.insertOptions).mockResolvedValue(undefined);
    await expect(provisionMangoSeller(store)).rejects.toThrow("did not persist");
    expect(store.activateCampaign).not.toHaveBeenCalled();
  });

  it("rejects an existing identity mismatch before writes", async () => {
    const { store } = fixture();
    const source = { id: "old-id", slug: "akram-shake", organization_name: "MEAL SUPPORT INC", is_active: true };
    vi.mocked(store.findCampaign).mockImplementation(async slug => slug === "akram-shake" ? source : { ...source, slug });
    await expect(provisionMangoSeller(store)).rejects.toThrow("identity");
    expect(store.createCampaign).not.toHaveBeenCalled();
    expect(store.insertOptions).not.toHaveBeenCalled();
    expect(store.activateCampaign).not.toHaveBeenCalled();
  });
});

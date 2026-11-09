// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  provisionStreetVendor, streetVendorSeed,
  type StreetVendorIdentity, type StreetVendorOption, type StreetVendorStore,
} from "@/scripts/lib/street-vendor-provisioning";

function fixture() {
  let campaign: StreetVendorIdentity | null = null;
  let options: StreetVendorOption[] = [];
  const store: StreetVendorStore = {
    findCampaign: vi.fn(async () => campaign),
    createCampaign: vi.fn(async seed => {
      const created: StreetVendorIdentity = { ...seed, id: "street-vendor-id" };
      campaign = created;
      return created;
    }),
    listOptions: vi.fn(async () => options),
    insertOptions: vi.fn(async (_id, added) => { options = [...options, ...added]; }),
    activateCampaign: vi.fn(async () => { if (campaign) campaign.is_active = true; }),
  };
  return store;
}

describe("street vendor provisioning", () => {
  it.each([0, -1, NaN, Infinity, 10.5, Number.MAX_SAFE_INTEGER + 1])("requires an explicit positive USD-cent goal: %s", goal => {
    expect(() => streetVendorSeed(goal)).toThrow("confirmed positive goal");
  });

  it("creates an inactive independent project with both frequencies and no copied history", async () => {
    const store = fixture();
    expect(await provisionStreetVendor(store, 500000)).toMatchObject({ slug: "help-street-vendor", id: "street-vendor-id", is_active: false });
    const seed = vi.mocked(store.createCampaign).mock.calls[0][0];
    expect(seed).toMatchObject({ goal_amount_cents: 500000, currency: "USD", is_active: false });
    expect(seed).not.toHaveProperty("raised_amount_cents");
    expect(store.insertOptions).toHaveBeenCalledWith("street-vendor-id", expect.arrayContaining([
      expect.objectContaining({ frequency: "monthly", amount_cents: 2500 }),
      expect.objectContaining({ frequency: "one_time", amount_cents: 7500 }),
    ]));
    expect(store.activateCampaign).not.toHaveBeenCalled();
  });

  it("only activates when requested and is idempotent on a subsequent run", async () => {
    const store = fixture();
    await provisionStreetVendor(store, 500000, true);
    await provisionStreetVendor(store, 500000, true);
    expect(store.createCampaign).toHaveBeenCalledOnce();
    expect(store.insertOptions).toHaveBeenCalledOnce();
    expect(store.activateCampaign).toHaveBeenCalledOnce();
  });

  it("recovers missing options after a failed insert while leaving activation for last", async () => {
    const store = fixture();
    vi.mocked(store.insertOptions).mockRejectedValueOnce(new Error("Temporary failure"));
    await expect(provisionStreetVendor(store, 500000, true)).rejects.toThrow("Temporary failure");
    expect(store.activateCampaign).not.toHaveBeenCalled();
    expect(await provisionStreetVendor(store, 500000, true)).toMatchObject({ is_active: true });
    expect(store.createCampaign).toHaveBeenCalledOnce();
  });

  it("does not activate if option persistence cannot be verified", async () => {
    const store = fixture();
    vi.mocked(store.insertOptions).mockResolvedValue(undefined);
    await expect(provisionStreetVendor(store, 500000, true)).rejects.toThrow("did not persist");
    expect(store.activateCampaign).not.toHaveBeenCalled();
  });

  it("refuses to overwrite an existing goal or unrelated campaign", async () => {
    const store = fixture();
    await provisionStreetVendor(store, 500000);
    await expect(provisionStreetVendor(store, 250000, true)).rejects.toThrow("identity or goal differs");
    expect(store.createCampaign).toHaveBeenCalledOnce();
    expect(store.insertOptions).toHaveBeenCalledOnce();
    expect(store.activateCampaign).not.toHaveBeenCalled();
  });
});

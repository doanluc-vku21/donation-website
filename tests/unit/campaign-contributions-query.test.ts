// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), select: vi.fn(), eq: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: mocks.from } }));
import { getCampaignContributionCount } from "@/lib/queries/campaign-contributions";

beforeEach(() => {
  vi.resetAllMocks();
  const query = { select: mocks.select, eq: mocks.eq };
  mocks.from.mockReturnValue(query);
  mocks.select.mockReturnValue(query);
  mocks.eq.mockReturnValueOnce(query);
});

describe("confirmed campaign contribution count", () => {
  it("counts successful payment rows for only the requested campaign without loading donor details or limiting recent gifts", async () => {
    mocks.eq.mockResolvedValueOnce({ count: 151, error: null });
    expect(await getCampaignContributionCount("campaign-street")).toBe(151);
    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("donations");
    expect(mocks.select).toHaveBeenCalledExactlyOnceWith("id", { count: "exact", head: true });
    expect(mocks.eq.mock.calls).toEqual([["campaign_id", "campaign-street"], ["status", "succeeded"]]);
  });

  it("accepts zero confirmed payments", async () => {
    mocks.eq.mockResolvedValueOnce({ count: 0, error: null });
    expect(await getCampaignContributionCount("campaign-street")).toBe(0);
  });

  it.each([
    { count: null, error: null },
    { count: 0, error: { message: "private database diagnostic" } },
    { count: -1, error: null },
  ])("does not turn unavailable or invalid accounting into zero", async result => {
    mocks.eq.mockResolvedValueOnce(result);
    await expect(getCampaignContributionCount("campaign-street")).rejects.toThrow("Unable to load campaign contribution count.");
  });
});

// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(), count: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: () => ({ from: mocks.from }) }));
vi.mock("@/lib/queries/campaign-contributions", () => ({ getCampaignContributionCount: mocks.count }));
import { GET } from "@/app/api/campaigns/[campaignId]/contribution-events/route";

const campaignId = "909d80f9-2f2d-430f-a411-5f826e9a58c6";
function get(id = campaignId) {
  return GET(new Request(`https://example.com/api/campaigns/${id}/contribution-events`), { params: Promise.resolve({ campaignId: id }) });
}
beforeEach(() => {
  vi.resetAllMocks();
  const query = { select: mocks.select, eq: mocks.eq, maybeSingle: mocks.maybeSingle };
  mocks.from.mockReturnValue(query); mocks.select.mockReturnValue(query); mocks.eq.mockReturnValue(query);
  mocks.maybeSingle.mockResolvedValue({ data: { id: campaignId }, error: null });
  mocks.count.mockResolvedValue(0);
});

describe("campaign contribution event endpoint", () => {
  it("exposes only the count for the active street-vendor campaign", async () => {
    const response = await get();
    expect(response.status).toBe(200);
    expect(mocks.eq.mock.calls).toEqual([["id", campaignId], ["slug", "help-street-vendor"], ["is_active", true]]);
    expect(mocks.count).toHaveBeenCalledExactlyOnceWith(campaignId);
    await response.body!.cancel();
  });
  it("rejects invalid identifiers before querying the database", async () => {
    expect((await get("not-a-uuid")).status).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("does not expose counts for another or inactive campaign", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await get()).status).toBe(404);
    expect(mocks.count).not.toHaveBeenCalled();
  });
  it("returns a sanitized unavailable response after count-query failure", async () => {
    mocks.count.mockRejectedValue(new Error("private database diagnostic"));
    const response = await get();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private database diagnostic");
  });
});

// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Result = { data: unknown; error: unknown };

const state = vi.hoisted(() => ({
  campaignResults: [] as Array<{ data: unknown; error: unknown }>,
  campaignCalls: 0,
  options: { data: [], error: null } as { data: unknown; error: unknown },
  stats: { data: [], error: null } as { data: unknown; error: unknown },
  recent: { data: [], error: null } as { data: unknown; error: unknown },
}));

const campaignRow = {
  id: "campaign-give-a-child-a-brighter-tomorrow",
  slug: "give-a-child-a-brighter-tomorrow",
  title: "Give a child a brighter tomorrow",
  organization_name: "Meal Support",
  eyebrow: null,
  summary: null,
  story: ["Story paragraph"],
  goal_amount_cents: 100,
  currency: "usd",
};

function builder(terminal: () => Result) {
  const shape: Record<string, unknown> = {};
  const chain = () => shape;
  Object.assign(shape, {
    select: chain,
    eq: chain,
    order: chain,
    limit: chain,
    maybeSingle: () => Promise.resolve(terminal()),
    then: (resolve: (value: Result) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(terminal()).then(resolve, reject),
  });
  return shape;
}

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({
    from: (table: string) => {
      if (table === "campaigns") {
        return builder(() => {
          state.campaignCalls += 1;
          return state.campaignResults.length > 0
            ? state.campaignResults.shift()!
            : { data: campaignRow, error: null };
        });
      }
      return builder(() => state.options);
    },
    rpc: (name: string) => builder(() => (name === "get_campaign_public_stats" ? state.stats : state.recent)),
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: { from: () => builder(() => ({ data: null, error: null })) },
}));

let now = 1_000_000;

beforeEach(() => {
  state.campaignResults = [];
  state.campaignCalls = 0;
  state.options = { data: [], error: null };
  state.stats = { data: [], error: null };
  state.recent = { data: [], error: null };
  now = 1_000_000;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function load() {
  return import("@/lib/queries/campaigns");
}

describe("campaign reads", () => {
  it("retries a transient database failure instead of failing the page", async () => {
    state.campaignResults = [
      { data: null, error: { message: "connection reset" } },
      { data: campaignRow, error: null },
    ];
    const { getCampaignBySlug } = await load();
    const campaign = await getCampaignBySlug("give-a-child-a-brighter-tomorrow");
    expect(campaign?.id).toBe(campaignRow.id);
    expect(state.campaignCalls).toBe(2);
  });

  it("does not read the database again inside the cache window", async () => {
    const { getCampaignBySlug } = await load();
    await getCampaignBySlug("give-a-child-a-brighter-tomorrow");
    now += 5_000;
    await getCampaignBySlug("give-a-child-a-brighter-tomorrow");
    expect(state.campaignCalls).toBe(1);
  });

  it("serves the last known campaign when the database keeps failing", async () => {
    const { getCampaignBySlug } = await load();
    await getCampaignBySlug("give-a-child-a-brighter-tomorrow");
    now += 60_000;
    state.campaignResults = [
      { data: null, error: { message: "upstream unavailable" } },
      { data: null, error: { message: "upstream unavailable" } },
    ];
    await expect(getCampaignBySlug("give-a-child-a-brighter-tomorrow")).resolves.toMatchObject({
      id: campaignRow.id,
    });
    expect(state.campaignCalls).toBe(3);
  });

  it("still reports a failure when nothing has been cached yet", async () => {
    state.campaignResults = [
      { data: null, error: { message: "upstream unavailable" } },
      { data: null, error: { message: "upstream unavailable" } },
    ];
    const { getCampaignBySlug } = await load();
    await expect(getCampaignBySlug("give-a-child-a-brighter-tomorrow")).rejects.toThrow("Unable to load campaign");
    expect(state.campaignCalls).toBe(2);
  });

  it("returns null for an inactive or missing campaign", async () => {
    state.campaignResults = [{ data: null, error: null }];
    const { getCampaignBySlug } = await load();
    await expect(getCampaignBySlug("missing")).resolves.toBeNull();
  });
});

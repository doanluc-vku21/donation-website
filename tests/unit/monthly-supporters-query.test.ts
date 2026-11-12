// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), select: vi.fn(), eq: vi.fn(), order: vi.fn(), range: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: mocks.from } }));
import { getMonthlySupporters } from "@/lib/queries/monthly-supporters";

function payment(overrides: Partial<{
  id: string; donor_id: string | null; stripe_subscription_id: string | null;
  display_name: string | null; is_anonymous: boolean | null; amount_cents: number;
  charged_amount_cents: number | null; charged_currency: string | null; created_at: string;
}> = {}) {
  return {
    id: "1", donor_id: "donor-a", stripe_subscription_id: "sub-a", display_name: "Alex P.",
    is_anonymous: false, amount_cents: 2500, created_at: "2026-11-03T10:00:00Z", ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  const query = { select: mocks.select, eq: mocks.eq, order: mocks.order, range: mocks.range };
  mocks.from.mockReturnValue(query); mocks.select.mockReturnValue(query);
  mocks.eq.mockReturnValue(query); mocks.order.mockReturnValue(query);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-03T10:30:00Z"));
});

afterEach(() => { vi.restoreAllMocks(); });

describe("monthly supporter list and counts", () => {
  it("selects the latest successful monthly payment per person across renewals and subscriptions", async () => {
    mocks.range.mockResolvedValue({ data: [
      payment(),
      payment({ id: "2", stripe_subscription_id: "sub-b", amount_cents: 1000, created_at: "2026-11-03T10:20:00Z" }),
      payment({ id: "3", donor_id: "donor-b", stripe_subscription_id: "sub-c", display_name: "Sam R." }),
      payment({ id: "4", donor_id: null, created_at: "2026-11-01T10:00:00Z" }),
    ], error: null });
    const supporters = await getMonthlySupporters("campaign-akram");
    expect(supporters).toEqual([
      { id: "2", displayName: "Alex P.", amountUsd: 1000, frequency: "monthly", relativeTime: "10 minutes ago" },
      { id: "3", displayName: "Sam R.", amountUsd: 2500, frequency: "monthly", relativeTime: "30 minutes ago" },
    ]);
    expect(mocks.eq.mock.calls).toEqual([["campaign_id", "campaign-akram"], ["frequency", "monthly"], ["status", "succeeded"]]);
    expect(JSON.stringify(supporters)).not.toMatch(/donor-a|donor-b|sub-a|sub-b|sub-c/);
  });

  it("resolves historical donor IDs before choosing the latest payment and excludes unidentified rows", async () => {
    mocks.range.mockResolvedValue({ data: [
      payment({ id: "1", donor_id: null, created_at: "2026-11-03T10:25:00Z" }),
      payment({ id: "2" }),
      payment({ id: "3", donor_id: null, stripe_subscription_id: "sub-old" }),
      payment({ id: "4", donor_id: null, stripe_subscription_id: "sub-old" }),
      payment({ id: "5", donor_id: null, stripe_subscription_id: null }),
    ], error: null });
    const supporters = await getMonthlySupporters("campaign-akram");
    expect(supporters?.map((supporter) => supporter.id)).toEqual(["1", "4"]);
  });

  it("keeps separate anonymous people distinct and respects the latest payment's privacy setting", async () => {
    mocks.range.mockResolvedValue({ data: [
      payment(),
      payment({ id: "2", display_name: "Private name", is_anonymous: true, created_at: "2026-11-03T10:20:00Z" }),
      payment({ id: "3", donor_id: "donor-b", stripe_subscription_id: "sub-b", display_name: "Private name", is_anonymous: null }),
      payment({ id: "4", donor_id: "donor-c", stripe_subscription_id: "sub-c", display_name: " " }),
    ], error: null });
    const supporters = await getMonthlySupporters("campaign-akram");
    expect(supporters).toHaveLength(3);
    expect(supporters?.every((supporter) => supporter.displayName === "Anonymous")).toBe(true);
    expect(JSON.stringify(supporters)).not.toContain("Private name");
  });

  it("loads over 1000 supporters and deduplicates renewals across database pages", async () => {
    mocks.range.mockResolvedValueOnce({ data: Array.from({ length: 1000 }, (_, index) => payment({
      id: String(index), donor_id: `donor-${index}`, stripe_subscription_id: `sub-${index}`,
    })), error: null }).mockResolvedValueOnce({ data: [
      payment({ id: "1000", donor_id: "donor-0", stripe_subscription_id: "sub-0", created_at: "2026-11-03T10:29:00Z" }),
      payment({ id: "1001", donor_id: "donor-1000", stripe_subscription_id: "sub-1000" }),
    ], error: null });
    const supporters = await getMonthlySupporters("campaign-akram");
    expect(supporters).toHaveLength(1001);
    expect(supporters?.[0].id).toBe("1000");
    expect(supporters?.some((supporter) => supporter.id === "0")).toBe(false);
    expect(mocks.range.mock.calls).toEqual([[0, 999], [1000, 1999]]);
    expect(mocks.order).toHaveBeenCalledWith("id", { ascending: true });
  });

  it("reports zero only for a successful empty query", async () => {
    mocks.range.mockResolvedValue({ data: [], error: null });
    expect(await getMonthlySupporters("campaign-akram")).toEqual([]);
  });

  it("discards partial results rather than presenting an inaccurate list and count", async () => {
    mocks.range.mockResolvedValueOnce({ data: Array.from({ length: 1000 }, (_, index) => payment({ id: String(index) })), error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "private diagnostic" } });
    expect(await getMonthlySupporters("campaign-akram")).toBeNull();
    expect(console.error).toHaveBeenCalledWith("Unable to load monthly supporters.");
  });

  it("handles a network failure without leaking donor data or showing zero", async () => {
    mocks.range.mockRejectedValue(new Error("private diagnostic"));
    expect(await getMonthlySupporters("campaign-akram")).toBeNull();
    expect(console.error).toHaveBeenCalledWith("Unable to load monthly supporters.");
  });

  it("includes charged currency and amount when stored on the donation row", async () => {
    mocks.range.mockResolvedValue({
      data: [
        payment({
          id: "cad-gift",
          amount_cents: 3600,
          charged_amount_cents: 5000,
          charged_currency: "cad",
        }),
      ],
      error: null,
    });
    expect(await getMonthlySupporters("campaign-akram")).toEqual([
      {
        id: "cad-gift",
        displayName: "Alex P.",
        amountUsd: 3600,
        chargedAmount: 5000,
        chargedCurrency: "CAD",
        frequency: "monthly",
        relativeTime: "30 minutes ago",
      },
    ]);
  });
});

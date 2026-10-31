// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), select: vi.fn(), eq: vi.fn(), order: vi.fn(), range: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: mocks.from } }));
import { getMonthlySupporterCount } from "@/lib/queries/monthly-supporters";

beforeEach(() => {
  vi.clearAllMocks();
  const query = { select: mocks.select, eq: mocks.eq, order: mocks.order, range: mocks.range };
  mocks.from.mockReturnValue(query); mocks.select.mockReturnValue(query);
  mocks.eq.mockReturnValue(query); mocks.order.mockReturnValue(query);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); });

describe("monthly supporter counts", () => {
  it("counts unique paid monthly donors and deduplicates renewals and multiple subscriptions", async () => {
    mocks.range.mockResolvedValue({ data: [
      { id: "1", donor_id: "donor-a", stripe_subscription_id: "sub-a" },
      { id: "2", donor_id: "donor-a", stripe_subscription_id: "sub-a" },
      { id: "3", donor_id: "donor-a", stripe_subscription_id: "sub-b" },
      { id: "4", donor_id: "donor-b", stripe_subscription_id: "sub-c" },
      { id: "5", donor_id: null, stripe_subscription_id: "sub-a" },
    ], error: null });
    expect(await getMonthlySupporterCount("campaign-akram")).toBe(2);
    expect(mocks.eq.mock.calls).toEqual([["campaign_id", "campaign-akram"], ["frequency", "monthly"], ["status", "succeeded"]]);
    expect(mocks.select).toHaveBeenCalledWith("id,donor_id,stripe_subscription_id");
  });

  it("deduplicates historical subscriptions lacking donor IDs and excludes unidentified payments", async () => {
    mocks.range.mockResolvedValue({ data: [
      { id: "1", donor_id: null, stripe_subscription_id: "sub-old" },
      { id: "2", donor_id: null, stripe_subscription_id: "sub-old" },
      { id: "3", donor_id: null, stripe_subscription_id: null },
    ], error: null });
    expect(await getMonthlySupporterCount("campaign-akram")).toBe(1);
  });

  it("loads beyond the database page limit without counting renewals twice", async () => {
    mocks.range.mockResolvedValueOnce({ data: Array.from({ length: 1000 }, (_, index) => ({ id: String(index), donor_id: "donor-a", stripe_subscription_id: "sub-a" })), error: null })
      .mockResolvedValueOnce({ data: [{ id: "1001", donor_id: "donor-b", stripe_subscription_id: "sub-b" }], error: null });
    expect(await getMonthlySupporterCount("campaign-akram")).toBe(2);
    expect(mocks.range.mock.calls).toEqual([[0, 999], [1000, 1999]]);
    expect(mocks.order).toHaveBeenCalledWith("id", { ascending: true });
  });

  it("reports zero only for a successful empty query", async () => {
    mocks.range.mockResolvedValue({ data: [], error: null });
    expect(await getMonthlySupporterCount("campaign-akram")).toBe(0);
  });

  it("discards partial results rather than presenting them as an accurate count", async () => {
    mocks.range.mockResolvedValueOnce({ data: Array.from({ length: 1000 }, (_, index) => ({ id: String(index), donor_id: "donor-a" })), error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "private diagnostic" } });
    expect(await getMonthlySupporterCount("campaign-akram")).toBeNull();
    expect(console.error).toHaveBeenCalledWith("Unable to load monthly supporter count.");
  });

  it("handles a network failure without leaking donor data or showing zero", async () => {
    mocks.range.mockRejectedValue(new Error("private diagnostic"));
    expect(await getMonthlySupporterCount("campaign-akram")).toBeNull();
    expect(console.error).toHaveBeenCalledWith("Unable to load monthly supporter count.");
  });
});

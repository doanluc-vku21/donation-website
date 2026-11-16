// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  getOrCreateDonor: vi.fn(),
  rate: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/stripe/server", () => ({
  stripe: { checkout: { sessions: { list: mocks.list } } },
}));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock("@/lib/queries/donors", () => ({ getOrCreateDonor: mocks.getOrCreateDonor }));
vi.mock("@/lib/exchange-rate", () => ({ getUsdToCurrencyRate: mocks.rate }));

import { reconcilePaidSessions } from "@/lib/stripe/reconciliation";

const paidSession = (overrides: Record<string, unknown> = {}) => ({
  id: "cs_live_sgd129",
  object: "checkout.session",
  created: 1_763_000_000,
  payment_status: "paid",
  status: "complete",
  amount_total: 12900,
  currency: "sgd",
  customer_details: { email: "Donor@Example.com", name: "Ada Lovelace" },
  metadata: {
    campaign_id: "campaign-1",
    frequency: "one_time",
    donor_first_name: "Ada",
    donor_last_name: "Lovelace",
    donor_email: "donor@example.com",
    display_name: "Ada L.",
    is_anonymous: "false",
    charged_currency: "SGD",
    charged_donation_amount_cents: "12900",
    charged_fee_amount_cents: "0",
    usd_exchange_rate: "1.27",
  },
  subscription: null,
  payment_intent: "pi_1",
  customer: "cus_1",
  ...overrides,
});

describe("reconcilePaidSessions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});

    mocks.from.mockReturnValue(mocks);
    mocks.select.mockReturnValue(mocks);
    mocks.insert.mockResolvedValue({ error: null });
    mocks.update.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    mocks.eq.mockReturnValue(mocks);
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    mocks.getOrCreateDonor.mockResolvedValue("donor-1");
    mocks.rate.mockResolvedValue(1.27);
    mocks.list.mockResolvedValue({ data: [], has_more: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes a donation row for a paid session the webhook never recorded", async () => {
    mocks.list.mockResolvedValue({ data: [paidSession()], has_more: false });

    const result = await reconcilePaidSessions({ sinceSeconds: 1_762_000_000, apply: true });

    expect(result.backfilled).toBe(1);
    expect(result.unattributed).toHaveLength(0);

    const payload = mocks.insert.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      campaign_id: "campaign-1",
      donor_id: "donor-1",
      display_name: "Ada L.",
      charged_amount_cents: 12900,
      charged_currency: "SGD",
      charged_total_amount_cents: 12900,
      stripe_checkout_session_id: "cs_live_sgd129",
      status: "succeeded",
      frequency: "one_time",
    });
    expect(payload.amount_cents).toBe(10157);
    expect(payload.total_amount_cents).toBe(10157);
  });

  it("backfills the gift even when the schema refuses the charged currency", async () => {
    mocks.list.mockResolvedValue({ data: [paidSession()], has_more: false });
    mocks.insert
      .mockResolvedValueOnce({
        error: { code: "23514", message: "new row for relation \"donations\" violates check constraint" },
      })
      .mockResolvedValueOnce({ error: null });

    const result = await reconcilePaidSessions({ sinceSeconds: 1_762_000_000, apply: true });

    expect(result.backfilled).toBe(1);
    expect(mocks.insert).toHaveBeenCalledTimes(2);

    const retried = mocks.insert.mock.calls[1][0] as Record<string, unknown>;
    expect(retried).toMatchObject({
      charged_amount_cents: null,
      charged_fee_amount_cents: null,
      charged_total_amount_cents: null,
      charged_currency: null,
      stripe_checkout_session_id: "cs_live_sgd129",
    });
    expect(retried.amount_cents).toBe(10157);
  });

  it("leaves an existing donation untouched", async () => {
    mocks.list.mockResolvedValue({ data: [paidSession()], has_more: false });
    mocks.maybeSingle.mockResolvedValue({ data: { id: "donation-1" }, error: null });

    const result = await reconcilePaidSessions({ sinceSeconds: 1_762_000_000, apply: true });

    expect(result.alreadyRecorded).toBe(1);
    expect(result.backfilled).toBe(0);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("completes a row that was stored without its charged currency", async () => {
    mocks.list.mockResolvedValue({ data: [paidSession()], has_more: false });
    mocks.maybeSingle.mockResolvedValue({
      data: { id: "donation-1", charged_currency: null },
      error: null,
    });

    const result = await reconcilePaidSessions({ sinceSeconds: 1_762_000_000, apply: true });

    expect(result.alreadyRecorded).toBe(1);
    expect(result.labelsRepaired).toBe(1);
    expect(result.backfilled).toBe(0);

    const patch = mocks.update.mock.calls[0][0] as Record<string, unknown>;
    expect(patch).toMatchObject({
      charged_amount_cents: 12900,
      charged_currency: "SGD",
      charged_total_amount_cents: 12900,
      usd_exchange_rate: 1.27,
    });
  });

  it("leaves a row that already carries its charged currency alone", async () => {
    mocks.list.mockResolvedValue({ data: [paidSession()], has_more: false });
    mocks.maybeSingle.mockResolvedValue({
      data: { id: "donation-1", charged_currency: "SGD" },
      error: null,
    });

    const result = await reconcilePaidSessions({ sinceSeconds: 1_762_000_000, apply: true });

    expect(result.labelsRepaired).toBe(0);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("reports a paid session that carries no campaign metadata instead of inventing one", async () => {
    mocks.list.mockResolvedValue({
      data: [paidSession({ metadata: { donor_email: "donor@example.com" } })],
      has_more: false,
    });

    const result = await reconcilePaidSessions({ sinceSeconds: 1_762_000_000, apply: true });

    expect(result.unattributed).toEqual([
      {
        sessionId: "cs_live_sgd129",
        chargedAmountMinor: 12900,
        currency: "SGD",
        donorEmail: "donor@example.com",
        createdAt: new Date(1_763_000_000 * 1000).toISOString(),
      },
    ]);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("ignores sessions that were not paid", async () => {
    mocks.list.mockResolvedValue({
      data: [paidSession({ payment_status: "unpaid" })],
      has_more: false,
    });

    const result = await reconcilePaidSessions({ sinceSeconds: 1_762_000_000, apply: true });

    expect(result.scanned).toBe(1);
    expect(result.paid).toBe(0);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("does not write when running as a dry run", async () => {
    mocks.list.mockResolvedValue({ data: [paidSession()], has_more: false });

    const result = await reconcilePaidSessions({ sinceSeconds: 1_762_000_000, apply: false });

    expect(result.backfilled).toBe(0);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});

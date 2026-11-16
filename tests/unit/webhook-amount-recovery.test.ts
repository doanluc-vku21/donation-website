// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  retrieve: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  from: vi.fn(),
  maybeSingle: vi.fn(),
  getOrCreateDonor: vi.fn(),
  rate: vi.fn(),
  sendMetaPurchase: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/stripe/server", () => ({
  stripe: {
    webhooks: { constructEvent: mocks.constructEvent },
    checkout: { sessions: { retrieve: mocks.retrieve, update: mocks.update } },
    subscriptions: { update: vi.fn() },
  },
}));
vi.mock("@/lib/meta/server", () => ({ metaCapiEnabled: () => false, sendMetaPurchase: mocks.sendMetaPurchase }));
vi.mock("@/lib/resend", () => ({ resend: { emails: { send: vi.fn().mockResolvedValue({ id: "email-1" }) } } }));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock("@/lib/queries/donors", () => ({ getOrCreateDonor: mocks.getOrCreateDonor }));
vi.mock("@/lib/exchange-rate", () => ({ getUsdToCurrencyRate: mocks.rate }));

import { POST } from "@/app/api/webhooks/stripe/route";

const metadataWithoutAmounts = {
  campaign_id: "campaign-1",
  campaign_slug: "help-gaza",
  campaign_path: "/help-gaza",
  frequency: "one_time",
  donor_email: "donor@example.com",
  donor_first_name: "Ada",
  donor_last_name: "Lovelace",
  display_name: "Ada L.",
  is_anonymous: "false",
};

const paidSession = {
  id: "cs_live_sgd_recovered",
  object: "checkout.session",
  payment_status: "paid",
  status: "complete",
  livemode: true,
  created: 1_763_000_000,
  amount_total: 12900,
  currency: "sgd",
  customer: "cus_1",
  payment_intent: "pi_1",
  subscription: null,
  customer_details: { email: "donor@example.com", name: "Ada Lovelace" },
  metadata: metadataWithoutAmounts,
};

const request = () =>
  new Request("https://donate.example/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": "unit-test-signature" },
    body: "{}",
  });

describe("paid sessions are recorded even without multi-currency metadata", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "fake-unit-test-secret");
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    const query: Record<string, unknown> = {};
    for (const method of ["select", "eq", "is", "or", "update", "ilike"]) {
      query[method] = vi.fn(() => query);
    }
    query.maybeSingle = mocks.maybeSingle;
    query.insert = mocks.insert;
    mocks.from.mockReturnValue(query);

    mocks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      created: 1_763_000_010,
      data: { object: paidSession },
    });
    mocks.retrieve.mockResolvedValue(paidSession);
    mocks.update.mockResolvedValue({});
    mocks.insert.mockReturnValue({ ...query, select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: "donation-1" }, error: null }) })) });
    mocks.getOrCreateDonor.mockResolvedValue("donor-1");
    mocks.rate.mockResolvedValue(1.27);
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("records the gift even when the schema refuses the charged currency", async () => {
    const rejecting = {
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: "23514",
            message: 'new row for relation "donations" violates check constraint',
          },
        }),
      })),
    };
    const accepting = {
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: { id: "donation-2" }, error: null }),
      })),
    };
    mocks.insert.mockReturnValueOnce(rejecting).mockReturnValueOnce(accepting);

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mocks.insert).toHaveBeenCalledTimes(2);

    const retried = mocks.insert.mock.calls[1][0] as Record<string, unknown>;
    expect(retried).toMatchObject({
      charged_amount_cents: null,
      charged_fee_amount_cents: null,
      charged_total_amount_cents: null,
      charged_currency: null,
      usd_exchange_rate: 1.27,
      stripe_checkout_session_id: "cs_live_sgd_recovered",
      status: "succeeded",
    });
    expect(retried.amount_cents).toBe(10157);
  });

  it("falls back to the amount Stripe actually charged and re-derives the USD figures", async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mocks.rate).toHaveBeenCalledWith("SGD");

    const payload = mocks.insert.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      campaign_id: "campaign-1",
      donor_id: "donor-1",
      charged_amount_cents: 12900,
      charged_fee_amount_cents: 0,
      charged_total_amount_cents: 12900,
      charged_currency: "SGD",
      usd_exchange_rate: 1.27,
      stripe_checkout_session_id: "cs_live_sgd_recovered",
      frequency: "one_time",
      status: "succeeded",
    });
    expect(payload.amount_cents).toBe(10157);
    expect(payload.total_amount_cents).toBe(10157);
  });

  it("still refuses a session it cannot price at all", async () => {
    mocks.retrieve.mockResolvedValue({ ...paidSession, amount_total: null, metadata: metadataWithoutAmounts });
    mocks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      created: 1_763_000_010,
      data: { object: { ...paidSession, amount_total: null } },
    });

    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});

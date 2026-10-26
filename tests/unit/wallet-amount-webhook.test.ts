// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  event: vi.fn(), subscription: vi.fn(), sync: vi.fn(), list: vi.fn(), from: vi.fn(), insert: vi.fn(), existing: false,
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/stripe/server", () => ({ stripe: {
  webhooks: { constructEvent: mocks.event },
  subscriptions: { retrieve: mocks.subscription, update: mocks.sync },
  checkout: { sessions: { list: mocks.list } },
} }));
vi.mock("@/lib/meta/server", () => ({ metaCapiEnabled: () => false }));
vi.mock("@/lib/exchange-rate", () => ({ getUsdToCurrencyRate: () => Promise.resolve(0.8) }));
vi.mock("@/lib/resend", () => ({ resend: { emails: { send: vi.fn() } } }));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: mocks.from } }));
import { POST } from "@/app/api/webhooks/stripe/route";

const oldMetadata = {
  checkout_source: "express_amount_step", campaign_id: "campaign", charged_currency: "GBP", frequency: "monthly",
  charged_donation_amount_cents: "5000", charged_fee_amount_cents: "0", charged_total_amount_cents: "5000",
  normalized_donation_usd_cents: "6250", normalized_fee_usd_cents: "0", normalized_total_usd_cents: "6250",
  usd_exchange_rate: "0.8", donor_email: "unit@example.org", donor_first_name: "Test", is_anonymous: "false",
};
const finalMetadata = { ...oldMetadata,
  charged_donation_amount_cents: "8000", charged_fee_amount_cents: "256", charged_total_amount_cents: "8256",
  normalized_donation_usd_cents: "10000", normalized_fee_usd_cents: "320", normalized_total_usd_cents: "10320",
};
const completedSession = { id: "cs_unit", subscription: "sub_unit", payment_status: "paid", created: 1700000000,
  currency: "gbp", amount_total: 8256, metadata: finalMetadata };
const invoice = { id: "in_unit", parent: { subscription_details: { subscription: "sub_unit" } },
  billing_reason: "subscription_create", currency: "gbp", amount_paid: 8256, created: 1700000000 };
function request() {
  return new Request("https://example.org/api/webhooks/stripe", {
    method: "POST", headers: { "stripe-signature": "unit" }, body: "{}",
  });
}

beforeEach(() => {
  vi.clearAllMocks(); mocks.existing = false;
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "fake_unit_secret");
  vi.spyOn(console, "error").mockImplementation(() => {}); vi.spyOn(console, "log").mockImplementation(() => {});
  mocks.event.mockReturnValue({ type: "invoice.payment_succeeded", data: { object: invoice } });
  mocks.subscription.mockResolvedValue({ id: "sub_unit", metadata: oldMetadata });
  mocks.list.mockResolvedValue({ data: [completedSession] });
  mocks.from.mockImplementation((table) => {
    const query: Record<string, unknown> = {};
    for (const method of ["select", "eq", "is", "or", "update", "ilike"]) query[method] = () => query;
    query.insert = (data: unknown) => { mocks.insert(table, data); return query; };
    query.single = () => Promise.resolve({ data: { id: "donation_unit" }, error: null });
    let updating = false;
    query.update = () => { updating = true; return query; };
    query.maybeSingle = () => Promise.resolve({ data: table === "donors" ? { id: "donor_unit" } : !updating && mocks.existing ? { id: "donation_existing" } : null, error: null });
    return query;
  });
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("monthly accounting after a wallet amount update", () => {
  it("uses the final Session amounts if the initial invoice arrives before checkout completion", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(mocks.insert).toHaveBeenCalledWith("donations", expect.objectContaining({
      charged_amount_cents: 8000, charged_fee_amount_cents: 256, charged_total_amount_cents: 8256,
      amount_cents: 10000, fee_amount_cents: 320, total_amount_cents: 10320,
      charged_currency: "GBP", currency: "USD", stripe_checkout_session_id: "cs_unit",
    }));
  });
  it("still copies final metadata for renewals when the invoice already saved the donation", async () => {
    mocks.existing = true;
    mocks.event.mockReturnValue({ type: "checkout.session.completed", data: { object: completedSession } });
    expect((await POST(request())).status).toBe(200);
    expect(mocks.sync).toHaveBeenCalledWith("sub_unit", { metadata: expect.objectContaining(finalMetadata) });
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("returns a retryable error instead of recording a stale first amount if its Session is not available yet", async () => {
    mocks.list.mockResolvedValue({ data: [] });
    expect((await POST(request())).status).toBe(500);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("uses final subscription metadata for renewal invoices without looking up an initial Session", async () => {
    mocks.subscription.mockResolvedValue({ id: "sub_unit", metadata: finalMetadata });
    mocks.event.mockReturnValue({ type: "invoice.payment_succeeded", data: { object: { ...invoice, billing_reason: "subscription_cycle" } } });
    expect((await POST(request())).status).toBe(200);
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.insert).toHaveBeenCalledWith("donations", expect.objectContaining({ charged_amount_cents: 8000, stripe_checkout_session_id: null }));
  });
});

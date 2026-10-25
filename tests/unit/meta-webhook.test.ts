// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(), retrieve: vi.fn(), update: vi.fn(),
  send: vi.fn(), maybeSingle: vi.fn(), from: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/stripe/server", () => ({ stripe: {
  webhooks: { constructEvent: mocks.constructEvent },
  checkout: { sessions: { retrieve: mocks.retrieve, update: mocks.update } },
} }));
vi.mock("@/lib/meta/server", () => ({ metaCapiEnabled: () => true, sendMetaPurchase: mocks.send }));
vi.mock("@/lib/resend", () => ({ resend: { emails: { send: vi.fn() } } }));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: mocks.from } }));

import { POST } from "@/app/api/webhooks/stripe/route";

const paidSession = {
  id: "cs_webhook", payment_status: "paid", currency: "usd", amount_total: 2000,
  created: 1700000000, livemode: true,
  metadata: { campaign_id: "campaign-test", donor_email: "test@example.com", donor_first_name: "Test",
    charged_donation_amount_cents: "2000", charged_fee_amount_cents: "0",
    normalized_donation_usd_cents: "2000", normalized_fee_usd_cents: "0", normalized_total_usd_cents: "2000",
    usd_exchange_rate: "1" },
};
function request(signature = true) {
  return new Request("https://donate.example/api/webhooks/stripe", {
    method: "POST", headers: signature ? { "stripe-signature": "unit-test-signature" } : {}, body: "{}",
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "fake-unit-test-secret");
  mocks.constructEvent.mockReturnValue({ type: "checkout.session.completed", created: 1700000010, data: { object: paidSession } });
  mocks.retrieve.mockResolvedValue(paidSession);
  mocks.update.mockResolvedValue({});
  mocks.send.mockResolvedValue(true);
  // Donation already exists; receipt was already claimed/sent. This verifies
  // delivery still runs on retries, without re-inserting or emailing anything.
  const query: Record<string, unknown> = {};
  for (const method of ["select", "eq", "is", "or", "update"]) query[method] = vi.fn(() => query);
  query.maybeSingle = mocks.maybeSingle;
  mocks.from.mockReturnValue(query);
  mocks.maybeSingle.mockResolvedValueOnce({ data: { id: "donation-existing" }, error: null })
    .mockResolvedValueOnce({ data: null, error: null });
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("signed Stripe webhook and Meta delivery", () => {
  it("sends after the existing-donation path, using the original event time, and records acceptance", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(mocks.send).toHaveBeenCalledWith(paidSession, 1700000010);
    expect(mocks.update).toHaveBeenCalledWith("cs_webhook", {
      metadata: { meta_purchase_sent_at: expect.any(String) },
    });
  });
  it("reads a fresh marker instead of replaying the immutable webhook snapshot", async () => {
    mocks.retrieve.mockResolvedValue({ ...paidSession, metadata: { ...paidSession.metadata, meta_purchase_sent_at: "already-sent" } });
    expect((await POST(request())).status).toBe(200);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("returns 500 on delivery failure so Stripe retries even though the donation exists", async () => {
    mocks.send.mockRejectedValue(new Error("Meta CAPI unavailable"));
    expect((await POST(request())).status).toBe(500);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("does not record delivery for a skipped sandbox event", async () => {
    mocks.send.mockResolvedValue(false);
    expect((await POST(request())).status).toBe(200);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("does not send unpaid, missing-signature or invalid-signature events", async () => {
    mocks.constructEvent.mockReturnValueOnce({ type: "checkout.session.completed", data: { object: { ...paidSession, payment_status: "unpaid" } } });
    expect((await POST(request())).status).toBe(200);
    expect((await POST(request(false))).status).toBe(400);
    mocks.constructEvent.mockImplementationOnce(() => { throw new Error("invalid signature"); });
    expect((await POST(request())).status).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.retrieve).not.toHaveBeenCalled();
  });
});

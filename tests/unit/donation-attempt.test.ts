// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(), select: vi.fn(), eq: vi.fn(), ilike: vi.fn(), is: vi.fn(), gte: vi.fn(),
  order: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn(), insert: vi.fn(), update: vi.fn(), single: vi.fn(),
  stripeUpdate: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock("@/lib/stripe/server", () => ({ stripe: { checkout: { sessions: { update: mocks.stripeUpdate } } } }));
import { saveDonationAttempt } from "@/lib/donation-attempt";
import { PATCH, POST } from "@/app/api/donation-attempt/route";
import { buildMetaUserData } from "@/lib/meta/server";

const body = { campaignId: "campaign-unit", campaignSlug: "akram-shake", campaignPath: "/akram-shake-1",
  email: " Unit@Example.com ", firstName: "", lastName: "", amountCents: 2500, currency: "USD" as const, frequency: "monthly" as const };

beforeEach(() => {
  vi.resetAllMocks();
  for (const name of ["from", "select", "eq", "ilike", "is", "gte", "order", "limit", "insert", "update"] as const) {
    mocks[name].mockReturnValue(mocks);
  }
  mocks.maybeSingle.mockResolvedValueOnce({ data: { id: "campaign-unit", slug: "akram-shake" }, error: null })
    .mockResolvedValue({ data: null, error: null });
  mocks.single.mockResolvedValue({ data: { id: "attempt-unit", status: "pending", created_at: "2026-11-02T00:00:00Z" }, error: null });
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); });

describe("shared donation-attempt persistence", () => {
  it("retains the original API response, normalized email, optional names and pending reminder state", async () => {
    const response = await POST(new Request("https://example.org/api/donation-attempt", { method: "POST", body: JSON.stringify(body) }));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ attemptId: "attempt-unit", reused: false });
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ campaign_id: "campaign-unit", email: "unit@example.com",
      first_name: null, last_name: null, amount_cents: 2500, currency: "USD", frequency: "monthly", status: "pending", reminder_sent_at: null }));
    expect(mocks.eq).toHaveBeenCalledWith("is_active", true);
  });

  it("reuses the recent pending attempt and retains reminder claiming filters", async () => {
    mocks.maybeSingle.mockReset().mockResolvedValueOnce({ data: { id: "campaign-unit" }, error: null })
      .mockResolvedValueOnce({ data: { id: "attempt-unit" }, error: null });
    const response = await saveDonationAttempt({ ...body, firstName: " Ada ", amountCents: 5000 });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ attemptId: "attempt-unit", reused: true });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ first_name: "Ada", amount_cents: 5000 }));
    expect(mocks.eq).toHaveBeenCalledWith("status", "pending");
    expect(mocks.is).toHaveBeenCalledWith("reminder_sent_at", null);
  });

  it("rejects invalid email before any database operation", async () => {
    expect((await saveDonationAttempt({ ...body, email: "invalid" })).status).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejects an inactive or mismatched campaign before saving an attempt", async () => {
    mocks.maybeSingle.mockReset().mockResolvedValue({ data: null, error: null });
    expect((await saveDonationAttempt(body)).status).toBe(404);
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("retains recoverable lookup and insert errors instead of inventing a successful attempt", async () => {
    mocks.single.mockResolvedValue({ data: null, error: { code: "unit" } });
    const response = await saveDonationAttempt(body);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Unable to save donation attempt." });
  });

  it("does not create a second attempt after a failed lookup", async () => {
    mocks.maybeSingle.mockReset().mockResolvedValueOnce({ data: { id: "campaign-unit" }, error: null })
      .mockResolvedValueOnce({ data: null, error: { code: "unit" } });
    expect((await saveDonationAttempt(body)).status).toBe(500);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("writes donor first name, last name, email, and display name to Stripe Session metadata on PATCH so Meta CAPI receives em/fn/ln", async () => {
    mocks.maybeSingle.mockReset().mockResolvedValueOnce({
      data: {
        id: "attempt-unit",
        status: "pending",
        email: "jane@example.com",
        first_name: "Jane",
        last_name: "Doe",
      },
      error: null,
    });
    mocks.stripeUpdate.mockResolvedValue({});

    const response = await PATCH(new Request("https://example.org/api/donation-attempt", {
      method: "PATCH",
      headers: {
        cookie: "_fbp=fb.1.1700000000000.12345",
        "user-agent": "unit-browser",
      },
      body: JSON.stringify({
        attemptId: "attempt-unit",
        stripeCheckoutSessionId: "cs_card_embedded",
        donor: { firstName: "Jane", lastName: "Doe", email: "jane@example.com", displayPublicly: true },
      }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.stripeUpdate).toHaveBeenCalledWith("cs_card_embedded", {
      metadata: expect.objectContaining({
        donation_attempt_id: "attempt-unit",
        donor_first_name: "Jane",
        donor_last_name: "Doe",
        donor_email: "jane@example.com",
        display_name: "Jane D.",
        is_anonymous: "false",
        meta_fbp: "fb.1.1700000000000.12345",
        meta_user_agent: "unit-browser",
      }),
    });

    const updatedMetadata = mocks.stripeUpdate.mock.calls[0][1].metadata;
    const metaUserData = buildMetaUserData({
      id: "cs_card_embedded",
      payment_status: "paid",
      amount_total: 2000,
      currency: "usd",
      livemode: true,
      metadata: updatedMetadata,
    } as never);
    expect(metaUserData).toMatchObject({
      em: [expect.stringMatching(/^[a-f0-9]{64}$/)],
      fn: [expect.stringMatching(/^[a-f0-9]{64}$/)],
      ln: [expect.stringMatching(/^[a-f0-9]{64}$/)],
      fbp: "fb.1.1700000000000.12345",
      client_user_agent: "unit-browser",
    });
  });
});

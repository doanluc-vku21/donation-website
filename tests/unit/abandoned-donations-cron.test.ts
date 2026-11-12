// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  is: vi.fn(),
  lte: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  maybeSingle: vi.fn(),
  stripeRetrieve: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock("@/lib/stripe/server", () => ({
  stripe: { checkout: { sessions: { retrieve: mocks.stripeRetrieve } } },
}));
vi.mock("@/lib/resend", () => ({
  resend: { emails: { send: mocks.sendEmail } },
}));

import { GET } from "@/app/api/cron/abandoned-donations/route";

const baseAttempt = {
  id: "ed2e759f3cfa",
  campaign_id: "campaign-1",
  campaign_slug: "akram-shake",
  campaign_path: "/akram-shake",
  email: "donor@example.com",
  first_name: "Ada",
  last_name: "Lovelace",
  amount_cents: 2500,
  currency: "USD",
  frequency: "one_time" as const,
  status: "pending" as const,
  stripe_checkout_session_id: "cs_test_a1KUreTim8ukY9Ux5PYpg9oBZnSejp5dZuaeVpuExeoZBhZe8E1NMaehaw",
  reminder_sent_at: null,
  created_at: "2026-11-12T00:00:00.000Z",
};

describe("abandoned-donations cron route", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = {
      ...originalEnv,
      CRON_SECRET: "cron-secret-test",
      STRIPE_SECRET_KEY: "sk_live_test_key",
    };

    for (const name of ["from", "select", "update", "eq", "is", "lte", "order"] as const) {
      mocks[name].mockReturnValue(mocks);
    }
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("skips cross-mode test Checkout Sessions under a live Stripe key without calling Stripe or releasing the claim", async () => {
    mocks.limit.mockResolvedValueOnce({ data: [baseAttempt], error: null });
    mocks.maybeSingle.mockResolvedValueOnce({ data: baseAttempt, error: null });

    const response = await GET(
      new Request("https://donate.mealsupport.org/api/cron/abandoned-donations", {
        headers: { authorization: "Bearer cron-secret-test" },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      checked: 1,
      sent: 0,
      results: [{ id: baseAttempt.id, result: "skipped_cross_mode_session" }],
    });
    expect(mocks.stripeRetrieve).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledTimes(1);
  });

  it("does not release the reminder claim or retry endlessly when Stripe returns resource_missing (404)", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_same_mode";
    mocks.limit.mockResolvedValueOnce({ data: [baseAttempt], error: null });
    mocks.maybeSingle.mockResolvedValueOnce({ data: baseAttempt, error: null });
    mocks.stripeRetrieve.mockRejectedValueOnce(
      Object.assign(new Error("No such checkout.session"), {
        type: "StripeInvalidRequestError",
        code: "resource_missing",
        statusCode: 404,
      }),
    );

    const response = await GET(
      new Request("https://donate.mealsupport.org/api/cron/abandoned-donations", {
        headers: { authorization: "Bearer cron-secret-test" },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      checked: 1,
      sent: 0,
      results: [{ id: baseAttempt.id, result: "skipped_missing_stripe_session" }],
    });
    expect(mocks.stripeRetrieve).toHaveBeenCalledWith(baseAttempt.stripe_checkout_session_id);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    // Claim update only; no second update releasing reminder_sent_at back to null
    expect(mocks.update).toHaveBeenCalledTimes(1);
  });

  it("releases the reminder claim when Stripe fails with a transient error so later cron runs can retry", async () => {
    const liveAttempt = { ...baseAttempt, stripe_checkout_session_id: "cs_live_transient_error" };
    mocks.limit.mockResolvedValueOnce({ data: [liveAttempt], error: null });
    mocks.maybeSingle.mockResolvedValueOnce({ data: liveAttempt, error: null });
    mocks.stripeRetrieve.mockRejectedValueOnce(
      Object.assign(new Error("Stripe rate limit"), {
        type: "StripeRateLimitError",
        statusCode: 429,
      }),
    );

    const response = await GET(
      new Request("https://donate.mealsupport.org/api/cron/abandoned-donations", {
        headers: { authorization: "Bearer cron-secret-test" },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      checked: 1,
      sent: 0,
      results: [{ id: liveAttempt.id, result: "stripe_verification_failed" }],
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    // Claim update + releaseReminderClaim update
    expect(mocks.update).toHaveBeenCalledTimes(2);
    expect(mocks.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ reminder_sent_at: null }),
    );
  });
});

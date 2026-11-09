// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), rate: vi.fn(), attempt: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/stripe/server", () => ({ stripe: { checkout: { sessions: { create: mocks.create } } } }));
vi.mock("@/lib/exchange-rate", () => ({ getUsdToCurrencyRate: mocks.rate }));
vi.mock("@/lib/donation-attempt", () => ({ saveDonationAttempt: mocks.attempt }));

import { POST as cardCheckout } from "@/app/api/stripe/checkout/route";
import { POST as walletCheckout } from "@/app/api/stripe/express-checkout/route";
import { POST as hostedCheckout } from "@/app/api/stripe/hosted-checkout/route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rate.mockImplementation(async (currency: string) => currency === "USD" ? 1 : 0.8);
  mocks.create.mockResolvedValue({ id: "cs_monthly", client_secret: "unit_secret" });
  mocks.attempt.mockImplementation(async () => new Response(JSON.stringify({ attemptId: "attempt-unit" }), { status: 201 }));
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); });

const pages = [
  { campaignSlug: "give-a-child-a-brighter-tomorrow", campaignPath: "/gaza-food" },
  { campaignSlug: "give-a-child-a-brighter-tomorrow", campaignPath: "/gaza-food/donate" },
  { campaignSlug: "akram-shake", campaignPath: "/akram-shake-3" },
  { campaignSlug: "akram-shake", campaignPath: "/akram-shake-1" },
];

function request(page: (typeof pages)[number], changes: Record<string, unknown> = {}): Request {
  return new Request("https://example.org/api/stripe/checkout", {
    method: "POST",
    body: JSON.stringify({ campaignId: "campaign-unit", ...page, amountCents: 2500,
      frequency: "monthly", currency: "USD", coverFee: false, locale: "en", displayPublicly: true, ...changes }),
  });
}

describe.each([["card", cardCheckout], ["wallet", walletCheckout]] as const)("monthly campaign %s checkout", (_name, checkout) => {
  it.each(["help-mango-seller", "help-street-vendor"].flatMap(slug =>
    (["monthly", "one_time"] as const).map(frequency => ({ slug, frequency }))
  ))("keeps $slug $frequency payments separate with the same amount and fee behavior", async ({ slug, frequency }) => {
    const page = { campaignSlug: slug, campaignPath: `/${slug}` };
    const campaignId = `campaign-${slug}`;
    const minimum = 1600;
    expect((await checkout(request(page, { campaignId, frequency, amountCents: minimum - 1, currency: "GBP" }))).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
    const response = await checkout(request(page, { campaignId, frequency, amountCents: 3333, currency: "GBP", coverFee: true }));
    expect(response.status).toBe(200);
    const options = mocks.create.mock.calls[0][0];
    expect(options.mode).toBe(frequency === "monthly" ? "subscription" : "payment");
    expect(options.metadata).toMatchObject({ campaign_id: campaignId, campaign_slug: slug, campaign_path: `/${slug}`, frequency, charged_donation_amount_cents: "3333" });
    expect(options.line_items[0].price_data.unit_amount).toBeGreaterThan(3333);
    expect(options.line_items[0].price_data.currency).toBe("gbp");
    if (frequency === "monthly") expect(options.subscription_data.metadata).toEqual(options.metadata);
  });

  it.each(["monthly", "one_time"])("enforces the Ryan minimum for %s without changing other entry pages", async (frequency) => {
    const page = { campaignSlug: "akram-shake", campaignPath: "/akram-shake-2" };
    for (const selection of [{ currency: "USD", amountCents: frequency === "monthly" ? 1999 : 2499 }, { currency: "GBP", amountCents: frequency === "monthly" ? 1599 : 1999 }]) {
      expect((await checkout(request(page, { ...selection, frequency }))).status).toBe(400);
      expect(mocks.create).not.toHaveBeenCalled();
    }
    expect((await checkout(request(page, { currency: "GBP", amountCents: frequency === "monthly" ? 1600 : 2000, frequency }))).status).toBe(200);
    expect((await checkout(request({ ...page, campaignPath: "/akram-shake" }, { amountCents: 1000, frequency }))).status).toBe(200);
  });

  it.each([false, true])("enforces the mango seller's $20 one-time minimum before fees (cover fee: %s)", async coverFee => {
    const page = { campaignSlug: "help-mango-seller", campaignPath: "/help-mango-seller" };
    for (const selection of [{ currency: "USD", amountCents: 2000 }, { currency: "GBP", amountCents: 1600 }]) {
      mocks.create.mockClear();
      for (const amountCents of [selection.amountCents / 2, selection.amountCents - 1]) {
        const rejected = await checkout(request(page, { ...selection, amountCents, frequency: "one_time", coverFee }));
        expect(rejected.status).toBe(400);
        expect(await rejected.json()).toEqual({ error: "Minimum donation is $20 or its equivalent in the selected currency." });
        expect(mocks.create).not.toHaveBeenCalled();
      }
      const result = await checkout(request(page, { ...selection, frequency: "one_time", coverFee }));
      expect(result.status).toBe(200);
      const data = await result.json();
      expect(mocks.create).toHaveBeenCalledOnce();
      const options = mocks.create.mock.calls[0][0];
      expect(options.mode).toBe("payment");
      expect(options.line_items[0].price_data.recurring).toBeUndefined();
      expect(data.donationAmountMinor).toBe(selection.amountCents);
      expect(data.totalAmountMinor).toBe(selection.amountCents + data.feeAmountMinor);
      expect(data.feeAmountMinor > 0).toBe(coverFee);
      expect(options.line_items[0].price_data.unit_amount).toBe(data.totalAmountMinor);
      expect(options.metadata).toMatchObject({ campaign_path: "/help-mango-seller", frequency: "one_time",
        charged_donation_amount_cents: String(selection.amountCents), charged_currency: selection.currency });
    }
  });

  it.each(["help-mango-seller", "help-street-vendor"])("does not allow %s to bypass its $20 minimum by supplying another page URL", async (campaignSlug) => {
    const result = await checkout(request({ campaignSlug, campaignPath: "/akram-shake" },
      { frequency: "one_time", amountCents: 1000 }));
    expect(result.status).toBe(400);
    expect(await result.json()).toEqual({ error: "Minimum donation is $20 or its equivalent in the selected currency." });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each(pages)("rejects one-time gifts for $campaignPath before creating a Stripe Session", async (page) => {
    const result = await checkout(request(page, { frequency: "one_time" }));
    expect(result.status).toBe(400);
    expect(await result.json()).toEqual({ error: "This page accepts monthly donations only." });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each(pages)("creates a monthly subscription for $campaignPath with the correct accounting and return path", async (page) => {
    const result = await checkout(request(page));
    expect(result.status).toBe(200);
    const options = mocks.create.mock.calls[0][0];
    expect(options.mode).toBe("subscription");
    expect(options.line_items[0].price_data).toMatchObject({ currency: "usd", unit_amount: 2500, recurring: { interval: "month" } });
    expect(options.metadata).toMatchObject({ campaign_slug: page.campaignSlug,
      campaign_path: page.campaignPath === "/gaza-food/donate" ? "/gaza-food" : page.campaignPath,
      frequency: "monthly", charged_donation_amount_cents: "2500" });
    expect(options.subscription_data.metadata).toEqual(options.metadata);
  });

  it("preserves one-time gifts on the existing Akram entry page", async () => {
    const result = await checkout(request({ campaignSlug: "akram-shake", campaignPath: "/akram-shake-2" }, { frequency: "one_time" }));
    expect(result.status).toBe(200);
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ mode: "payment", metadata: { campaign_path: "/akram-shake-2", frequency: "one_time" } });
  });

  it("preserves custom local-currency amounts and fee contribution", async () => {
    const result = await checkout(request(pages[2], { amountCents: 3333, currency: "GBP", coverFee: true }));
    expect(result.status).toBe(200);
    const options = mocks.create.mock.calls[0][0];
    expect(options.mode).toBe("subscription");
    expect(options.line_items[0].price_data.currency).toBe("gbp");
    const response = await result.json();
    expect(response.donationAmountMinor).toBe(3333);
    expect(response.feeAmountMinor).toBeGreaterThan(0);
    expect(options.line_items[0].price_data.unit_amount).toBe(response.totalAmountMinor);
    expect(options.metadata.charged_donation_amount_cents).toBe("3333");
  });

  it.each([
    { campaignSlug: "akram-shake", campaignPath: "/akram-shake-2" },
    { campaignSlug: "help-mango-seller", campaignPath: "/help-mango-seller" },
    { campaignSlug: "help-street-vendor", campaignPath: "/help-street-vendor" },
  ])("allows twenty-dollar monthly gifts on $campaignPath without letting fees satisfy the minimum", async (page) => {
    for (const selection of [{ currency: "USD", amountCents: 2000 }, { currency: "GBP", amountCents: 1600 }]) {
      for (const amountCents of [selection.amountCents / 2, selection.amountCents - 1]) {
        const rejected = await checkout(request(page, { ...selection, amountCents, coverFee: true }));
        expect(rejected.status).toBe(400);
        expect(await rejected.json()).toEqual({ error: "Minimum donation is $20 or its equivalent in the selected currency." });
      }
      const result = await checkout(request(page, { ...selection, coverFee: true }));
      expect(result.status).toBe(200);
      const data = await result.json();
      const options = mocks.create.mock.calls.at(-1)![0];
      expect(options.mode).toBe("subscription");
      expect(options.line_items[0].price_data).toMatchObject({ recurring: { interval: "month" }, unit_amount: data.totalAmountMinor });
      expect(data.donationAmountMinor).toBe(selection.amountCents);
      expect(data.totalAmountMinor).toBeGreaterThan(selection.amountCents);
      expect(options.metadata.charged_donation_amount_cents).toBe(String(selection.amountCents));
    }
  });
});

describe("monthly-only direct Hosted Checkout", () => {
  const akram = { campaignSlug: "akram-shake", campaignPath: "/akram-shake-1" };
  const donor = { firstName: "Test", lastName: "Donor", email: "unit@example.com", displayPublicly: false };

  it("saves the attempt before Stripe in one endpoint and returns non-personal stage timings", async () => {
    let completeAttempt!: (value: Response) => void;
    mocks.attempt.mockReturnValue(new Promise<Response>((resolve) => { completeAttempt = resolve; }));
    mocks.create.mockResolvedValue({ id: "cs_combined", url: "https://checkout.stripe.com/c/pay/unit_combined" });
    const pending = hostedCheckout(request(akram, { prepareDonationAttempt: true, donor, currency: "GBP" }));
    await new Promise<void>((resolve) => { setTimeout(resolve, 0); });
    expect(mocks.rate).toHaveBeenCalledWith("GBP");
    expect(mocks.attempt).toHaveBeenCalledWith(expect.objectContaining({ campaignPath: "/akram-shake-1", email: "unit@example.com" }));
    expect(mocks.create).not.toHaveBeenCalled();
    completeAttempt(new Response(JSON.stringify({ attemptId: "attempt-prepared" }), { status: 201 }));
    const response = await pending;
    expect(response.status).toBe(200);
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ metadata: { donation_attempt_id: "attempt-prepared" },
      subscription_data: { metadata: { donation_attempt_id: "attempt-prepared" } } });
    const timings = response.headers.get("Server-Timing");
    expect(timings).toMatch(/donation_attempt;dur=[\d.]+/);
    expect(timings).toMatch(/exchange_rate;dur=[\d.]+/);
    expect(timings).toMatch(/stripe_session;dur=[\d.]+/);
    expect(timings).not.toContain("unit@example.com");
    expect(timings).not.toContain("attempt-prepared");
  });

  it("retains attempt-save failure recovery rather than creating an untracked Stripe Session", async () => {
    mocks.attempt.mockResolvedValue(new Response(JSON.stringify({ error: "Unable to save donation attempt." }), { status: 503 }));
    const response = await hostedCheckout(request(akram, { prepareDonationAttempt: true, donor }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Unable to save donation attempt." });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("finishes the attempt operation before returning an independent exchange-rate failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.rate.mockRejectedValue(new Error("Unit rate failure"));
    let completeAttempt!: (value: Response) => void;
    mocks.attempt.mockReturnValue(new Promise<Response>((resolve) => { completeAttempt = resolve; }));
    let settled = false;
    const pending = hostedCheckout(request(akram, { prepareDonationAttempt: true, donor, currency: "GBP" }));
    void pending.then(() => { settled = true; });
    await new Promise<void>((resolve) => { setTimeout(resolve, 0); });
    expect(settled).toBe(false);
    completeAttempt(new Response(JSON.stringify({ attemptId: "attempt-before-rate-error" })));
    expect((await pending).status).toBe(500);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("keeps repeated requests on one Stripe idempotency key and separates changed amounts", async () => {
    mocks.create.mockResolvedValue({ id: "cs_idempotent", url: "https://checkout.stripe.com/c/pay/unit_idempotent" });
    const options = { prepareDonationAttempt: true, checkoutRequestId: "c15a176b-6f2c-45df-893a-bec0508333d1", donor };
    expect((await hostedCheckout(request(akram, options))).status).toBe(200);
    expect((await hostedCheckout(request(akram, options))).status).toBe(200);
    expect((await hostedCheckout(request(akram, { ...options, amountCents: 5000 }))).status).toBe(200);
    const keys = mocks.create.mock.calls.map(([, init]) => init.idempotencyKey);
    expect(keys[0]).toMatch(/^hosted_[a-f0-9]{64}$/);
    expect(keys[1]).toBe(keys[0]);
    expect(keys[2]).not.toBe(keys[0]);
    expect(keys[0]).not.toContain(donor.email);
  });

  it("rejects an invalid request identity before saving attempts or creating a Session", async () => {
    expect((await hostedCheckout(request(akram, { prepareDonationAttempt: true, checkoutRequestId: "invalid", donor }))).status).toBe(400);
    expect(mocks.attempt).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each([
    { firstName: "", lastName: "" },
    { firstName: " Ada ", lastName: "" },
    { firstName: "", lastName: " Lovelace " },
    { firstName: "   ", lastName: "   " },
    {},
  ])("accepts omitted or partial Akram names without inventing donor metadata: %j", async (names) => {
    mocks.create.mockResolvedValue({ id: "cs_optional_names", url: "https://checkout.stripe.com/c/pay/unit_optional" });
    const response = await hostedCheckout(request(akram, { donor: { email: " Unit@Example.com ", displayPublicly: false, ...names } }));
    expect(response.status).toBe(200);
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ mode: "subscription", customer_email: "unit@example.com", metadata: {
      donor_first_name: names.firstName?.trim() ?? "", donor_last_name: names.lastName?.trim() ?? "",
      donor_email: "unit@example.com", display_name: "Anonymous", frequency: "monthly",
    } });
  });

  it.each([undefined, "", "invalid-email", "donor@"])("still rejects missing or invalid email when names are optional: %s", async (email) => {
    const response = await hostedCheckout(request(akram, { donor: { email } }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/email/i);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each([
    { campaignSlug: "give-a-child-a-brighter-tomorrow", campaignPath: "/gaza-help" },
    { campaignSlug: "child-health", campaignPath: "/child-health" },
  ])("retains required names for monthly Hosted Checkout on $campaignPath", async (page) => {
    const response = await hostedCheckout(request(page, { donor: { email: "unit@example.com" } }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("Please enter your name and email.");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each(["/akram-shake-1", undefined, "/untrusted-path"])("rejects one-time Akram checkout with requested path %s without contacting Stripe", async (campaignPath) => {
    const response = await hostedCheckout(request(akram, { campaignPath, frequency: "one_time", donor }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "This page accepts monthly donations only." });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each([
    { currency: "USD", amountCents: 2500, coverFee: false },
    { currency: "GBP", amountCents: 3333, coverFee: true },
  ])("preserves monthly Hosted Checkout, amounts, fees, and return paths for $currency", async (selection) => {
    mocks.create.mockResolvedValue({ id: "cs_hosted_monthly", url: "https://checkout.stripe.com/c/pay/unit_monthly" });
    const response = await hostedCheckout(request(akram, { ...selection, donor }));
    expect(response.status).toBe(200);
    const result = await response.json();
    const options = mocks.create.mock.calls[0][0];
    expect(options.mode).toBe("subscription");
    expect(options.ui_mode).toBeUndefined();
    expect(options.line_items[0].price_data).toMatchObject({
      currency: selection.currency.toLowerCase(), recurring: { interval: "month" }, unit_amount: result.totalAmountMinor,
    });
    expect(result.donationAmountMinor).toBe(selection.amountCents);
    expect(result.totalAmountMinor).toBe(selection.amountCents + result.feeAmountMinor);
    expect(result.feeAmountMinor).toBe(selection.coverFee ? 121 : 0);
    expect(options.metadata).toMatchObject({ campaign_slug: "akram-shake", campaign_path: "/akram-shake-1", frequency: "monthly" });
    expect(options.subscription_data.metadata).toEqual(options.metadata);
    expect(options.cancel_url).toMatch(/\/akram-shake-1$/);
    expect(options.success_url).toContain("/thank-you?session_id=");
    expect(result.url).toBe("https://checkout.stripe.com/c/pay/unit_monthly");
  });

  it.each([
    { campaignSlug: "give-a-child-a-brighter-tomorrow", campaignPath: "/gaza-help" },
    { campaignSlug: "child-health", campaignPath: "/child-health" },
  ])("preserves one-time Hosted Checkout on $campaignPath", async (page) => {
    mocks.create.mockResolvedValue({ id: "cs_hosted_once", url: "https://checkout.stripe.com/c/pay/unit_once" });
    expect((await hostedCheckout(request(page, { frequency: "one_time", donor }))).status).toBe(200);
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ mode: "payment", metadata: { campaign_path: page.campaignPath, frequency: "one_time" } });
  });
});

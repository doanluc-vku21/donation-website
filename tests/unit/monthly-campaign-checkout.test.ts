// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), rate: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/stripe/server", () => ({ stripe: { checkout: { sessions: { create: mocks.create } } } }));
vi.mock("@/lib/exchange-rate", () => ({ getUsdToCurrencyRate: mocks.rate }));

import { POST as cardCheckout } from "@/app/api/stripe/checkout/route";
import { POST as walletCheckout } from "@/app/api/stripe/express-checkout/route";
import { POST as hostedCheckout } from "@/app/api/stripe/hosted-checkout/route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rate.mockImplementation(async (currency: string) => currency === "USD" ? 1 : 0.8);
  mocks.create.mockResolvedValue({ id: "cs_monthly", client_secret: "unit_secret" });
});

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
});

describe("monthly-only direct Hosted Checkout", () => {
  const akram = { campaignSlug: "akram-shake", campaignPath: "/akram-shake-1" };
  const donor = { firstName: "Test", lastName: "Donor", email: "unit@example.com", displayPublicly: false };

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

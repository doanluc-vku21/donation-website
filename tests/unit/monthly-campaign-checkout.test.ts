// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), rate: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/stripe/server", () => ({ stripe: { checkout: { sessions: { create: mocks.create } } } }));
vi.mock("@/lib/exchange-rate", () => ({ getUsdToCurrencyRate: mocks.rate }));

import { POST as cardCheckout } from "@/app/api/stripe/checkout/route";
import { POST as walletCheckout } from "@/app/api/stripe/express-checkout/route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rate.mockResolvedValue(0.8);
  mocks.create.mockResolvedValue({ id: "cs_monthly", client_secret: "unit_secret" });
});

const pages = [
  { campaignSlug: "give-a-child-a-brighter-tomorrow", campaignPath: "/gaza-food" },
  { campaignSlug: "give-a-child-a-brighter-tomorrow", campaignPath: "/gaza-food/donate" },
  { campaignSlug: "akram-shake", campaignPath: "/akram-shake-3" },
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

// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ retrieve: vi.fn(), update: vi.fn(), create: vi.fn(), rate: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/stripe/server", () => ({ stripe: { checkout: { sessions: mocks } } }));
vi.mock("@/lib/exchange-rate", () => ({ getUsdToCurrencyRate: mocks.rate }));
import { POST } from "@/app/api/stripe/express-checkout/amount/route";
import { POST as CREATE } from "@/app/api/stripe/express-checkout/route";
import { signWalletUpdateContext, verifyWalletUpdateContext } from "@/lib/stripe/wallet-update-context";

const session = () => ({
  id: "cs_unit_amount", client_secret: "unit_secret", status: "open", payment_status: "unpaid",
  ui_mode: "elements", currency: "usd", mode: "subscription",
  metadata: { checkout_source: "express_amount_step", charged_currency: "USD", charged_fee_amount_cents: "0", campaign_id: "campaign" },
  line_items: { data: [{ id: "li_old", price: { product: "prod_existing" } }] },
});
const request = (body: Record<string, unknown> = {}) => new Request("https://example.org/api/stripe/express-checkout/amount", {
  method: "POST", body: JSON.stringify({ sessionId: "cs_unit_amount", clientSecret: "unit_secret", amountCents: 12345, ...body }),
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake_wallet_signing_only");
  mocks.retrieve.mockResolvedValue(session()); mocks.rate.mockResolvedValue(1);
  mocks.update.mockImplementation(async (_id, data) => ({ amount_total: data.line_items[0].price_data.unit_amount }));
});
afterEach(() => { vi.unstubAllEnvs(); });

const signedContext = (expiresAt = Date.now() + 3600_000) => signWalletUpdateContext({
  sessionId: "cs_unit_amount", productId: "prod_existing", currency: "USD", frequency: "monthly",
  coverFee: false, exchangeRate: 1,
}, "unit_secret", expiresAt);

describe("in-place wallet amount updates", () => {
  it("creates a signed context from the expanded Stripe response", async () => {
    mocks.create.mockResolvedValue({ ...session(), expires_at: Math.floor(Date.now() / 1000) + 3600 });
    const created = await CREATE(new Request("https://example.org/api/stripe/express-checkout", {
      method: "POST", body: JSON.stringify({ campaignId: "campaign", campaignSlug: "akram-shake",
        amountCents: 5000, currency: "USD", coverFee: false, frequency: "monthly", locale: "en", displayPublicly: true }),
    }));
    expect(created.status).toBe(200);
    const data = await created.json();
    expect(verifyWalletUpdateContext(data.updateContext, data.sessionId, data.clientSecret)).toMatchObject({
      productId: "prod_existing", currency: "USD", frequency: "monthly", coverFee: false, exchangeRate: 1,
    });
    expect(mocks.create.mock.calls[0][0].expand).toEqual(["line_items"]);
  });
  it("updates with one Stripe call when the signed context and original secret match", async () => {
    expect((await POST(request({ updateContext: signedContext() }))).status).toBe(200);
    expect(mocks.retrieve).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledOnce();
    expect(mocks.update.mock.calls[0][1].line_items[0].price_data).toMatchObject({ product: "prod_existing", unit_amount: 12345 });
  });
  it("does not trust client attempts to change signed currency, fee coverage or product", async () => {
    expect((await POST(request({ updateContext: signedContext(), currency: "GBP", coverFee: true, productId: "prod_other" }))).status).toBe(200);
    expect(mocks.update.mock.calls[0][1].line_items[0].price_data).toMatchObject({ currency: "usd", product: "prod_existing", unit_amount: 12345 });
  });
  it.each(["tampered", "expired", "wrong_session", "wrong_secret", "rotated_key"])("rejects %s signed contexts without calling Stripe", async (kind) => {
    let token = signedContext(kind === "expired" ? Date.now() - 1 : undefined);
    const body: Record<string, unknown> = {};
    if (kind === "tampered") {
      const [payload, mac] = token.split(".");
      const forged = { ...JSON.parse(Buffer.from(payload, "base64url").toString()), currency: "GBP" };
      token = Buffer.from(JSON.stringify(forged)).toString("base64url") + "." + mac;
    }
    if (kind === "wrong_session") body.sessionId = "cs_other";
    if (kind === "wrong_secret") body.clientSecret = "wrong_secret";
    if (kind === "rotated_key") vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_rotated_fake");
    expect((await POST(request({ ...body, updateContext: token }))).status).toBe(403);
    expect(mocks.retrieve).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled();
  });
  it("does not treat a Stripe rejection of a completed Session as a successful amount update", async () => {
    mocks.update.mockRejectedValue(new Error("Session is no longer open"));
    expect((await POST(request({ updateContext: signedContext() }))).status).toBe(500);
  });
  it("updates the existing monthly Session with exact local minor units and matching accounting metadata", async () => {
    const result = await POST(request());
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ totalAmountMinor: 12345, currency: "USD" });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith("cs_unit_amount", {
      line_items: [{ quantity: 1, price_data: { currency: "usd", product: "prod_existing", unit_amount: 12345, recurring: { interval: "month" } } }],
      metadata: expect.objectContaining({ charged_donation_amount_cents: "12345", charged_fee_amount_cents: "0",
        normalized_donation_usd_cents: "12345", normalized_total_usd_cents: "12345" }),
    });
  });

  it("retains fee coverage and calculates foreign currency amounts on the server", async () => {
    const source = session(); source.mode = "payment"; source.currency = "gbp";
    source.metadata.charged_currency = "GBP"; source.metadata.charged_fee_amount_cents = "100";
    mocks.retrieve.mockResolvedValue(source); mocks.rate.mockResolvedValue(0.8);
    expect((await POST(request({ amountCents: 8000, currency: "USD", coverFee: false }))).status).toBe(200);
    const data = mocks.update.mock.calls[0][1];
    expect(data.line_items[0].price_data).toEqual({ currency: "gbp", product: "prod_existing", unit_amount: 8256 });
    expect(data.metadata).toMatchObject({ charged_donation_amount_cents: "8000", charged_fee_amount_cents: "256",
      normalized_donation_usd_cents: "10000", normalized_fee_usd_cents: "320", normalized_total_usd_cents: "10320" });
  });

  it.each(["wrong_secret", "unit_secreX"]) ("requires the actual Session capability (%s)", async (clientSecret) => {
    expect((await POST(request({ clientSecret }))).status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it.each([0, 99, 1999, 123.45, "12345", 100_000_000])("rejects invalid custom amount %s", async (amountCents) => {
    expect((await POST(request({ amountCents }))).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it.each([
    { status: "complete" }, { status: "expired" }, { payment_status: "paid" }, { ui_mode: "hosted_page" },
    { metadata: {} }, { currency: "eur" }, { line_items: { data: [] } },
  ])("rejects an incompatible or completed Session %j", async (changes) => {
    mocks.retrieve.mockResolvedValue({ ...session(), ...changes });
    expect((await POST(request())).status).toBe(409);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("does not claim success if Stripe returns a different total", async () => {
    mocks.update.mockResolvedValue({ amount_total: 5000 });
    expect((await POST(request())).status).toBe(500);
  });
});

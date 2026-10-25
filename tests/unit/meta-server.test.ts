// @vitest-environment node
import { createHash } from "node:crypto";
import type Stripe from "stripe";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { buildMetaPurchase, buildMetaUserData, captureMetaRequest, sendMetaPurchase } from "@/lib/meta/server";

function session(overrides: Partial<Stripe.Checkout.Session> = {}) {
  return {
    id: "cs_test_emq", payment_status: "paid", amount_total: 5175,
    currency: "usd", livemode: true,
    metadata: { frequency: "one_time", meta_source_url: "https://donate.example/campaign" },
    ...overrides,
  } as Stripe.Checkout.Session;
}
const sha = (value: string) => createHash("sha256").update(value).digest("hex");

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("Meta matching data", () => {
  it("normalizes and hashes available identity, preserving actual browser identifiers", () => {
    const result = buildMetaUserData(session({
      customer_details: {
        email: " Jane@Example.COM ", phone: "+1 (415) 555-0123", name: "Jane O'Neil",
        address: { city: "New York", state: "NY", postal_code: "10001-1234", country: "US", line1: null, line2: null },
      } as Stripe.Checkout.Session.CustomerDetails,
      metadata: { meta_external_id: "visitor-123", meta_fbp: "fb.1.1700000000000.12345",
        meta_fbc: "fb.1.1700000000000.Real_Click", meta_ip_address: "2001:db8::1", meta_user_agent: "donor-browser" },
    }));
    expect(result).toEqual({
      em: [sha("jane@example.com")], ph: [sha("14155550123")], fn: [sha("jane")], ln: [sha("oneil")],
      ct: [sha("newyork")], st: [sha("ny")], zp: [sha("10001")], country: [sha("us")], external_id: [sha("visitor-123")],
      fbp: "fb.1.1700000000000.12345", fbc: "fb.1.1700000000000.Real_Click",
      client_ip_address: "2001:db8::1", client_user_agent: "donor-browser",
    });
    expect(JSON.stringify(result)).not.toContain("jane@example.com");
  });

  it("uses form metadata when wallets provide no details, without placeholder names or guessed local phone", () => {
    expect(buildMetaUserData(session({ metadata: { donor_email: " USER@example.com ", donor_first_name: "Éva", donor_phone: "020 1234 5678" } })))
      .toEqual({ em: [sha("user@example.com")], fn: [sha("éva")] });
    expect(buildMetaUserData(session({ metadata: {} }))).toEqual({});
  });

  it("captures the original browser context and only trusts the configured proxy", () => {
    vi.stubEnv("VERCEL", "1");
    const request = new Request("https://donate.example/api/stripe/checkout", { headers: {
      cookie: "_fbp=fb.1.1700000000000.123; _fbc=fb.1.1700000000000.ClickABC; _meta_external_id=62a53afc-fb42-4207-b81e-e66a22582804",
      "user-agent": "visitor-agent", "x-vercel-forwarded-for": "203.0.113.8", "x-forwarded-for": "198.51.100.2",
      referer: "https://donate.example/campaign?email=secret@example.com&fbclid=NewClick#form",
    } });
    expect(captureMetaRequest(request)).toEqual({ meta_fbp: "fb.1.1700000000000.123", meta_fbc: "fb.1.1700000000000.ClickABC",
      meta_external_id: "62a53afc-fb42-4207-b81e-e66a22582804", meta_user_agent: "visitor-agent", meta_ip_address: "203.0.113.8",
      meta_source_url: "https://donate.example/campaign" });
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("META_TRUST_PROXY_HEADERS", "false");
    expect(captureMetaRequest(request)).not.toHaveProperty("meta_ip_address");
  });

  it("does not invent Facebook cookies or accept foreign source URLs", () => {
    const request = new Request("https://donate.example/api/stripe/checkout", { headers: {
      cookie: "_fbp=bad; _fbc=%xx", referer: "https://other.example/?fbclid=Forged", "x-forwarded-for": "not-an-ip",
    } });
    expect(captureMetaRequest(request)).toEqual({});
    const clicked = captureMetaRequest(new Request("https://donate.example/api/stripe/checkout", {
      headers: { referer: "https://donate.example/campaign?fbclid=Actual_Click" },
    }));
    expect(clicked.meta_fbc).toMatch(/^fb\.1\.\d{13}\.Actual_Click$/);
  });

  it("uses the verified charged total, payment timestamp and a stable event ID", () => {
    const event = buildMetaPurchase(session(), 1700000030);
    expect(event).toMatchObject({ event_name: "Purchase", event_id: "purchase_cs_test_emq", event_time: 1700000030,
      action_source: "website", custom_data: { value: 51.75, currency: "USD" } });
    expect(() => buildMetaPurchase(session({ payment_status: "unpaid" }), 1700000030)).toThrow("verified paid");
    expect(() => buildMetaPurchase(session({ amount_total: null }), 1700000030)).toThrow("verified paid");
  });
});

describe("Meta delivery", () => {
  function enable() {
    vi.stubEnv("META_CAPI_ENABLED", "true");
    vi.stubEnv("META_CAPI_ACCESS_TOKEN", "fake-unit-test-token");
    vi.stubEnv("META_TEST_EVENT_CODE", "");
  }
  it("skips disabled delivery and sandbox payments without a test code", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    vi.stubEnv("META_CAPI_ENABLED", "false");
    expect(await sendMetaPurchase(session(), 1700000000)).toBe(false);
    enable();
    expect(await sendMetaPurchase(session({ livemode: false }), 1700000000)).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("keeps tokens out of URLs and accepts only an acknowledged event", async () => {
    enable(); vi.stubEnv("META_TEST_EVENT_CODE", "TEST_EXAMPLE");
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ events_received: 1 }), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    expect(await sendMetaPurchase(session({ livemode: false }), 1700000000)).toBe(true);
    const [url, options] = fetch.mock.calls[0];
    expect(url).not.toContain("fake-unit-test-token");
    expect(options.headers.Authorization).toBe("Bearer fake-unit-test-token");
    expect(JSON.parse(options.body).test_event_code).toBe("TEST_EXAMPLE");
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ events_received: 0 }), { status: 200 }));
    await expect(sendMetaPurchase(session(), 1700000000)).rejects.toThrow("did not accept");
  });
  it("rejects errors for webhook retry without exposing Meta response bodies", async () => {
    enable();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "sensitive-body" } }), { status: 400 })));
    await expect(sendMetaPurchase(session(), 1700000000)).rejects.toThrow("HTTP 400");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("sensitive-network-detail")));
    await expect(sendMetaPurchase(session(), 1700000000)).rejects.toThrow("webhook retry is required");
  });
});

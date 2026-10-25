import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MetaPixelPurchase } from "@/components/analytics/meta-pixel-purchase";
import { captureMetaAttribution, metaCheckoutFetch } from "@/lib/meta/client";

beforeEach(() => {
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
  for (const name of ["_fbc", "_fbp", "_meta_external_id"]) document.cookie = `${name}=; Path=/; Max-Age=0`;
});
afterEach(() => { delete window.fbq; vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Meta browser attribution", () => {
  it("preserves a genuine click across navigation and never invents one on organic visits", () => {
    captureMetaAttribution();
    expect(document.cookie).not.toContain("_fbc=");
    expect(document.cookie).not.toContain("_fbp=");
    expect(document.cookie).toContain("_meta_external_id=");
    window.history.replaceState({}, "", "/campaign?fbclid=Click_ABC");
    captureMetaAttribution();
    const cookie = document.cookie;
    expect(decodeURIComponent(cookie)).toMatch(/_fbc=fb\.1\.\d{13}\.Click_ABC/);
    window.history.replaceState({}, "", "/campaign/donate");
    captureMetaAttribution();
    expect(document.cookie).toBe(cookie);
  });
  it("captures attribution before checkout while preserving the request and response", async () => {
    const response = new Response("ok");
    const fetch = vi.fn().mockImplementation(() => {
      expect(document.cookie).toContain("_fbc=");
      return Promise.resolve(response);
    });
    vi.stubGlobal("fetch", fetch);
    window.history.replaceState({}, "", "/?fbclid=RealClick");
    const init = { method: "POST", body: "{}" };
    expect(await metaCheckoutFetch("/api/stripe/checkout", init)).toBe(response);
    expect(fetch).toHaveBeenCalledWith("/api/stripe/checkout", init);
  });
});

describe("Meta browser Purchase", () => {
  it("uses the server's event ID and suppresses reload/remount duplicates", () => {
    window.fbq = vi.fn();
    const props = { sessionId: "cs_browser_once", value: 51.75, currency: "usd", frequency: "one_time" };
    const view = render(<MetaPixelPurchase {...props} />);
    expect(window.fbq).toHaveBeenCalledWith("track", "Purchase", expect.objectContaining({ value: 51.75, currency: "USD" }),
      { eventID: "purchase_cs_browser_once" });
    view.unmount(); render(<MetaPixelPurchase {...props} />);
    expect(window.fbq).toHaveBeenCalledTimes(1);
  });
  it("waits for a delayed Pixel bootstrap", () => {
    vi.useFakeTimers();
    render(<MetaPixelPurchase sessionId="cs_delayed" value={20} currency="usd" frequency="monthly" />);
    window.fbq = vi.fn();
    act(() => { vi.advanceTimersByTime(500); });
    expect(window.fbq).toHaveBeenCalledOnce();
  });
  it("still sends when storage is unavailable and rejects invalid amounts", () => {
    window.fbq = vi.fn();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    render(<MetaPixelPurchase sessionId="cs_storage_blocked" value={25} currency="eur" frequency="one_time" />);
    render(<MetaPixelPurchase sessionId="cs_invalid" value={NaN} currency="usd" frequency="one_time" />);
    expect(window.fbq).toHaveBeenCalledOnce();
  });
});

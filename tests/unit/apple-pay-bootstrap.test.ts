// @vitest-environment node
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { applePayBootstrapScript } from "@/lib/stripe/apple-pay-bootstrap";

function bootstrap({ userAgent = "Mozilla/5.0 (iPhone)", platform = "iPhone", maxTouchPoints = 5,
  path = "/akram-shake-2", existing = false, loaded = false } = {}) {
  let current: object | undefined = existing ? {} : undefined;
  let fail: (() => void) | undefined;
  const remove = vi.fn(() => { current = undefined; });
  const append = vi.fn((script: object) => { current = script; });
  const create = vi.fn(() => ({ src: "", async: false, remove,
    addEventListener: (event: string, callback: () => void) => { if (event === "error") fail = callback; } }));
  const context = {
    navigator: { userAgent, platform, maxTouchPoints },
    window: { location: { pathname: path }, Stripe: loaded ? () => {} : undefined },
    document: { querySelector: () => current, createElement: create, head: { appendChild: append } },
  };
  const run = () => runInNewContext(applePayBootstrapScript, context);
  run();
  return { append, create, remove, run, fail: () => fail?.() };
}

describe("Apple Pay SDK loading before hydration", () => {
  it("downloads the async vendor script without a key or payment request", () => {
    const result = bootstrap();
    expect(result.append).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      src: "https://js.stripe.com/endive/stripe.js", async: true,
    }));
    result.run();
    expect(result.append).toHaveBeenCalledOnce();
  });
  it("also recognizes an iPad using the desktop user agent", () => {
    expect(bootstrap({ userAgent: "Mozilla/5.0 (Macintosh) Safari", platform: "MacIntel" }).append).toHaveBeenCalledOnce();
  });
  it.each([
    { userAgent: "Mozilla/5.0 (Linux; Android 14)", platform: "Linux armv8l", maxTouchPoints: 5 },
    { userAgent: "Mozilla/5.0 (Windows NT 10.0)", platform: "Win32", maxTouchPoints: 0 },
    { userAgent: "Mozilla/5.0 (Macintosh) Safari", platform: "MacIntel", maxTouchPoints: 0 },
  ])("leaves non-iOS initialization deferred for %j", (device) => {
    expect(bootstrap(device).create).not.toHaveBeenCalled();
  });
  it.each(["/akram-shake-1", "/gaza-help", "/child-health"])("does not preload on the hosted entry %s", (path) => {
    expect(bootstrap({ path }).create).not.toHaveBeenCalled();
  });
  it.each([{ existing: true }, { loaded: true }])("reuses a vendor SDK that is already present: %j", (state) => {
    expect(bootstrap(state).create).not.toHaveBeenCalled();
  });
  it("removes a failed speculative script so the normal loader can retry", () => {
    const result = bootstrap();
    result.fail();
    expect(result.remove).toHaveBeenCalledOnce();
    result.run();
    expect(result.append).toHaveBeenCalledTimes(2);
  });
});

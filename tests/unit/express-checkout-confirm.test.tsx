import { act, render } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const stripe = vi.hoisted(() => ({ confirm: vi.fn(), update: vi.fn(), ready: undefined as undefined | ((event: unknown) => void), eventHandler: undefined as undefined | ((event: unknown) => Promise<void>) }));
vi.mock("@stripe/stripe-js", () => ({ loadStripe: () => Promise.resolve({}) }));
vi.mock("@stripe/react-stripe-js/checkout", () => ({
  CheckoutElementsProvider: ({ children }: PropsWithChildren) => children,
  useCheckoutElements: () => ({ type: "success", checkout: { id: "cs_unit", confirm: stripe.confirm, runServerUpdate: stripe.update } }),
  ExpressCheckoutElement: ({ onConfirm, onReady }: { onConfirm: (event: unknown) => Promise<void>; onReady: (event: unknown) => void }) => {
    stripe.eventHandler = onConfirm;
    stripe.ready = onReady;
    return <button>Apple Pay</button>;
  },
}));

// Import after setting a deliberately fake public key. No Stripe API is used.
vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_unit_test_only");
const { DonationExpressCheckout } = await import("@/components/donation/donation-express-checkout");

beforeEach(() => {
  stripe.confirm.mockReset().mockResolvedValue({ type: "success" });
  stripe.update.mockReset().mockImplementation(async (callback) => {
    await callback(); return { type: "success", session: { total: { total: { minorUnitsAmount: 12345 } } } };
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Apple Pay payment confirmation", () => {
  const walletEvent = { expressPaymentType: "apple_pay" } as StripeExpressCheckoutElementConfirmEvent;

  async function readyUpdater() {
    const register = vi.fn();
    render(<DonationExpressCheckout clientSecret="unit_secret" locale="en" onAmountUpdater={register} />);
    act(() => { stripe.ready!({ availablePaymentMethods: { applePay: true } }); });
    return register.mock.calls[0][0] as (amount: number) => Promise<void>;
  }
  it("refreshes the existing SDK and verifies its total without authorizing a payment", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ totalAmountMinor: 12345 })));
    vi.stubGlobal("fetch", fetch);
    const update = await readyUpdater();
    await act(async () => { await update(12345); });
    expect(stripe.update).toHaveBeenCalledOnce();
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ sessionId: "cs_unit", clientSecret: "unit_secret", amountCents: 12345 });
    expect(stripe.confirm).not.toHaveBeenCalled();
  });
  it("rejects an SDK refresh that still contains the old amount", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ totalAmountMinor: 99999 }))));
    const update = await readyUpdater();
    await expect(update(99999)).rejects.toThrow("synchronization failed");
    expect(stripe.confirm).not.toHaveBeenCalled();
  });
  it("rejects failed server updates instead of treating HTTP errors as success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "failed" }), { status: 500 })));
    const update = await readyUpdater();
    await expect(update(12345)).rejects.toThrow("synchronize wallet amount");
  });
  it("does not change the amount once payment confirmation has started", async () => {
    const update = await readyUpdater();
    await act(async () => { await stripe.eventHandler!(walletEvent); });
    await expect(update(12345)).rejects.toThrow("not ready");
    expect(stripe.update).not.toHaveBeenCalled();
  });

  it("passes the wallet event to Stripe without waiting for background bookkeeping", async () => {
    const bookkeeping = vi.fn(() => new Promise<void>(() => {}));
    render(<DonationExpressCheckout clientSecret="unit_secret" locale="en" beforeConfirm={bookkeeping} />);
    await act(async () => { await stripe.eventHandler!(walletEvent); });
    expect(bookkeeping).toHaveBeenCalledOnce();
    expect(stripe.confirm).toHaveBeenCalledWith({ expressCheckoutConfirmEvent: walletEvent });
  });

  it("continues confirmation if tracking storage or analytics throws", async () => {
    const onError = vi.fn();
    render(<DonationExpressCheckout clientSecret="unit_secret" locale="en" onError={onError}
      onExpressConfirm={() => { throw new DOMException("Storage is blocked", "SecurityError"); }} />);
    await act(async () => { await stripe.eventHandler!(walletEvent); });
    expect(stripe.confirm).toHaveBeenCalledWith({ expressCheckoutConfirmEvent: walletEvent });
    expect(onError).not.toHaveBeenCalled();
  });

  it("continues confirmation when optional bookkeeping rejects", async () => {
    render(<DonationExpressCheckout clientSecret="unit_secret" locale="en" beforeConfirm={() => Promise.reject(new Error("tracking API failed"))} />);
    await act(async () => { await stripe.eventHandler!(walletEvent); });
    expect(stripe.confirm).toHaveBeenCalledOnce();
  });

  it("continues confirmation when optional bookkeeping throws synchronously", async () => {
    render(<DonationExpressCheckout clientSecret="unit_secret" locale="en" beforeConfirm={() => { throw new Error("tracking initialization failed"); }} />);
    await act(async () => { await stripe.eventHandler!(walletEvent); });
    expect(stripe.confirm).toHaveBeenCalledOnce();
  });

  it("still reports real Stripe confirmation errors", async () => {
    stripe.confirm.mockResolvedValue({ type: "error", error: { message: "Card was declined" } });
    const onError = vi.fn();
    const view = render(<DonationExpressCheckout clientSecret="unit_secret" locale="en" onError={onError} />);
    await act(async () => { await stripe.eventHandler!(walletEvent); });
    expect(onError).toHaveBeenCalledWith("Card was declined");
    expect(view.container.querySelector('[aria-busy="false"]')).not.toBeNull();
  });

  it("confirms only once when duplicate wallet events arrive before React rerenders", async () => {
    render(<DonationExpressCheckout clientSecret="unit_secret" locale="en" />);
    const handler = stripe.eventHandler!;
    await act(async () => { await Promise.all([handler(walletEvent), handler(walletEvent)]); });
    expect(stripe.confirm).toHaveBeenCalledOnce();
  });

  it("allows an intentional retry after a declined confirmation", async () => {
    stripe.confirm.mockResolvedValueOnce({ type: "error", error: { message: "Try another card" } });
    render(<DonationExpressCheckout clientSecret="unit_secret" locale="en" />);
    await act(async () => { await stripe.eventHandler!(walletEvent); });
    await act(async () => { await stripe.eventHandler!(walletEvent); });
    expect(stripe.confirm).toHaveBeenCalledTimes(2);
  });

  it("rejects a stale wallet authorization instead of confirming an out-of-date amount", async () => {
    const event = { ...walletEvent, paymentFailed: vi.fn() };
    render(<DonationExpressCheckout clientSecret="unit_secret" locale="en" enabled={false} />);
    await act(async () => { await stripe.eventHandler!(event); });
    expect(stripe.confirm).not.toHaveBeenCalled();
    expect(event.paymentFailed).toHaveBeenCalledWith({ reason: "fail", message: expect.any(String) });
  });
});

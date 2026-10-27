import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect, useEffectEvent, type ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleCampaign } from "@/lib/sample-data";
import { DONATION_MODAL_OPEN_EVENT } from "@/components/donation/donation-modal-events";
import type { Currency } from "@/lib/currency";

const navigation = vi.hoisted(() => ({ pathname: "/gaza-food" }));
const walletReadiness = vi.hoisted(() => ({ available: true, update: undefined as undefined | ((amount: number) => Promise<void>) }));
const stripePreparation = vi.hoisted(() => ({ prepare: vi.fn() }));
const walletAvailability = vi.hoisted(() => new Map<string, (available: boolean) => void>());
vi.mock("@/lib/stripe/client", () => ({ prepareStripe: stripePreparation.prepare }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));
vi.mock("next/image", () => ({
  // Mock the framework's image wrapper with the native DOM element in jsdom.
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt="" />,
}));
vi.mock("@/components/donation/donation-payment", () => ({ DonationPayment: () => null }));
function MockWallet({ clientSecret, onAvailabilityChange, onAmountUpdater }: { clientSecret: string; onAvailabilityChange?: (available: boolean) => void; onAmountUpdater?: (update: (amount: number) => Promise<void>) => void }) {
  useEffect(() => {
    if (onAvailabilityChange) walletAvailability.set(clientSecret, onAvailabilityChange);
    return () => { walletAvailability.delete(clientSecret); };
  }, [clientSecret, onAvailabilityChange]);
  const reportReady = useEffectEvent(() => {
    onAvailabilityChange?.(walletReadiness.available);
    if (walletReadiness.update) onAmountUpdater?.(walletReadiness.update);
  });
  useEffect(() => { reportReady(); }, [clientSecret]);
  return <div data-testid="wallet-session">{clientSecret}</div>;
}
vi.mock("@/components/donation/donation-express-checkout", () => ({
  DonationExpressCheckout: MockWallet,
}));

import { DonationModal } from "@/components/donation/donation-modal";

beforeEach(() => {
  vi.useFakeTimers(); navigation.pathname = "/gaza-food"; walletReadiness.available = true; walletReadiness.update = undefined;
  stripePreparation.prepare.mockClear();
  walletAvailability.clear();
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)");
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function advance(ms: number) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}
let campaignIndex = 0;
function mountModal() {
  render(<DonationModal campaign={{ ...sampleCampaign, id: `loading-campaign-${++campaignIndex}` }} content={{ _id: "test-content", title: "Test campaign", slug: sampleCampaign.slug }}
    locale="en" currency="USD" exchangeRate={1} />);
}
function openModal() {
  act(() => { window.dispatchEvent(new Event(DONATION_MODAL_OPEN_EVENT)); });
}
function response(id: string) {
  return new Response(JSON.stringify({ clientSecret: `${id}_secret`, sessionId: id }), { status: 200 });
}

describe("Apple Pay session loading", () => {
  it("does not initialize a competing card checkout until the donor chooses Card", async () => {
    const fetch = vi.fn((url) => Promise.resolve(url === "/api/stripe/checkout"
      ? new Response(JSON.stringify({ clientSecret: "card_secret", sessionId: "cs_card", totalAmountMinor: 5000, currency: "USD" }))
      : response("cs_wallet_priority")));
    vi.stubGlobal("fetch", fetch);
    mountModal(); await advance(121); openModal(); await advance(1000);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual(["/api/stripe/express-checkout"]);
    act(() => { fireEvent.click(screen.getByRole("button", { name: "Pay $50 by Card" })); });
    await advance(200);
    expect(fetch.mock.calls.filter(([url]) => url === "/api/stripe/checkout")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Your information" })).toBeInTheDocument();
  });

  it("updates a preset amount in the existing wallet instead of initializing another iframe", async () => {
    walletReadiness.update = vi.fn().mockResolvedValue(undefined);
    const express = vi.fn().mockImplementation(() => Promise.resolve(response("cs_preset_reuse")));
    vi.stubGlobal("fetch", express);
    mountModal(); await advance(121); openModal(); await advance(1);
    const wallet = screen.getByTestId("wallet-session");
    act(() => { fireEvent.click(screen.getByRole("radio", { name: /\$100\b/ })); });
    await advance(1);
    expect(walletReadiness.update).toHaveBeenCalledExactlyOnceWith(10000);
    expect(screen.getByTestId("wallet-session")).toBe(wallet);
    expect(wallet.closest("[inert]")).toBeNull();
    expect(express).toHaveBeenCalledOnce();
    act(() => { fireEvent.click(screen.getByRole("radio", { name: /^\$50(?!\d)/ })); });
    await advance(1);
    expect(walletReadiness.update).toHaveBeenLastCalledWith(5000);
    expect(express).toHaveBeenCalledOnce();
  });

  it("blocks stale preset amounts and serializes changes while a wallet update is in flight", async () => {
    let complete!: () => void;
    const update = vi.fn().mockReturnValueOnce(new Promise<void>((resolve) => { complete = resolve; }))
      .mockResolvedValue(undefined);
    walletReadiness.update = update;
    const fetch = vi.fn().mockImplementation(() => Promise.resolve(response("cs_preset_serial")));
    vi.stubGlobal("fetch", fetch);
    mountModal(); await advance(121); openModal(); await advance(1);
    const wallet = screen.getByTestId("wallet-session");
    act(() => { fireEvent.click(screen.getByRole("radio", { name: /\$100\b/ })); });
    await advance(1);
    expect(wallet.closest("[inert]")).not.toBeNull();
    act(() => { fireEvent.click(screen.getByRole("radio", { name: /^\$50(?!\d)/ })); });
    await advance(1);
    expect(update).toHaveBeenCalledExactlyOnceWith(10000);
    expect(wallet.closest("[inert]")).not.toBeNull();
    await act(async () => { complete(); });
    await advance(1);
    expect(update).toHaveBeenLastCalledWith(5000);
    expect(wallet.closest("[inert]")).toBeNull();
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("keeps monthly and one-time wallets separate when amount reuse is available", async () => {
    walletReadiness.update = vi.fn().mockResolvedValue(undefined);
    const fetch = vi.fn().mockResolvedValueOnce(response("cs_monthly_boundary"))
      .mockResolvedValueOnce(response("cs_once_boundary"));
    vi.stubGlobal("fetch", fetch);
    mountModal(); await advance(121); openModal(); await advance(1);
    act(() => { fireEvent.click(screen.getByRole("radio", { name: "Give once" })); });
    await advance(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({ frequency: "one_time" });
    expect(walletReadiness.update).not.toHaveBeenCalled();
  });

  it("replaces a wallet after a failed preset update instead of enabling an uncertain amount", async () => {
    walletReadiness.update = vi.fn().mockRejectedValue(new Error("SDK total mismatch"));
    const fetch = vi.fn().mockResolvedValueOnce(response("cs_failed_preset"))
      .mockResolvedValueOnce(response("cs_fresh_preset"));
    vi.stubGlobal("fetch", fetch);
    mountModal(); await advance(121); openModal(); await advance(1);
    const oldWallet = screen.getByTestId("wallet-session");
    act(() => { fireEvent.click(screen.getByRole("radio", { name: /\$100\b/ })); });
    await advance(2);
    await advance(1);
    expect(walletReadiness.update).toHaveBeenCalledExactlyOnceWith(10000);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(oldWallet).not.toBeInTheDocument();
    expect(screen.getByTestId("wallet-session")).toHaveTextContent("cs_fresh_preset_secret");
    expect(screen.getByTestId("wallet-session").closest("[inert]")).toBeNull();
  });

  it("creates a separate Session for a preset below the amount-update endpoint minimum", async () => {
    walletReadiness.update = vi.fn().mockResolvedValue(undefined);
    const fetch = vi.fn().mockResolvedValueOnce(response("cs_regular_preset"))
      .mockResolvedValueOnce(response("cs_small_preset"));
    vi.stubGlobal("fetch", fetch);
    render(<DonationModal campaign={{ ...sampleCampaign, id: `loading-campaign-${++campaignIndex}`,
      donationOptions: [...sampleCampaign.donationOptions.map((option) => ({ ...option, frequency: "monthly" as const })),
        { ...sampleCampaign.donationOptions[0], frequency: "monthly", amountUsd: 500, featured: false }] }}
      content={{ _id: "test-content", title: "Test campaign", slug: sampleCampaign.slug }}
      locale="en" currency="USD" exchangeRate={1} />);
    await advance(121); openModal(); await advance(1);
    act(() => { fireEvent.click(screen.getByRole("radio", { name: /^\$5$/ })); });
    await advance(1);
    await advance(1);
    expect(walletReadiness.update).not.toHaveBeenCalled();
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({ amountCents: 500 });
    expect(screen.getByText("cs_small_preset_secret").closest("[inert]")).toBeNull();
  });

  it("restores the same wallet when availability changes on the Akram screenshot page", async () => {
    navigation.pathname = "/akram-shake-2";
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(response("cs_akram"))));
    mountModal(); await advance(121); openModal(); await advance(1);
    const wallet = screen.getByTestId("wallet-session");
    expect(wallet.closest("[inert]")).toBeNull();
    expect(screen.getByText("or")).toBeInTheDocument();
    act(() => { walletAvailability.get("cs_akram_secret")!(false); });
    expect(wallet.closest("[inert]")).not.toBeNull();
    expect(screen.queryByText("or")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    act(() => { walletAvailability.get("cs_akram_secret")!(true); });
    expect(screen.getByTestId("wallet-session")).toBe(wallet);
    expect(wallet.closest("[inert]")).toBeNull();
    expect(screen.getByText("or")).toBeInTheDocument();
  });

  it("shows the Give once wallet and reuses the monthly wallet when switching back on Akram", async () => {
    navigation.pathname = "/akram-shake-2";
    const express = vi.fn().mockResolvedValueOnce(response("cs_monthly")).mockResolvedValueOnce(response("cs_one_time"));
    vi.stubGlobal("fetch", vi.fn((url) => url === "/api/stripe/express-checkout" ? express() : Promise.resolve(response("cs_card"))));
    mountModal(); await advance(121); openModal(); await advance(1);
    const monthlyWallet = screen.getByText("cs_monthly_secret");
    act(() => { fireEvent.click(screen.getByRole("radio", { name: "Give once" })); });
    await advance(1);
    const oneTimeWallet = screen.getByText("cs_one_time_secret");
    expect(oneTimeWallet.closest("[inert]")).toBeNull();
    expect(monthlyWallet.closest("[inert]")).not.toBeNull();
    act(() => { fireEvent.click(screen.getByRole("radio", { name: "Monthly" })); });
    await advance(1);
    expect(screen.getByText("cs_monthly_secret")).toBe(monthlyWallet);
    expect(monthlyWallet.closest("[inert]")).toBeNull();
    expect(oneTimeWallet.closest("[inert]")).not.toBeNull();
    expect(express).toHaveBeenCalledTimes(2);
  });

  it("starts custom amount synchronization at 200ms and retains the existing Apple Pay DOM", async () => {
    walletReadiness.update = vi.fn().mockResolvedValue(undefined);
    const express = vi.fn().mockImplementation(() => Promise.resolve(response("cs_reuse")));
    vi.stubGlobal("fetch", vi.fn((url) => url === "/api/stripe/express-checkout" ? express() : Promise.resolve(response("cs_card"))));
    mountModal(); await advance(121); openModal(); await advance(1);
    const wallet = screen.getByTestId("wallet-session");
    act(() => { fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "123.45" } }); });
    await advance(199); expect(walletReadiness.update).not.toHaveBeenCalled();
    await advance(1);
    expect(walletReadiness.update).toHaveBeenCalledExactlyOnceWith(12345);
    expect(express).toHaveBeenCalledOnce();
    expect(screen.getByTestId("wallet-session")).toBe(wallet);
    expect(wallet.closest("[inert]")).toBeNull();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("serializes quick edits and keeps the button inert until the latest amount has synchronized", async () => {
    let complete!: () => void;
    const update = vi.fn().mockReturnValueOnce(new Promise<void>((resolve) => { complete = resolve; })).mockResolvedValue(undefined);
    walletReadiness.update = update;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(response("cs_serial"))));
    mountModal(); await advance(121); openModal(); await advance(1);
    const input = screen.getByRole("spinbutton");
    const wallet = screen.getByTestId("wallet-session");
    act(() => { fireEvent.change(input, { target: { value: "100" } }); fireEvent.blur(input); });
    await advance(1);
    act(() => { fireEvent.change(input, { target: { value: "200" } }); fireEvent.blur(input); });
    await advance(250);
    expect(update).toHaveBeenCalledExactlyOnceWith(10000);
    expect(wallet.closest("[inert]")).not.toBeNull();
    await act(async () => { complete(); });
    expect(wallet.closest("[inert]")).not.toBeNull();
    await advance(200);
    expect(update.mock.calls).toEqual([[10000], [20000]]);
    expect(screen.getByTestId("wallet-session")).toBe(wallet);
    expect(wallet.closest("[inert]")).toBeNull();
  });

  it("does not expose the original amount while a mutation is still in flight", async () => {
    let complete!: () => void;
    walletReadiness.update = vi.fn().mockReturnValueOnce(new Promise<void>((resolve) => { complete = resolve; })).mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(response("cs_return_original"))));
    mountModal(); await advance(121); openModal(); await advance(1);
    const input = screen.getByRole("spinbutton"); const wallet = screen.getByTestId("wallet-session");
    act(() => { fireEvent.change(input, { target: { value: "100" } }); fireEvent.blur(input); });
    await advance(1);
    act(() => { fireEvent.change(input, { target: { value: "50" } }); });
    expect(wallet.closest("[inert]")).not.toBeNull();
    await act(async () => { complete(); });
    expect(wallet.closest("[inert]")).not.toBeNull();
    await advance(200);
    expect(walletReadiness.update).toHaveBeenLastCalledWith(5000);
    expect(wallet.closest("[inert]")).toBeNull();
  });

  it("replaces an ambiguous Session if the in-place update fails", async () => {
    walletReadiness.update = vi.fn().mockRejectedValue(new Error("SDK refresh failed"));
    const express = vi.fn().mockResolvedValueOnce(response("cs_ambiguous")).mockResolvedValueOnce(response("cs_fresh"));
    vi.stubGlobal("fetch", vi.fn((url) => url === "/api/stripe/express-checkout" ? express() : Promise.resolve(response("cs_card"))));
    mountModal(); await advance(121); openModal(); await advance(1);
    act(() => { fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "100" } }); });
    await advance(200); await advance(1);
    expect(express).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("wallet-session")).toHaveTextContent("cs_fresh_secret");
    expect(screen.getByTestId("wallet-session").closest("[inert]")).toBeNull();
  });

  it("never reuses a mutated warm-up as the default amount after closing the modal", async () => {
    walletReadiness.update = vi.fn().mockResolvedValue(undefined);
    const express = vi.fn().mockResolvedValueOnce(response("cs_mutated_warm")).mockResolvedValueOnce(response("cs_new_default"));
    vi.stubGlobal("fetch", vi.fn((url) => url === "/api/stripe/express-checkout" ? express() : Promise.resolve(response("cs_card"))));
    mountModal(); await advance(121); openModal(); await advance(1);
    act(() => { fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "100" } }); });
    await advance(200);
    act(() => { fireEvent.click(screen.getByRole("button", { name: "Close donation form" })); });
    await advance(151);
    expect(screen.getByTestId("wallet-session")).toHaveTextContent("cs_new_default_secret");
    openModal(); await advance(1);
    expect(screen.getByRole("radio", { name: /^\$50(?!\d)/ })).toBeChecked();
    expect(screen.getByTestId("wallet-session")).toHaveTextContent("cs_new_default_secret");
    expect(express).toHaveBeenCalledTimes(2);
  });

  it("defers the Google Pay wallet subtree on Android until the donation modal opens", async () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Linux; Android 14) Chrome/153 Mobile");
    const fetch = vi.fn().mockResolvedValue(response("cs_android_intent"));
    vi.stubGlobal("fetch", fetch);
    mountModal();
    expect(stripePreparation.prepare).not.toHaveBeenCalled();
    await advance(120); await advance(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("wallet-session")).not.toBeInTheDocument();
    openModal(); await advance(1);
    expect(stripePreparation.prepare).toHaveBeenCalled();
    expect(screen.getByTestId("wallet-session")).toHaveTextContent("cs_android_intent_secret");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("shows custom-amount preparation instead of leaving an apparently clickable stale wallet", async () => {
    let resolveCustom!: (value: Response) => void;
    const custom = new Promise<Response>((resolve) => { resolveCustom = resolve; });
    const express = vi.fn().mockResolvedValueOnce(response("cs_custom_default")).mockReturnValueOnce(custom);
    const fetch = vi.fn<typeof globalThis.fetch>((url) => url === "/api/stripe/express-checkout" ? express() : Promise.resolve(new Response(JSON.stringify({ clientSecret: "card_secret", sessionId: "cs_card", totalAmountMinor: 12345, currency: "USD" }))));
    vi.stubGlobal("fetch", fetch);
    mountModal();
    await advance(120); await advance(1);
    openModal(); await advance(1);
    const oldWallet = screen.getByTestId("wallet-session");
    const input = screen.getByRole("spinbutton");
    act(() => { fireEvent.change(input, { target: { value: "123.45" } }); });
    expect(screen.getByRole("status")).toHaveTextContent("Updating payment amount");
    expect(oldWallet.closest("[inert]")).not.toBeNull();
    await advance(100);
    expect(express).toHaveBeenCalledTimes(1);
    act(() => { fireEvent.blur(input); });
    expect(express).toHaveBeenCalledTimes(2);
    const customCall = fetch.mock.calls.filter(([url]) => url === "/api/stripe/express-checkout")[1];
    expect(JSON.parse((customCall[1] as RequestInit).body as string)).toMatchObject({ amountCents: 12345, currency: "USD" });
    act(() => { fireEvent.blur(input); });
    expect(express).toHaveBeenCalledTimes(2);
    await act(async () => { resolveCustom(response("cs_custom_ready")); });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("cs_custom_ready_secret").closest("[inert]")).toBeNull();
  });

  it("keeps the cached wallet mounted through an invalid intermediate custom amount", async () => {
    const fetch = vi.fn().mockResolvedValue(response("cs_retained_custom"));
    vi.stubGlobal("fetch", fetch);
    mountModal(); await advance(120); await advance(1);
    openModal(); await advance(1);
    const wallet = screen.getByTestId("wallet-session");
    const input = screen.getByRole("spinbutton");
    act(() => { fireEvent.change(input, { target: { value: "1" } }); });
    expect(screen.getByTestId("wallet-session")).toBe(wallet);
    expect(wallet.closest("[inert]")).not.toBeNull();
    act(() => { fireEvent.change(input, { target: { value: "50" } }); });
    await advance(1);
    expect(screen.getByTestId("wallet-session")).toBe(wallet);
    expect(wallet.closest("[inert]")).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not show an endless amount-update state when the device has no supported wallet", async () => {
    walletReadiness.available = false;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response("cs_unavailable")));
    mountModal(); await advance(120); await advance(1);
    openModal(); await advance(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("initializes the real wallet subtree before Donate is opened and preserves it on opening", async () => {
    const fetch = vi.fn().mockResolvedValue(response("cs_warm_widget"));
    vi.stubGlobal("fetch", fetch);
    mountModal();
    expect(stripePreparation.prepare).toHaveBeenCalled();
    await advance(120);
    await advance(1);
    const warmWallet = screen.getByTestId("wallet-session");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(warmWallet.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(warmWallet.closest("[inert]")).not.toBeNull();
    openModal();
    await advance(1);
    expect(screen.getByTestId("wallet-session")).toBe(warmWallet);
    expect(warmWallet.closest("[inert]")).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("warms only the wallet while closed, without starting the separate card checkout", async () => {
    const fetch = vi.fn().mockResolvedValue(response("cs_wallet_only"));
    vi.stubGlobal("fetch", fetch);
    mountModal();
    await advance(1000);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual(["/api/stripe/express-checkout"]);
  });

  it("keeps wallet warm-up disabled on the hosted-checkout entry pages", async () => {
    navigation.pathname = "/gaza-help";
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    mountModal();
    await advance(1000);
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByTestId("wallet-session")).not.toBeInTheDocument();
  });

  it("shares the warm-up when the donor opens the modal immediately", async () => {
    const fetch = vi.fn().mockImplementation((url: string) => Promise.resolve(
      url === "/api/stripe/checkout"
        ? new Response(JSON.stringify({ clientSecret: "card_secret", sessionId: "cs_card", totalAmountMinor: 5000, currency: "USD" }))
        : response("cs_immediate"),
    ));
    vi.stubGlobal("fetch", fetch);
    mountModal();
    openModal();
    await advance(1);
    await advance(120);
    expect(screen.getByTestId("wallet-session")).toHaveTextContent("cs_immediate_secret");
    expect(fetch.mock.calls.filter(([url]) => url === "/api/stripe/express-checkout")).toHaveLength(1);
  });

  it("warms the current currency after a currency change instead of mounting a stale wallet", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(response("cs_usd_warm")).mockResolvedValueOnce(response("cs_eur_warm"));
    vi.stubGlobal("fetch", fetch);
    const campaign = { ...sampleCampaign, id: `loading-campaign-${++campaignIndex}` };
    const content = { _id: "test-content", title: "Test campaign", slug: sampleCampaign.slug };
    const modal = (currency: Currency, exchangeRate: number) => <DonationModal campaign={campaign} content={content} locale="en" currency={currency} exchangeRate={exchangeRate} />;
    const view = render(modal("USD", 1));
    await advance(120);
    await advance(1);
    view.rerender(modal("EUR", 0.9));
    await advance(120);
    await advance(1);
    expect(screen.getByTestId("wallet-session")).toHaveTextContent("cs_eur_warm_secret");
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({ amountCents: 4500, currency: "EUR" });
    openModal();
    await advance(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("reuses the session warmed by the campaign page instead of creating another on modal open", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(response("cs_prefetched")).mockResolvedValue(response("cs_duplicate"));
    vi.stubGlobal("fetch", fetch);
    mountModal();
    await advance(120);
    expect(fetch).toHaveBeenCalledTimes(1);
    openModal();
    await advance(1);
    expect(screen.getByTestId("wallet-session")).toHaveTextContent("cs_prefetched_secret");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("shares an in-flight warm-up instead of starting a second request", async () => {
    let resolve!: (response: Response) => void;
    const fetch = vi.fn().mockReturnValue(new Promise<Response>((done) => { resolve = done; }));
    vi.stubGlobal("fetch", fetch);
    mountModal();
    await advance(120);
    openModal();
    await advance(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => { resolve(response("cs_inflight")); });
    expect(screen.getByTestId("wallet-session")).toHaveTextContent("cs_inflight_secret");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries a warm-up that failed while the modal was closed", async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error("temporary network failure"))
      .mockResolvedValueOnce(response("cs_recovered"));
    vi.stubGlobal("fetch", fetch);
    mountModal();
    await advance(120);
    openModal();
    await advance(1);
    expect(screen.getByTestId("wallet-session")).toHaveTextContent("cs_recovered_secret");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("recovers when the shared warm-up fails after the donor has opened the modal", async () => {
    let reject!: (error: Error) => void;
    const fetch = vi.fn().mockReturnValueOnce(new Promise<Response>((_, fail) => { reject = fail; }))
      .mockResolvedValueOnce(response("cs_retry"));
    vi.stubGlobal("fetch", fetch);
    mountModal();
    await advance(120);
    openModal();
    await advance(1);
    await act(async () => { reject(new Error("failed warm-up")); });
    expect(screen.getByTestId("wallet-session")).toHaveTextContent("cs_retry_secret");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("creates the newly selected amount instead of reusing a cached session with the old amount", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(response("cs_initial")).mockResolvedValueOnce(response("cs_changed"));
    vi.stubGlobal("fetch", fetch);
    mountModal();
    await advance(120);
    openModal();
    await advance(1);
    act(() => { fireEvent.click(screen.getByRole("radio", { name: /\$100\b/ })); });
    await advance(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({ amountCents: 10000, currency: "USD", frequency: "monthly" });
    expect(screen.getAllByTestId("wallet-session").map((element) => element.textContent)).toContain("cs_changed_secret");
  });

  it("activates an already-ready cached amount without another request or a loading overlay", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(response("cs_fifty")).mockResolvedValueOnce(response("cs_hundred"));
    vi.stubGlobal("fetch", fetch);
    mountModal();
    await advance(120);
    openModal();
    await advance(1);
    act(() => { fireEvent.click(screen.getByRole("radio", { name: /\$100\b/ })); });
    await advance(1);
    act(() => { fireEvent.click(screen.getByRole("radio", { name: /^\$50(?!\d)/ })); });
    await advance(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    const selectedWallet = screen.getByText("cs_fifty_secret").parentElement!;
    expect(selectedWallet.className).toContain("relative");
    expect(selectedWallet.className).not.toContain("pointer-events-none");
  });

  it("resets a changed amount on close while warming the default wallet for reopening", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(response("cs_reset_default")).mockResolvedValueOnce(response("cs_reset_changed"));
    vi.stubGlobal("fetch", fetch);
    mountModal();
    await advance(121);
    openModal();
    await advance(1);
    act(() => { fireEvent.click(screen.getByRole("radio", { name: /\$100\b/ })); });
    await advance(1);
    act(() => { fireEvent.click(screen.getByRole("button", { name: "Close donation form" })); });
    await advance(151);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const warmWallet = screen.getByTestId("wallet-session");
    expect(warmWallet).toHaveTextContent("cs_reset_default_secret");
    openModal();
    await advance(1);
    expect(screen.getByRole("radio", { name: /^\$50(?!\d)/ })).toBeChecked();
    expect(screen.getByTestId("wallet-session")).toBe(warmWallet);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

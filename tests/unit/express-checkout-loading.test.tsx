import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect, useEffectEvent, type ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleCampaign } from "@/lib/sample-data";
import { DONATION_MODAL_OPEN_EVENT } from "@/components/donation/donation-modal-events";
import type { Currency } from "@/lib/currency";

const navigation = vi.hoisted(() => ({ pathname: "/gaza-food" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));
vi.mock("next/image", () => ({
  // Mock the framework's image wrapper with the native DOM element in jsdom.
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt="" />,
}));
vi.mock("@/components/donation/donation-payment", () => ({ DonationPayment: () => null }));
function MockWallet({ clientSecret, onAvailabilityChange }: { clientSecret: string; onAvailabilityChange?: (available: boolean) => void }) {
  const reportReady = useEffectEvent(() => onAvailabilityChange?.(true));
  useEffect(() => { reportReady(); }, [clientSecret]);
  return <div data-testid="wallet-session">{clientSecret}</div>;
}
vi.mock("@/components/donation/donation-express-checkout", () => ({
  DonationExpressCheckout: MockWallet,
}));

import { DonationModal } from "@/components/donation/donation-modal";

beforeEach(() => { vi.useFakeTimers(); navigation.pathname = "/gaza-food"; });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

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
  it("initializes the real wallet subtree before Donate is opened and preserves it on opening", async () => {
    const fetch = vi.fn().mockResolvedValue(response("cs_warm_widget"));
    vi.stubGlobal("fetch", fetch);
    mountModal();
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

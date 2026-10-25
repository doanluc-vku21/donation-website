import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleCampaign } from "@/lib/sample-data";
import { DONATION_MODAL_OPEN_EVENT } from "@/components/donation/donation-modal-events";

vi.mock("next/navigation", () => ({ usePathname: () => "/gaza-food" }));
vi.mock("next/image", () => ({ default: (props: ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt="" /> }));
vi.mock("@/components/donation/donation-payment", () => ({ DonationPayment: () => null }));
vi.mock("@/components/donation/donation-express-checkout", () => ({
  DonationExpressCheckout: ({ clientSecret }: { clientSecret: string }) => <div data-testid="wallet-session">{clientSecret}</div>,
}));

import { DonationModal } from "@/components/donation/donation-modal";

beforeEach(() => { vi.useFakeTimers(); });
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
});

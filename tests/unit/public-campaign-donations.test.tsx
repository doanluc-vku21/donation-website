import { act, render } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Campaign } from "@/lib/sample-data";
import { sampleCampaign } from "@/lib/sample-data";

const forwarded = vi.hoisted(() => ({ modal: vi.fn() }));
vi.mock("next/image", () => ({
  default: ({ alt, priority, ...props }: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    void priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={alt} />;
  },
}));
vi.mock("@/components/i18n/locale-currency-switcher", () => ({ LocaleCurrencySwitcher: () => null }));
vi.mock("@/components/donation/donation-modal", () => ({
  DonationModal: ({ campaign }: { campaign: Campaign }) => { forwarded.modal(campaign); return null; },
}));

import { CampaignPage } from "@/components/campaign/campaign-page";

let intersections: IntersectionObserverCallback[];
beforeEach(() => {
  vi.clearAllMocks();
  intersections = [];
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersections.push(callback); }
    observe() {}
    disconnect() {}
  });
});
afterEach(() => { vi.unstubAllGlobals(); });

const hidden = { id: "838ce591-f138-439c-9258-0f421dff2d4d", displayName: "Hidden test donor", amountUsd: 1000, frequency: "monthly" as const, relativeTime: "just now" };
const content = { _id: "visibility-content", title: "Campaign visibility", slug: "akram-shake" };

function showStickyBar() {
  expect(intersections.length).toBeGreaterThan(0);
  act(() => {
    for (const callback of intersections) callback([
      { isIntersecting: false, boundingClientRect: { bottom: -1 } } as IntersectionObserverEntry,
    ], {} as IntersectionObserver);
  });
}

describe("public campaign donation visibility", () => {
  it.each([2500, 1000])("uses the next public gift in every latest-donation hint, including a legitimate %s-cent gift", (amountUsd) => {
    const next = { ...hidden, id: "visible-payment", displayName: "Visible donor", amountUsd };
    const campaign = { ...sampleCampaign, recentDonations: [hidden, next] };
    const { container } = render(<CampaignPage campaign={campaign} content={content} locale="en" currency="USD" exchangeRate={1} />);
    showStickyBar();

    expect(container).not.toHaveTextContent("Hidden test donor");
    const hints = [...container.querySelectorAll("p")].filter(p => /Visible donor\s+donated/.test(p.textContent ?? ""));
    expect(hints).toHaveLength(3);
    for (const hint of hints) expect(hint).toHaveTextContent(`$${amountUsd / 100}`);
    expect(forwarded.modal).toHaveBeenLastCalledWith(expect.objectContaining({
      recentDonations: [next], raisedAmountUsd: campaign.raisedAmountUsd,
      goalAmountUsd: campaign.goalAmountUsd, donorCount: campaign.donorCount,
    }));
    expect(campaign.recentDonations).toEqual([hidden, next]);
  });

  it("omits latest-donation hints when there is no public gift while retaining financial and supporter totals", () => {
    const campaign = { ...sampleCampaign, recentDonations: [hidden], supporterProgress: { count: 1, goal: 100 } };
    const { container } = render(<CampaignPage campaign={campaign} content={content} locale="en" currency="USD" exchangeRate={1} />);
    showStickyBar();
    expect(container).not.toHaveTextContent("Hidden test donor");
    expect([...container.querySelectorAll("p")].some(p => /donated/.test(p.textContent ?? ""))).toBe(false);
    expect(forwarded.modal).toHaveBeenLastCalledWith(expect.objectContaining({
      recentDonations: [], supporterProgress: { count: 1, goal: 100 },
      raisedAmountUsd: campaign.raisedAmountUsd, donorCount: campaign.donorCount,
    }));
  });
});

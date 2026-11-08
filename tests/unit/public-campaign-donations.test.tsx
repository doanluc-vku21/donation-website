import { act, fireEvent, render, within } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Campaign } from "@/lib/sample-data";
import { sampleCampaign } from "@/lib/sample-data";
import { locales } from "@/lib/i18n";
import { getUiTranslations } from "@/lib/ui-translations";

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
  vi.useFakeTimers();
  intersections = [];
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersections.push(callback); }
    observe() {}
    disconnect() {}
  });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

const hidden = { id: "838ce591-f138-439c-9258-0f421dff2d4d", displayName: "Hidden test donor", amountUsd: 1000, frequency: "monthly" as const, relativeTime: "just now" };
const content = { _id: "visibility-content", title: "Campaign visibility", slug: "akram-shake" };
const newest = { ...hidden, id: "newest-payment", displayName: "Newest donor", amountUsd: 4000 };
const second = { ...hidden, id: "second-payment", displayName: "Second donor", amountUsd: 2500 };
const third = { ...hidden, id: "third-payment", displayName: "Third donor", amountUsd: 3000 };
const rotatingCampaign = { ...sampleCampaign, recentDonations: [hidden, newest, second, third] };

function expectHints(container: HTMLElement, donation: typeof newest, count: number) {
  const hints = [...container.querySelectorAll("[data-recent-donation-id]")];
  expect(hints).toHaveLength(count);
  for (const hint of hints) {
    expect(hint).toHaveAttribute("data-recent-donation-id", donation.id);
    expect(hint).toHaveTextContent(donation.displayName);
    expect(hint).toHaveTextContent(`$${donation.amountUsd / 100}`);
  }
}

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
    expect(vi.getTimerCount()).toBe(0);
  });

  it("starts newest, rotates at six seconds, and synchronizes a sticky bar that appears later", () => {
    const { container, unmount } = render(<CampaignPage campaign={rotatingCampaign} content={content} locale="en" currency="USD" exchangeRate={1} />);
    expectHints(container, newest, 2);
    const modalRenders = forwarded.modal.mock.calls.length;
    expect(vi.getTimerCount()).toBe(1);
    act(() => { vi.advanceTimersByTime(5999); });
    expectHints(container, newest, 2);
    act(() => { vi.advanceTimersByTime(1); });
    expectHints(container, second, 2);
    showStickyBar();
    expectHints(container, second, 3);
    expect(vi.getTimerCount()).toBe(1);
    act(() => { vi.advanceTimersByTime(6000); });
    expectHints(container, third, 3);
    act(() => { vi.advanceTimersByTime(6000); });
    expectHints(container, newest, 3);
    expect(container).not.toHaveTextContent("Hidden test donor");
    expect(rotatingCampaign.recentDonations).toEqual([hidden, newest, second, third]);
    expect(forwarded.modal).toHaveBeenCalledTimes(modalRenders);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("gives separate visits independent timers and resets a fresh visit to the newest donation", () => {
    const first = render(<CampaignPage campaign={rotatingCampaign} content={content} locale="en" currency="USD" exchangeRate={1} />);
    act(() => { vi.advanceTimersByTime(3000); });
    const later = render(<CampaignPage campaign={rotatingCampaign} content={content} locale="en" currency="USD" exchangeRate={1} />);
    expectHints(later.container, newest, 2);
    act(() => { vi.advanceTimersByTime(3000); });
    expectHints(first.container, second, 2);
    expectHints(later.container, newest, 2);
    act(() => { vi.advanceTimersByTime(3000); });
    expectHints(first.container, second, 2);
    expectHints(later.container, second, 2);
    first.unmount();
    later.unmount();
    expect(vi.getTimerCount()).toBe(0);
    const fresh = render(<CampaignPage campaign={rotatingCampaign} content={content} locale="en" currency="USD" exchangeRate={1} />);
    expectHints(fresh.container, newest, 2);
  });

  it("pauses all hints from one control and resumes them together after a full interval", () => {
    const { container } = render(<CampaignPage campaign={rotatingCampaign} content={content} locale="en" currency="USD" exchangeRate={1} />);
    showStickyBar();
    act(() => { vi.advanceTimersByTime(6000); });
    fireEvent.click(within(container).getAllByRole("button", { name: "Pause recent donations" })[0]);
    expect(within(container).getAllByRole("button", { name: "Resume recent donations" })).toHaveLength(3);
    expect(vi.getTimerCount()).toBe(0);
    act(() => { vi.advanceTimersByTime(12000); });
    expectHints(container, second, 3);
    fireEvent.click(within(container).getAllByRole("button", { name: "Resume recent donations" })[2]);
    act(() => { vi.advanceTimersByTime(5999); });
    expectHints(container, second, 3);
    act(() => { vi.advanceTimersByTime(1); });
    expectHints(container, third, 3);
  });

  it("keeps its clock through currency refreshes and restarts cleanly for a changed donation sequence", () => {
    const { container, rerender } = render(<CampaignPage campaign={rotatingCampaign} content={content} locale="en" currency="USD" exchangeRate={1} />);
    act(() => { vi.advanceTimersByTime(3000); });
    rerender(<CampaignPage campaign={{ ...rotatingCampaign, recentDonations: [...rotatingCampaign.recentDonations] }} content={content} locale="en" currency="GBP" exchangeRate={0.8} />);
    act(() => { vi.advanceTimersByTime(3000); });
    const refreshed = [...container.querySelectorAll("[data-recent-donation-id]")];
    expect(refreshed).toHaveLength(2);
    for (const hint of refreshed) {
      expect(hint).toHaveAttribute("data-recent-donation-id", second.id);
      expect(hint).toHaveTextContent("£20");
    }
    const fresh = { ...newest, id: "fresh-payment", displayName: "Fresh donor", amountUsd: 5000 };
    rerender(<CampaignPage campaign={{ ...rotatingCampaign, recentDonations: [fresh, newest, second] }} content={content} locale="en" currency="USD" exchangeRate={1} />);
    expectHints(container, fresh, 2);
    act(() => { vi.advanceTimersByTime(5999); });
    expectHints(container, fresh, 2);
    act(() => { vi.advanceTimersByTime(1); });
    expectHints(container, newest, 2);
    expect(vi.getTimerCount()).toBe(1);
  });

  it("does not start a rotation timer for a single public gift", () => {
    const { container } = render(<CampaignPage campaign={{ ...sampleCampaign, recentDonations: [hidden, newest] }} content={content} locale="en" currency="USD" exchangeRate={1} />);
    showStickyBar();
    expectHints(container, newest, 3);
    expect(within(container).queryByRole("button", { name: "Pause recent donations" })).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
    act(() => { vi.advanceTimersByTime(24000); });
    expectHints(container, newest, 3);
  });

  it("keeps anonymous amounts private as the rotation advances", () => {
    const anonymous = { ...second, displayName: "Anonymous", amountUsd: 731 };
    const { container } = render(<CampaignPage campaign={{ ...sampleCampaign, recentDonations: [newest, anonymous] }} content={content} locale="en" currency="USD" exchangeRate={1} />);
    showStickyBar();
    act(() => { vi.advanceTimersByTime(6000); });
    const hints = [...container.querySelectorAll("[data-recent-donation-id]")];
    expect(hints).toHaveLength(3);
    for (const hint of hints) {
      expect(hint).toHaveAttribute("data-recent-donation-id", anonymous.id);
      expect(hint).toHaveTextContent("Anonymous");
      expect(hint).not.toHaveTextContent("$7.31");
      expect(hint).not.toHaveTextContent("donated");
    }
  });

  it.each(locales)("localizes shared pause and resume controls in %s", (locale) => {
    const { container } = render(<CampaignPage campaign={rotatingCampaign} content={content} locale={locale} currency="USD" exchangeRate={1} />);
    showStickyBar();
    const t = getUiTranslations(locale);
    const controls = within(container).getAllByRole("button", { name: t.pauseRecentDonations });
    expect(controls).toHaveLength(3);
    fireEvent.click(controls[0]);
    expect(within(container).getAllByRole("button", { name: t.resumeRecentDonations })).toHaveLength(3);
    act(() => { vi.advanceTimersByTime(12000); });
    for (const hint of container.querySelectorAll("[data-recent-donation-id]")) {
      expect(hint).toHaveAttribute("data-recent-donation-id", newest.id);
      expect(hint.parentElement).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    }
  });
});

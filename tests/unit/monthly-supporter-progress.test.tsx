import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ImgHTMLAttributes } from "react";
import { MonthlySupporterProgress } from "@/components/campaign/monthly-supporter-progress";
import { CampaignDonateCard } from "@/components/campaign/campaign-donate-card";
import { MobileCampaignHero } from "@/components/campaign/mobile-campaign-hero";
import { MobileDonateBar } from "@/components/donation/mobile-donate-bar";
import { sampleCampaign } from "@/lib/sample-data";

vi.mock("next/image", () => ({
  default: ({ alt, priority, ...props }: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    void priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={alt} />;
  },
}));
afterEach(() => { vi.unstubAllGlobals(); });

describe("monthly supporter progress", () => {
  it("matches the reference count, percentage, goal, and invitation", () => {
    render(<MonthlySupporterProgress progress={{ count: 74, goal: 100 }} locale="en" />);
    expect(screen.getByText("74 Monthly Supporters")).toBeVisible();
    expect(screen.getByText("74%")).toBeVisible();
    expect(screen.getByText("of our 100 supporter goal")).toBeVisible();
    expect(screen.getByText("Join us in helping more people like Akram")).toBeVisible();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "74");
  });

  it.each([[0, "0"], [1, "1"], [100, "100"], [140, "100"]])("keeps %s supporters accessible even beyond the goal", (count, percent) => {
    render(<MonthlySupporterProgress progress={{ count, goal: 100 }} locale="en" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", percent);
    expect(screen.getByText(`${count} ${count === 1 ? "Monthly Supporter" : "Monthly Supporters"}`)).toBeVisible();
  });

  it("does not show an unavailable count as zero or as a fabricated 74", () => {
    render(<MonthlySupporterProgress progress={{ count: null, goal: 100 }} locale="en" />);
    expect(screen.getByText("Supporter count is temporarily unavailable.")).toBeVisible();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText(/74|0%/)).not.toBeInTheDocument();
  });

  const props = { campaign: { ...sampleCampaign, supporterProgress: { count: 74, goal: 100 } },
    content: { _id: "akram", slug: "akram-shake", title: "Akram monthly" }, locale: "en" as const,
    currency: "USD" as const, exchangeRate: 1 };

  it.each([CampaignDonateCard, MobileCampaignHero])("replaces amount progress on desktop and inline mobile surfaces", (Component) => {
    render(<Component {...props} />);
    expect(screen.getByText("74 Monthly Supporters")).toBeVisible();
    expect(screen.queryByText(/raised|\$100,000/)).not.toBeInTheDocument();
  });

  it("also replaces amount progress in the mobile sticky donation bar", () => {
    let intersection!: IntersectionObserverCallback;
    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback: IntersectionObserverCallback) { intersection = callback; }
      observe() {}
      disconnect() {}
    });
    render(<><div id="mobile-inline-donate" /><MobileDonateBar {...props} /></>);
    act(() => { intersection([{ isIntersecting: false, boundingClientRect: { bottom: -1 } } as IntersectionObserverEntry], {} as IntersectionObserver); });
    expect(screen.getByText("74 Monthly Supporters")).toBeVisible();
    expect(screen.queryByText(/raised/)).not.toBeInTheDocument();
  });

  it("preserves amount progress when a page has no supporter goal", () => {
    render(<CampaignDonateCard {...props} campaign={sampleCampaign} />);
    expect(screen.queryByText(/Monthly Supporters/)).not.toBeInTheDocument();
    expect(screen.getByText(/raised/)).toBeVisible();
  });

  it("supports Arabic direction and translated copy", () => {
    const { container } = render(<MonthlySupporterProgress progress={{ count: 74, goal: 100 }} locale="ar" />);
    expect(container.firstChild).toHaveAttribute("dir", "rtl");
    expect(screen.getByText(/داعمون شهريون/)).toBeVisible();
  });
});

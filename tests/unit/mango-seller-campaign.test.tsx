import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { CampaignPage } from "@/components/campaign/campaign-page";
import { FundUsage } from "@/components/campaign/fund-usage";
import { locales } from "@/lib/i18n";
import { localizeMangoSellerCampaign } from "@/lib/mango-seller-campaign";
import { sampleCampaign } from "@/lib/sample-data";
import type { SanityCampaign } from "@/sanity/types/campaign";

vi.mock("@/components/donation/donation-modal", () => ({ DonationModal: () => null }));
vi.mock("@/components/donation/mobile-donate-bar", () => ({ MobileDonateBar: () => null }));
vi.mock("@/components/campaign/campaign-donate-card", () => ({ CampaignDonateCard: () => null }));
vi.mock("@/components/campaign/mobile-campaign-hero", () => ({ MobileCampaignHero: () => null }));
vi.mock("@/components/i18n/locale-currency-switcher", () => ({ LocaleCurrencySwitcher: () => null }));
vi.mock("@/components/campaign/mobile-story-toggle", () => ({
  MobileStoryToggle: ({ children }: { children: ReactNode }) => <div data-testid="collapsed-story">{children}</div>,
}));

const original: SanityCampaign = {
  _id: "mango-document", slug: "help-mango-seller", title: "Draft",
  titleI18n: { en: "Draft" }, summaryI18n: { en: "Old description" },
  fundUsageItems: [{ _key: "old", amount: 7000, title: "Old allocation" }],
  heroImage: { alt: "Mango seller", asset: { _id: "mango-photo", url: "https://cdn.sanity.io/mango.jpg" } },
  goalAmount: 2500,
};

describe("mango seller landing content", () => {
  it.each(locales)("provides complete localized copy in %s without replacing identity or media", locale => {
    const content = localizeMangoSellerCampaign(original, locale);
    expect(content._id).toBe(original._id);
    expect(content.slug).toBe(original.slug);
    expect(content.heroImage).toBe(original.heroImage);
    expect(content.goalAmount).toBe(original.goalAmount);
    expect(content.title).not.toContain("Draft");
    expect(content.summary?.split("\n\n")).toHaveLength(3);
    expect(content.story).toHaveLength(3);
    expect(content.fundUsageItems).toHaveLength(4);
    expect(content.fundUsageItems?.every(item => item.title && item.description && item.amount == null)).toBe(true);
    expect(content.seoTitle).toBe(content.title);
    expect(content.seoDescription).toBe(content.summary);
  });

  it("renders exactly the requested English categories without the old dollar allocations", () => {
    const content = localizeMangoSellerCampaign(original, "en");
    render(<FundUsage content={content} locale="en" currency="USD" exchangeRate={1} />);
    for (const name of ["How Your Donation Will Help", "🍚 Food & Daily Essentials", "❤️ Medical Care & Well-Being", "🏠 Safe & Comfortable Living", "🤝 Long-Term Financial Support"]) {
      expect(screen.getByRole("heading", { name })).toBeVisible();
    }
    expect(screen.queryByText(/Old allocation|7,000/)).not.toBeInTheDocument();
    expect(original.fundUsageItems?.[0].amount).toBe(7000);
  });

  it("shows the description and full mobile story only when requested by the new page", () => {
    const content = localizeMangoSellerCampaign(original, "en");
    const props = { campaign: sampleCampaign, content, locale: "en" as const, currency: "USD" as const, exchangeRate: 1 };
    const { container, rerender } = render(<CampaignPage {...props} showSummary expandStory />);
    expect(screen.queryByTestId("collapsed-story")).not.toBeInTheDocument();
    expect(screen.getAllByText("THE STORY BEHIND OUR MISSION")).toHaveLength(2);
    expect(screen.getAllByRole("heading", { name: "Why He Deserves Our Support ❤️" })).toHaveLength(2);
    const summaryParagraphs = () => Array.from(container.querySelectorAll("p")).filter(paragraph => paragraph.textContent === content.summary);
    expect(summaryParagraphs()).toHaveLength(2);
    expect(container.querySelector("[style*='max-height']")).toBeNull();
    expect(screen.getAllByText("❤️ Your monthly donation can help give him a more comfortable, secure, and hopeful future.")).toHaveLength(2);

    rerender(<CampaignPage {...props} />);
    expect(screen.getByTestId("collapsed-story")).toBeInTheDocument();
    expect(summaryParagraphs()).toHaveLength(0);
  });

  it("keeps an independently authored CMS story instead of discarding its full text", () => {
    const story: NonNullable<SanityCampaign["story"]> = [{
      _type: "block", _key: "approved", style: "normal", markDefs: [],
      children: [{ _type: "span", _key: "text", text: "Approved full story", marks: [] }],
    }];
    expect(localizeMangoSellerCampaign({ ...original, story }, "en").story).toBe(story);
  });
});

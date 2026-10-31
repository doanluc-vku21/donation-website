import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CampaignStory } from "@/components/campaign/campaign-story";
import { FundUsage } from "@/components/campaign/fund-usage";
import { localizeAkramMonthlyCampaign } from "@/lib/akram-monthly-campaign";
import { locales } from "@/lib/i18n";
import { localizeCampaign } from "@/lib/localize-campaign";
import { localizePalestineMonthlyCampaign } from "@/lib/palestine-monthly-campaign";
import { sampleCampaign } from "@/lib/sample-data";
import type { SanityCampaign } from "@/sanity/types/campaign";

const original: SanityCampaign = {
  _id: "akram-content", slug: "akram-shake", title: "Original Akram headline",
  titleI18n: { en: "Original Akram headline" }, storyHeadingI18n: { en: "Original story heading" },
  fundUsageTitleI18n: { en: "Original fund title" }, fundUsageSubtitleI18n: { en: "Original fund subtitle" },
  fundUsageItems: [{ _key: "old-allocation", amount: 7000, title: "Safe & Stable Housing" }],
  heroImage: { alt: "Akram photo" }, goalAmount: 20000,
};

describe("Akram monthly community copy", () => {
  it("renders the supplied story with headings and inline emphasis", () => {
    const content = localizeAkramMonthlyCampaign(original, "en");
    expect(content.title).toBe("❤️ Help More People Like Akram Build a Better Future");
    render(<CampaignStory campaign={sampleCampaign} content={content} />);
    expect(screen.getByRole("heading", { name: "❤️ Together, We Can Help More People Like Akram" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "❤️ Your Monthly Support Makes a Difference" })).toBeVisible();
    expect(screen.getByText("$25 a month", { selector: "strong" })).toBeVisible();
    expect(screen.getByText("❤️ Give Monthly. Help More Lives. Make a Lasting Difference.")).toBeVisible();
    expect(screen.queryByText(/Every day, countless people in Palestine/)).not.toBeInTheDocument();
  });

  it("replaces fixed-dollar allocations with all four requested fund uses", () => {
    render(<FundUsage content={localizeAkramMonthlyCampaign(original, "en")} locale="en" currency="USD" exchangeRate={1} />);
    expect(screen.getByRole("heading", { name: "❤️ How the Funds Will Be Used" })).toBeVisible();
    for (const name of ["❤️ Food & Daily Essentials", "🏥 Medical Care & Treatment", "🤝 Disability & Family Support", "🌍 Long-Term Assistance"]) {
      expect(screen.getByRole("heading", { name })).toBeVisible();
    }
    expect(screen.getByText("🙏 Together, we can change more lives, one month at a time. ❤️")).toBeVisible();
    expect(screen.queryByText(/Safe & Stable Housing|\$7,000|Original fund/)).not.toBeInTheDocument();
  });

  it.each(locales)("provides complete story and fund content in %s while retaining media and accounting", (locale) => {
    const content = localizeAkramMonthlyCampaign(original, locale);
    expect(content.title).not.toContain("Original");
    expect(content.story).toHaveLength(9);
    expect(content.fundUsageItems).toHaveLength(6);
    expect(content.fundUsageItems?.every((item) => item.itemType === "text" && item.amount == null)).toBe(true);
    expect(content.heroImage).toBe(original.heroImage);
    expect(content.goalAmount).toBe(20000);
  });

  it("does not change the Gaza page or the original CMS content", () => {
    localizeAkramMonthlyCampaign(original, "en");
    expect(localizePalestineMonthlyCampaign(original, "en").title).toBe("🇵🇸 ❤️ Bring Hope and Relief to Palestine");
    expect(localizeCampaign(original, "en").title).toBe("Original Akram headline");
    expect(original.fundUsageItems?.[0].amount).toBe(7000);
  });
});

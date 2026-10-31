import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CampaignStory } from "@/components/campaign/campaign-story";
import { locales } from "@/lib/i18n";
import { localizeCampaign } from "@/lib/localize-campaign";
import { localizePalestineMonthlyCampaign } from "@/lib/palestine-monthly-campaign";
import { sampleCampaign } from "@/lib/sample-data";
import type { SanityCampaign } from "@/sanity/types/campaign";

const original: SanityCampaign = {
  _id: "shared-content", slug: "akram-shake", title: "Original headline", titleI18n: { en: "Old English title", fr: "Ancien titre" },
  storyHeadingI18n: { en: "Old heading" },
  heroImage: { alt: "Campaign photo" }, goalAmount: 50000,
};

describe("Palestine monthly entry-page copy", () => {
  it("renders the supplied English story instead of stale CMS translations", () => {
    const content = localizePalestineMonthlyCampaign(original, "en");
    expect(content.title).toBe("🇵🇸 ❤️ Bring Hope and Relief to Palestine");
    render(<CampaignStory campaign={sampleCampaign} content={content} />);
    expect(screen.getByText("Why this matters")).toBeVisible();
    expect(screen.getByRole("heading", { name: "🇵🇸 ❤️ Every Life Matters. Every Act of Kindness Brings Hope." })).toBeVisible();
    expect(screen.getByText("❤️ Just $25 a month can make a meaningful difference.")).toBeVisible();
    expect(screen.getByText("🇵🇸 Become a monthly supporter today. Give hope. Change lives.")).toBeVisible();
    expect(content.story).toHaveLength(6);
  });

  it.each(locales)("provides the updated headline and complete story in %s", (locale) => {
    const content = localizePalestineMonthlyCampaign(original, locale);
    expect(content.title).not.toMatch(/Original|Old|Ancien/);
    expect(content.story).toHaveLength(6);
    expect(content.storyHeading).not.toBe("Old heading");
    expect(content.heroImage).toBe(original.heroImage);
    expect(content.goalAmount).toBe(original.goalAmount);
  });

  it("keeps the original shared content available to other pages", () => {
    localizePalestineMonthlyCampaign(original, "en");
    expect(localizeCampaign(original, "en").title).toBe("Old English title");
    expect(original.story).toBeUndefined();
  });

  it("renders the Arabic story from right to left", () => {
    const { container } = render(<CampaignStory campaign={sampleCampaign}
      content={localizePalestineMonthlyCampaign(original, "ar")} locale="ar" />);
    expect(container.querySelector("section")).toHaveAttribute("dir", "rtl");
  });
});

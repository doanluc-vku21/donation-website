import { describe, expect, it } from "vitest";
import { getCampaignMetadata } from "@/lib/campaign-metadata";
import { locales } from "@/lib/i18n";
import { localizeStreetVendorCampaign, STREET_VENDOR_SLUG } from "@/lib/street-vendor-campaign";
import type { SanityCampaign } from "@/sanity/types/campaign";

const original: SanityCampaign = { _id: "street-vendor-content", slug: STREET_VENDOR_SLUG, title: "Draft" };

describe("street vendor campaign content", () => {
  it.each(locales)("provides localized approved content and the supplied portrait in %s", locale => {
    const content = localizeStreetVendorCampaign(original, locale);
    expect(content.slug).toBe(STREET_VENDOR_SLUG);
    expect(content.title).not.toBe("Draft");
    expect(content.story).toHaveLength(5);
    expect(content.summary?.split("\n\n")).toHaveLength(5);
    expect(content.story?.[2].children[0].marks).toEqual(["strong"]);
    expect(content.fundUsageItems).toHaveLength(4);
    expect(content.fundUsageItems?.every(item => item.title && item.description && item.amount == null)).toBe(true);
    expect(content.heroImage?.asset).toMatchObject({ url: "/street-vendor.jpg", metadata: { dimensions: { width: 589, height: 1280 } } });
    expect(content.goalAmount).toBeUndefined();
    expect(content.seoTitle).toBe(content.title);
    expect(original).toEqual({ _id: "street-vendor-content", slug: STREET_VENDOR_SLUG, title: "Draft" });
  });

  it("uses the supplied English story and monthly support goal without another beneficiary's background", () => {
    const content = localizeStreetVendorCampaign(original, "en");
    expect(content.title).toBe("❤️ He Works Hard Every Day to Support His Family. Now It’s Our Turn to Help Him.");
    expect(content.storyHeading).toBe("Why He Needs Our Support ❤️");
    expect(content.story?.map(block => block.children.map(span => span.text).join(""))).toEqual([
      "Despite living with a physical disability, he continues working hard on the streets to earn a living and provide for his family. Every day brings new challenges, but his determination to keep going is inspiring.",
      "Supporting his family is not easy. From putting food on the table to covering household expenses and essential daily needs, he faces financial struggles that no family should have to endure alone.",
      "❤️ Our Goal: $3,000 in Monthly Support",
      "Meal Support Inc is raising funds with the goal of providing him with $3,000 every month to help cover food, housing, medical care, and essential family expenses.",
      "❤️ Your monthly donation can help ease his financial burden, provide greater stability for his family, and give them hope for a brighter future.",
    ]);
    expect(JSON.stringify(content)).not.toMatch(/mango|2,500|2500|Akram|Ryan/i);
  });

  it("keeps separately authored CMS story, allocations, goal and media", () => {
    const authored: SanityCampaign = {
      ...original, goalAmount: 7000,
      story: [{ _type: "block", _key: "verified-story", style: "normal", markDefs: [],
        children: [{ _type: "span", _key: "text", text: "Verified background", marks: [] }] }],
      fundUsageItems: [{ _key: "verified", title: "Verified use", description: "Approved allocation" }],
      heroImage: { asset: { _id: "own-photo", url: "https://cdn.sanity.io/own-photo.jpg" } },
    };
    const localized = localizeStreetVendorCampaign(authored, "en");
    expect(localized.story).toBe(authored.story);
    expect(localized.fundUsageItems).toMatchObject(authored.fundUsageItems ?? []);
    expect(localized.goalAmount).toBe(7000);
    expect(localized.heroImage).toBe(authored.heroImage);
  });

  it("uses the independent title and portrait in canonical and share metadata", () => {
    const content = localizeStreetVendorCampaign(original, "en");
    const metadata = getCampaignMetadata(content, `/${STREET_VENDOR_SLUG}`);
    expect(String(metadata.alternates?.canonical)).toContain("/help-street-vendor");
    expect(metadata.openGraph).toMatchObject({ title: content.title, images: [{ url: expect.stringContaining("/street-vendor.jpg") }] });
    expect(metadata.twitter).toMatchObject({ title: content.title, card: "summary_large_image" });
  });
});

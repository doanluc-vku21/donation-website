import { describe, expect, it } from "vitest";
import { getCampaignMetadata } from "@/lib/campaign-metadata";
import { locales } from "@/lib/i18n";
import { localizeStreetVendorCampaign, STREET_VENDOR_SLUG } from "@/lib/street-vendor-campaign";
import type { SanityCampaign } from "@/sanity/types/campaign";

const original: SanityCampaign = { _id: "street-vendor-content", slug: STREET_VENDOR_SLUG, title: "Draft" };

describe("street vendor campaign content", () => {
  it.each(locales)("provides localized draft content and the supplied portrait in %s", locale => {
    const content = localizeStreetVendorCampaign(original, locale);
    expect(content.slug).toBe(STREET_VENDOR_SLUG);
    expect(content.title).not.toBe("Draft");
    expect(content.story).toHaveLength(3);
    expect(content.summary?.split("\n\n")).toHaveLength(3);
    expect(content.fundUsageItems).toHaveLength(2);
    expect(content.fundUsageItems?.every(item => item.title && item.description && item.amount == null)).toBe(true);
    expect(content.heroImage?.asset).toMatchObject({ url: "/street-vendor.jpg", metadata: { dimensions: { width: 589, height: 1280 } } });
    expect(content.goalAmount).toBeUndefined();
    expect(content.seoTitle).toBe(content.title);
    expect(original).toEqual({ _id: "street-vendor-content", slug: STREET_VENDOR_SLUG, title: "Draft" });
  });

  it("keeps unverified disability, medical needs and old support promises out of the new English story", () => {
    const content = localizeStreetVendorCampaign(original, "en");
    expect(content.title).toBe("❤️ He Works Hard Every Day to Support His Family. Now It’s Our Turn to Help Him.");
    expect(JSON.stringify(content)).not.toMatch(/mango|disabil|medical|2,500|2500|Akram|Ryan/i);
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

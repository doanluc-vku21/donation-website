import { describe, expect, it } from "vitest";
import { withRyanCampaignName } from "@/lib/ryan-campaign";
import type { SanityCampaign } from "@/sanity/types/campaign";

describe("Ryan campaign display name", () => {
  it("accepts null optional fields returned by CMS projections", () => {
    const content = JSON.parse('{"_id":"akram","slug":"akram-shake","title":"Help Akram","summary":null,"eyebrow":null,"storyHeading":null,"heroImage":{"alt":null},"fundUsageItems":[{"_key":"fund","title":null,"description":null,"content":null}]}') as SanityCampaign;
    expect(withRyanCampaignName(content).title).toBe("Help Ryan");
    expect(withRyanCampaignName(content).summary).toBeUndefined();
    expect(withRyanCampaignName(content).fundUsageItems?.[0].title).toBeUndefined();
  });

  it("renames display copy and Arabic text without changing identity, media URLs or the CMS source", () => {
    const original: SanityCampaign = {
      _id: "akram-document", slug: "akram-shake", title: "Help Akram", summary: "أكرم needs support",
      heroImage: { alt: "Akram", asset: { _id: "akram-image", url: "https://example.org/akram.jpg" } },
      story: [{ _type: "block", _key: "story", children: [{ _type: "span", _key: "span", text: "Akram's future", marks: [] }], markDefs: [] }],
    };
    const result = withRyanCampaignName(original);
    expect(result.title).toBe("Help Ryan");
    expect(result.summary).toBe("رايان needs support");
    expect(result.story?.[0].children[0].text).toBe("Ryan's future");
    expect(result.heroImage?.alt).toBe("Ryan");
    expect(result.heroImage?.asset).toBe(original.heroImage?.asset);
    expect(result.slug).toBe("akram-shake");
    expect(result._id).toBe("akram-document");
    expect(original.title).toBe("Help Akram");
  });
});

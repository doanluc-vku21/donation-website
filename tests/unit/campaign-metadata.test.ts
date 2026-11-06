import { afterEach, describe, expect, it, vi } from "vitest";
import { getCampaignMetadata } from "@/lib/campaign-metadata";
import { localizeAkramMonthlyCampaign } from "@/lib/akram-monthly-campaign";
import type { SanityCampaign } from "@/sanity/types/campaign";

const original: SanityCampaign = {
  _id: "akram-content", slug: "akram-shake", title: "Akram campaign",
  organizationName: "MEAL SUPPORT INC",
  heroImage: { asset: { _id: "photo", url: "https://cdn.sanity.io/images/example/production/akram.jpg" }, alt: "Akram and his family" },
};

afterEach(() => { vi.unstubAllEnvs(); });

describe("campaign link previews", () => {
  it("resolves a supplied local campaign portrait against the public site URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://donate.mealsupport.org");
    const metadata = getCampaignMetadata({ ...original, heroImage: { asset: { _id: "mango", url: "/mango-seller.jpg" } } }, "/help-mango-seller");
    expect(metadata.openGraph).toMatchObject({ images: [{ url: "https://donate.mealsupport.org/mango-seller.jpg" }] });
    expect(metadata.twitter).toMatchObject({ images: ["https://donate.mealsupport.org/mango-seller.jpg"] });
  });

  it("uses the localized Akram copy and image for page title, Open Graph, and Twitter instead of the global child campaign", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://donate.mealsupport.org");
    const metadata = getCampaignMetadata(localizeAkramMonthlyCampaign(original, "en"), "/akram-shake-1");
    const expectedTitle = "❤️ Help More People Like Akram Build a Better Future";
    expect(metadata.title).toBe(expectedTitle);
    expect(metadata.description).toMatch(/^Akram's story is just one of many\./);
    expect(metadata.openGraph).toMatchObject({ title: expectedTitle, description: metadata.description,
      url: new URL("https://donate.mealsupport.org/akram-shake-1"),
      images: [{ url: original.heroImage?.asset?.url, alt: "Akram and his family" }] });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", title: expectedTitle, description: metadata.description });
    expect(metadata.alternates?.canonical).toEqual(new URL("https://donate.mealsupport.org/akram-shake-1"));
  });

  it("uses translated metadata for Arabic readers", () => {
    const metadata = getCampaignMetadata(localizeAkramMonthlyCampaign(original, "ar"), "/akram-shake-1");
    expect(metadata.title).toBe("❤️ ساعد المزيد من الأشخاص مثل أكرم على بناء مستقبل أفضل");
    expect(metadata.description).toMatch(/^قصة أكرم/);
  });

  it("can describe the original campaign without changing its content or requiring an image", () => {
    const content = { ...original, heroImage: undefined, summary: "Help Akram and his family." };
    const metadata = getCampaignMetadata(content, "/akram-shake-1");
    expect(metadata.title).toBe("Akram campaign");
    expect(metadata.description).toBe("Help Akram and his family.");
    expect(metadata.twitter).toMatchObject({ card: "summary", images: undefined });
    expect(original.title).toBe("Akram campaign");
  });
});

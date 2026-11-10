import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement } from "react";
import { sampleCampaign, type Campaign } from "@/lib/sample-data";
import type { SanityCampaign } from "@/sanity/types/campaign";

const mocks = vi.hoisted(() => ({ campaign: vi.fn(), content: vi.fn(), supporters: vi.fn(), beneficiary: vi.fn() }));
vi.mock("@/components/campaign/campaign-page", () => ({ CampaignPage: () => null }));
vi.mock("@/components/donation/donate-page", () => ({ DonatePage: () => null }));
vi.mock("@/lib/queries/campaigns", () => ({ getCampaignBySlug: mocks.campaign }));
vi.mock("@/lib/queries/beneficiary-content", () => ({ getBeneficiaryContent: mocks.beneficiary }));
vi.mock("@/lib/queries/monthly-supporters", () => ({ getMonthlySupporters: mocks.supporters }));
vi.mock("@/sanity/lib/client", () => ({ sanityClient: { fetch: mocks.content } }));
vi.mock("@/lib/i18n-server", () => ({ getLocale: () => Promise.resolve("en") }));
vi.mock("@/lib/currency-server", () => ({ getCurrencyContext: () => Promise.resolve({ currency: "USD", exchangeRate: 1 }) }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not-found"); } }));

import GazaFoodPage from "@/app/gaza-food/page";
import GazaFoodDonatePage from "@/app/gaza-food/donate/page";
import AkramShakeMonthlyPage from "@/app/akram-shake-3/page";
import AkramShakeUpsellPage from "@/app/akram-shake-2/page";
import MangoSellerPage, { generateMetadata as generateMangoMetadata } from "@/app/help-mango-seller/page";
import AkramShakeDirectPage, { generateMetadata as generateDirectMetadata } from "@/app/akram-shake-1/page";
import { MANGO_SELLER_BASE_RAISED_USD, MANGO_SELLER_SEED_DONATIONS } from "@/lib/mango-seller-campaign";

const original: SanityCampaign = {
  _id: "shared", slug: "shared", title: "Existing campaign headline", titleI18n: { en: "Existing campaign headline" },
  storyHeading: "Existing story heading",
  story: [{ _type: "block", _key: "original-story", style: "normal", markDefs: [],
    children: [{ _type: "span", _key: "original-text", marks: [], text: "Existing Akram story." }] }],
  fundUsageTitle: "Existing fund uses", fundUsageItems: [{ _key: "housing", amount: 7000, title: "Housing" }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.campaign.mockImplementation(async (slug: string) => ({ ...sampleCampaign, slug, id: `campaign-${slug}` }));
  mocks.content.mockResolvedValue(original);
  mocks.beneficiary.mockResolvedValue(original);
  mocks.supporters.mockResolvedValue(Array.from({ length: 12 }, (_, index) => ({ ...sampleCampaign.recentDonations[1], id: String(index) })));
});

describe("monthly campaign entry routes", () => {
  it("loads the mango seller's own accounting and CMS document with the requested one-time gifts", async () => {
    mocks.beneficiary.mockResolvedValue({ ...original, _id: "mango-content", slug: "help-mango-seller", story: [] });
    const result = await MangoSellerPage();
    expect(mocks.campaign).toHaveBeenCalledWith("help-mango-seller");
    expect(mocks.beneficiary).toHaveBeenCalledWith("help-mango-seller");
    expect(result.props.campaign.id).toBe("campaign-help-mango-seller");
    expect(result.props.campaign.slug).toBe("help-mango-seller");
    expect(result.props.content.title).toBe("❤️ He Had So Little, Yet He Chose to Help Us. Now It’s Our Turn to Help Him.");
    expect(result.props.content.summary).toContain("$2,500 in monthly support");
    expect(result.props.expandStory).toBe(true);
    expect(result.props.showSummary).toBe(false);
    expect(result.props.showOneTimeLabels).toBe(true);
    expect(MANGO_SELLER_BASE_RAISED_USD).toBe(102_500);
    expect(result.props.campaign.raisedAmountUsd).toBe(sampleCampaign.raisedAmountUsd + MANGO_SELLER_BASE_RAISED_USD);
    expect(result.props.campaign.donorCount).toBe(sampleCampaign.donorCount + MANGO_SELLER_SEED_DONATIONS.length);
    expect(result.props.campaign.recentDonations).toEqual([...sampleCampaign.recentDonations, ...MANGO_SELLER_SEED_DONATIONS]);
    expect(result.props.campaign.donationOptions).toEqual([
      { amountUsd: 2500, frequency: "one_time", featured: false, impactText: "" },
      { amountUsd: 5000, frequency: "one_time", featured: true, impactText: "" },
      { amountUsd: 7500, frequency: "one_time", featured: false, impactText: "" },
    ]);
    expect(mocks.supporters).not.toHaveBeenCalled();
  });

  it("starts mango-seller monthly and one-time presets at $25 without changing the source options", async () => {
    const monthlyOptions = [2500, 5000, 10000].map(amountUsd => ({
      amountUsd, frequency: "monthly" as const, featured: amountUsd === 5000, impactText: "Monthly support",
    }));
    const campaign = { ...sampleCampaign, donationOptions: [...sampleCampaign.donationOptions, ...monthlyOptions] };
    mocks.campaign.mockResolvedValue(campaign);
    const result = await MangoSellerPage();
    const donationOptions: Campaign["donationOptions"] = result.props.campaign.donationOptions;
    expect(donationOptions.filter(option => option.frequency === "monthly").map(option => option.amountUsd)).toEqual([2500, 5000, 10000]);
    expect(donationOptions.filter(option => option.frequency === "one_time").map(option => option.amountUsd)).toEqual([2500, 5000, 7500]);
    expect(campaign.donationOptions).toEqual([...sampleCampaign.donationOptions, ...monthlyOptions]);
  });

  it("gives the new page its own headline, description and canonical URL in link previews", async () => {
    const metadata = await generateMangoMetadata();
    expect(String(metadata.alternates?.canonical)).toContain("/help-mango-seller");
    expect(metadata.description).toContain("$2,500 in monthly support");
    expect(metadata.openGraph).toMatchObject({ title: metadata.title, description: metadata.description });
  });

  it("does not fall back to the old accounting when the new campaign is absent", async () => {
    mocks.campaign.mockResolvedValue(null);
    await expect(MangoSellerPage()).rejects.toThrow("not-found");
    expect(mocks.beneficiary).toHaveBeenCalledWith("help-mango-seller");
  });

  it("serves the supplied portrait and approved copy without requiring CMS write access", async () => {
    mocks.campaign.mockResolvedValue({ ...sampleCampaign, slug: "help-mango-seller" });
    mocks.beneficiary.mockResolvedValue({ _id: "help-mango-seller-page-content", slug: "help-mango-seller", title: "" });
    const result = await MangoSellerPage();
    expect(result.props.content.heroImage?.asset?.url).toBe("/mango-seller.jpg");
    expect(result.props.content.story?.[0].children[0].text).toMatch(/^Despite living with a disability/);
    expect(result.props.content.story?.[0].children[0].text).not.toContain("Akram");
    expect(mocks.beneficiary).toHaveBeenCalledWith("help-mango-seller");
    const metadata = await generateMangoMetadata();
    expect(metadata.openGraph).toMatchObject({ images: [{ url: "https://donate.mealsupport.org/mango-seller.jpg" }] });
  });

  it("updates only the direct page headline and summary while retaining story, funds, campaign totals and donation options", async () => {
    const result = await AkramShakeDirectPage();
    expect(result.props.content.title).toBe("❤️ Help More People Like Akram Build a Better Future");
    expect(result.props.content.summary).toMatch(/^Akram's story is just one of many\./);
    expect(result.props.content.storyHeading).toBe(original.storyHeading);
    expect(result.props.content.story).toEqual(original.story);
    expect(result.props.content.fundUsageTitle).toBe(original.fundUsageTitle);
    expect(result.props.content.fundUsageItems).toMatchObject(original.fundUsageItems ?? []);
    expect(result.props.campaign).toEqual({ ...sampleCampaign, slug: "akram-shake", id: "campaign-akram-shake" });
    expect(mocks.supporters).not.toHaveBeenCalled();
  });

  it("provides the new direct page headline and description to link crawlers without querying supporter data", async () => {
    const metadata = await generateDirectMetadata();
    expect(metadata.title).toBe("❤️ Help More People Like Akram Build a Better Future");
    expect(metadata.description).toMatch(/^Akram's story is just one of many\./);
    expect(metadata.openGraph).toMatchObject({ title: metadata.title, description: metadata.description });
    expect(metadata.twitter).toMatchObject({ title: metadata.title, description: metadata.description });
    expect(mocks.supporters).not.toHaveBeenCalled();
  });

  it("returns not-found metadata for an unavailable direct campaign document", async () => {
    mocks.content.mockResolvedValue(null);
    await expect(generateDirectMetadata()).rejects.toThrow("not-found");
  });

  it.each([
    ["/gaza-food", GazaFoodPage, "give-a-child-a-brighter-tomorrow"],
    ["/gaza-food/donate", GazaFoodDonatePage, "give-a-child-a-brighter-tomorrow"],
    ["/akram-shake-3", AkramShakeMonthlyPage, "akram-shake"],
  ] as const)("renders new copy on %s while retaining the original campaign accounting", async (_path, page, slug) => {
    const result = await page();
    expect(isValidElement<{ content: SanityCampaign; campaign: Campaign }>(result)).toBe(true);
    expect(result.props.content.title).toBe(_path === "/akram-shake-3"
      ? "❤️ Help More People Like Akram Build a Better Future"
      : "🇵🇸 ❤️ Bring Hope and Relief to Palestine");
    expect(result.props.campaign.id).toBe(`campaign-${slug}`);
    if (_path === "/akram-shake-3") {
      expect(mocks.supporters).toHaveBeenCalledWith(`campaign-${slug}`);
      expect(result.props.campaign.supporterProgress).toEqual({ count: 12, goal: 100 });
      expect(result.props.campaign.recentDonations).toHaveLength(12);
      expect(result.props.campaign.recentDonations.every((donation: { frequency: string }) => donation.frequency === "monthly")).toBe(true);
    } else {
      expect(mocks.supporters).not.toHaveBeenCalled();
      expect(result.props.campaign.supporterProgress).toBeUndefined();
    }
    expect(mocks.campaign).toHaveBeenCalledWith(slug);
    expect(mocks.content).toHaveBeenCalledWith(expect.any(String), { slug }, { cache: "no-store" });
  });

  it("leaves the previous Akram entry page's content unchanged", async () => {
    await AkramShakeMonthlyPage();
    const result = await AkramShakeUpsellPage();
    expect(result.props.content.title).toBe("Existing campaign headline");
    expect(original.titleI18n?.en).toBe("Existing campaign headline");
  });

  it("shows $25 instead of $20 in both Akram upsell preset frequencies without duplicate buttons", async () => {
    const options: Campaign["donationOptions"] = [
      { amountUsd: 2000, frequency: "monthly", impactText: "Monthly" },
      { amountUsd: 2500, frequency: "monthly", impactText: "Existing $25" },
      { amountUsd: 2000, frequency: "one_time", impactText: "Single" },
      { amountUsd: 5000, frequency: "monthly", featured: true, impactText: "Recommended" },
    ];
    mocks.campaign.mockResolvedValue({ ...sampleCampaign, donationOptions: options });
    const result = await AkramShakeUpsellPage();
    expect(result.props.campaign.donationOptions.map((option: Campaign["donationOptions"][number]) => [option.frequency, option.amountUsd]))
      .toEqual([["monthly", 2500], ["one_time", 2500], ["monthly", 5000]]);
    expect(options[0].amountUsd).toBe(2000);
  });

  it("returns not-found when the underlying campaign does not exist", async () => {
    mocks.campaign.mockResolvedValue(null);
    await expect(AkramShakeMonthlyPage()).rejects.toThrow("not-found");
    expect(mocks.content).not.toHaveBeenCalled();
    expect(mocks.supporters).not.toHaveBeenCalled();
  });

  it("keeps the page available without inventing a count if the supporter query fails", async () => {
    mocks.supporters.mockResolvedValue(null);
    const result = await AkramShakeMonthlyPage();
    expect(result.props.campaign.supporterProgress).toEqual({ count: null, goal: 100 });
    expect(result.props.campaign.recentDonations).toEqual([]);
  });

  it("uses zero and an empty list together when no monthly supporter has paid", async () => {
    mocks.supporters.mockResolvedValue([]);
    const result = await AkramShakeMonthlyPage();
    expect(result.props.campaign.supporterProgress).toEqual({ count: 0, goal: 100 });
    expect(result.props.campaign.recentDonations).toEqual([]);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement } from "react";
import { sampleCampaign, type Campaign } from "@/lib/sample-data";
import type { SanityCampaign } from "@/sanity/types/campaign";

const mocks = vi.hoisted(() => ({ campaign: vi.fn(), content: vi.fn(), supporters: vi.fn() }));
vi.mock("@/components/campaign/campaign-page", () => ({ CampaignPage: () => null }));
vi.mock("@/components/donation/donate-page", () => ({ DonatePage: () => null }));
vi.mock("@/lib/queries/campaigns", () => ({ getCampaignBySlug: mocks.campaign }));
vi.mock("@/lib/queries/monthly-supporters", () => ({ getMonthlySupporterCount: mocks.supporters }));
vi.mock("@/sanity/lib/client", () => ({ sanityClient: { fetch: mocks.content } }));
vi.mock("@/lib/i18n-server", () => ({ getLocale: () => Promise.resolve("en") }));
vi.mock("@/lib/currency-server", () => ({ getCurrencyContext: () => Promise.resolve({ currency: "USD", exchangeRate: 1 }) }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not-found"); } }));

import GazaFoodPage from "@/app/gaza-food/page";
import GazaFoodDonatePage from "@/app/gaza-food/donate/page";
import AkramShakeMonthlyPage from "@/app/akram-shake-3/page";
import AkramShakeUpsellPage from "@/app/akram-shake-2/page";
import AkramShakeDirectPage, { generateMetadata as generateDirectMetadata } from "@/app/akram-shake-1/page";

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
  mocks.supporters.mockResolvedValue(12);
});

describe("monthly campaign entry routes", () => {
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
  });
});

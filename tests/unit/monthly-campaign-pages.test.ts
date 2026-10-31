import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement } from "react";
import { sampleCampaign, type Campaign } from "@/lib/sample-data";
import type { SanityCampaign } from "@/sanity/types/campaign";

const mocks = vi.hoisted(() => ({ campaign: vi.fn(), content: vi.fn() }));
vi.mock("@/components/campaign/campaign-page", () => ({ CampaignPage: () => null }));
vi.mock("@/components/donation/donate-page", () => ({ DonatePage: () => null }));
vi.mock("@/lib/queries/campaigns", () => ({ getCampaignBySlug: mocks.campaign }));
vi.mock("@/sanity/lib/client", () => ({ sanityClient: { fetch: mocks.content } }));
vi.mock("@/lib/i18n-server", () => ({ getLocale: () => Promise.resolve("en") }));
vi.mock("@/lib/currency-server", () => ({ getCurrencyContext: () => Promise.resolve({ currency: "USD", exchangeRate: 1 }) }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not-found"); } }));

import GazaFoodPage from "@/app/gaza-food/page";
import GazaFoodDonatePage from "@/app/gaza-food/donate/page";
import AkramShakeMonthlyPage from "@/app/akram-shake-3/page";
import AkramShakeUpsellPage from "@/app/akram-shake-2/page";

const original: SanityCampaign = { _id: "shared", slug: "shared", title: "Existing campaign headline", titleI18n: { en: "Existing campaign headline" } };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.campaign.mockImplementation(async (slug: string) => ({ ...sampleCampaign, slug, id: `campaign-${slug}` }));
  mocks.content.mockResolvedValue(original);
});

describe("monthly campaign entry routes", () => {
  it.each([
    ["/gaza-food", GazaFoodPage, "give-a-child-a-brighter-tomorrow"],
    ["/gaza-food/donate", GazaFoodDonatePage, "give-a-child-a-brighter-tomorrow"],
    ["/akram-shake-3", AkramShakeMonthlyPage, "akram-shake"],
  ] as const)("renders new copy on %s while retaining the original campaign accounting", async (_path, page, slug) => {
    const result = await page();
    expect(isValidElement<{ content: SanityCampaign; campaign: Campaign }>(result)).toBe(true);
    expect(result.props.content.title).toBe("🇵🇸 ❤️ Bring Hope and Relief to Palestine");
    expect(result.props.campaign.id).toBe(`campaign-${slug}`);
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
  });
});

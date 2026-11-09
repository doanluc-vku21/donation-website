import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleCampaign } from "@/lib/sample-data";
import type { SanityCampaign } from "@/sanity/types/campaign";

const mocks = vi.hoisted(() => ({ campaign: vi.fn(), content: vi.fn(), locale: vi.fn(), currency: vi.fn() }));
vi.mock("@/components/campaign/campaign-page", () => ({ CampaignPage: () => null }));
vi.mock("@/lib/queries/campaigns", () => ({ getCampaignBySlug: mocks.campaign }));
vi.mock("@/lib/queries/beneficiary-content", () => ({ getBeneficiaryContent: mocks.content }));
vi.mock("@/lib/i18n-server", () => ({ getLocale: mocks.locale }));
vi.mock("@/lib/currency-server", () => ({ getCurrencyContext: mocks.currency }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not-found"); } }));
import StreetVendorPage from "@/app/help-street-vendor/page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.campaign.mockResolvedValue({ ...sampleCampaign, id: "street-vendor-id", slug: "help-street-vendor", raisedAmountUsd: 0, donorCount: 0, recentDonations: [] });
  mocks.content.mockResolvedValue({ _id: "own-content", slug: "help-street-vendor", title: "" } satisfies SanityCampaign);
  mocks.locale.mockResolvedValue("en");
  mocks.currency.mockResolvedValue({ currency: "USD", exchangeRate: 1 });
});

describe("street vendor entry page", () => {
  it("uses independent accounting, database presets and the supplied photo without seed donations", async () => {
    const result = await StreetVendorPage();
    expect(mocks.campaign).toHaveBeenCalledExactlyOnceWith("help-street-vendor");
    expect(mocks.content).toHaveBeenCalledExactlyOnceWith("help-street-vendor");
    expect(result.props.campaign).toMatchObject({ id: "street-vendor-id", slug: "help-street-vendor", raisedAmountUsd: 0, donorCount: 0, recentDonations: [], donationOptions: sampleCampaign.donationOptions });
    expect(result.props.content.heroImage?.asset?.url).toBe("/street-vendor.jpg");
    expect(result.props).toMatchObject({ expandStory: true, showSummary: false, showOneTimeLabels: true, mobileHeroObjectPosition: "center 15%" });
  });

  it("starts CMS, locale and currency loading while accounting is still pending", async () => {
    let resolveCampaign!: (value: typeof sampleCampaign) => void;
    mocks.campaign.mockReturnValue(new Promise<typeof sampleCampaign>(resolve => { resolveCampaign = resolve; }));
    const pending = StreetVendorPage();
    expect(mocks.content).toHaveBeenCalledWith("help-street-vendor");
    expect(mocks.locale).toHaveBeenCalled();
    expect(mocks.currency).toHaveBeenCalled();
    resolveCampaign({ ...sampleCampaign, id: "street-vendor-id", slug: "help-street-vendor" });
    expect((await pending).props.campaign.id).toBe("street-vendor-id");
  });

  it("does not borrow another campaign's accounting when provisioning is incomplete", async () => {
    mocks.campaign.mockResolvedValue(null);
    await expect(StreetVendorPage()).rejects.toThrow("not-found");
    expect(mocks.campaign).toHaveBeenCalledExactlyOnceWith("help-street-vendor");
  });
});

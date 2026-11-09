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
import {
  STREET_VENDOR_BASE_RAISED_USD,
  STREET_VENDOR_HISTORICAL_DONOR_COUNT,
  STREET_VENDOR_SEED_DONATIONS,
  withStreetVendorDonationOptions,
} from "@/lib/street-vendor-campaign";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.campaign.mockResolvedValue({ ...sampleCampaign, id: "street-vendor-id", slug: "help-street-vendor", raisedAmountUsd: 0, donorCount: 0, recentDonations: [] });
  mocks.content.mockResolvedValue({ _id: "own-content", slug: "help-street-vendor", title: "" } satisfies SanityCampaign);
  mocks.locale.mockResolvedValue("en");
  mocks.currency.mockResolvedValue({ currency: "USD", exchangeRate: 1 });
});

describe("street vendor entry page", () => {
  it("uses independent accounting, seed donations totaling $775, $20 starting presets, live donor count, and relative timestamps", async () => {
    const result = await StreetVendorPage();
    expect(mocks.campaign).toHaveBeenCalledExactlyOnceWith("help-street-vendor");
    expect(mocks.content).toHaveBeenCalledExactlyOnceWith("help-street-vendor");
    expect(STREET_VENDOR_BASE_RAISED_USD).toBe(77_500);
    expect(STREET_VENDOR_HISTORICAL_DONOR_COUNT + STREET_VENDOR_SEED_DONATIONS.length).toBe(742);
    expect(result.props.campaign).toMatchObject({
      id: "street-vendor-id",
      slug: "help-street-vendor",
      raisedAmountUsd: STREET_VENDOR_BASE_RAISED_USD,
      donorCount: 742,
      recentDonations: STREET_VENDOR_SEED_DONATIONS,
      donationOptions: withStreetVendorDonationOptions(sampleCampaign.donationOptions),
    });
    expect(result.props.donorSummary.props).toMatchObject({ donorCount: 742, locale: "en" });
    expect(result.props.content.heroImage?.asset?.url).toBe("/street-vendor.jpg");
    expect(result.props).toMatchObject({
      expandStory: true,
      showSummary: false,
      showDonationTimes: true,
      showOneTimeLabels: true,
      mobileHeroObjectPosition: "center 15%",
    });
  });

  it("increments the exact donor count by +1 for each new recorded donation", async () => {
    mocks.campaign.mockResolvedValue({
      ...sampleCampaign,
      id: "street-vendor-id",
      slug: "help-street-vendor",
      raisedAmountUsd: 5000,
      donorCount: 3,
      recentDonations: [],
    });
    const result = await StreetVendorPage();
    expect(result.props.campaign.donorCount).toBe(745);
    expect(result.props.donorSummary.props.donorCount).toBe(745);
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

import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleCampaign } from "@/lib/sample-data";
import type { SanityCampaign } from "@/sanity/types/campaign";

const mocks = vi.hoisted(() => ({ campaign: vi.fn(), count: vi.fn(), content: vi.fn(), locale: vi.fn(), currency: vi.fn() }));
vi.mock("@/components/campaign/campaign-page", () => ({ CampaignPage: () => null }));
vi.mock("@/lib/queries/campaigns", () => ({ getCampaignBySlug: mocks.campaign }));
vi.mock("@/lib/queries/campaign-contributions", () => ({ getCampaignContributionCount: mocks.count }));
vi.mock("@/lib/queries/beneficiary-content", () => ({ getBeneficiaryContent: mocks.content }));
vi.mock("@/lib/i18n-server", () => ({ getLocale: mocks.locale }));
vi.mock("@/lib/currency-server", () => ({ getCurrencyContext: mocks.currency }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not-found"); } }));
import StreetVendorPage from "@/app/help-street-vendor/page";
import {
  STREET_VENDOR_BASE_RAISED_USD,
  STREET_VENDOR_SEED_DONATIONS,
  withStreetVendorDonationOptions,
} from "@/lib/street-vendor-campaign";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.campaign.mockResolvedValue({ ...sampleCampaign, id: "street-vendor-id", slug: "help-street-vendor", raisedAmountUsd: 0, donorCount: 0, recentDonations: [] });
  mocks.count.mockResolvedValue(0);
  mocks.content.mockResolvedValue({ _id: "own-content", slug: "help-street-vendor", title: "" } satisfies SanityCampaign);
  mocks.locale.mockResolvedValue("en");
  mocks.currency.mockResolvedValue({ currency: "USD", exchangeRate: 1 });
});

describe("street vendor entry page", () => {
  it("retains the approved 18 contributions and $775 base without restoring the 724 offset", async () => {
    const result = await StreetVendorPage();
    expect(mocks.campaign).toHaveBeenCalledExactlyOnceWith("help-street-vendor");
    expect(mocks.content).toHaveBeenCalledExactlyOnceWith("help-street-vendor");
    expect(result.props.campaign).toMatchObject({
      id: "street-vendor-id",
      slug: "help-street-vendor",
      raisedAmountUsd: 77500,
      donorCount: 0,
      recentDonations: STREET_VENDOR_SEED_DONATIONS,
      donationOptions: withStreetVendorDonationOptions(sampleCampaign.donationOptions),
    });
    expect(mocks.count).toHaveBeenCalledExactlyOnceWith("street-vendor-id");
    expect(STREET_VENDOR_SEED_DONATIONS).toHaveLength(18);
    expect(STREET_VENDOR_BASE_RAISED_USD).toBe(77500);
    expect(result.props.donorSummary.props).toMatchObject({ contributionCount: 18, locale: "en" });
    expect(result.props.contributionCount).toBe(18);
    expect(result.props.liveContributionCount).toBe(0);
    expect(result.props.autoRefresh).toBe(true);
    expect(result.props.content.heroImage?.asset?.url).toBe("/street-vendor.jpg");
    expect(result.props).toMatchObject({
      expandStory: true,
      showSummary: false,
      showDonationTimes: true,
      showOneTimeLabels: true,
      mobileHeroObjectPosition: "center 15%",
    });
  });

  it.each([1, 2, 150])("adds %s successful payments to the approved base without unique-donor deduplication or recent-list limits", async paidCount => {
    mocks.campaign.mockResolvedValue({
      ...sampleCampaign,
      id: "street-vendor-id",
      slug: "help-street-vendor",
      raisedAmountUsd: 5000,
      donorCount: 1,
      recentDonations: [],
    });
    mocks.count.mockResolvedValue(paidCount);
    const result = await StreetVendorPage();
    expect(result.props.campaign.donorCount).toBe(1);
    expect(result.props.contributionCount).toBe(18 + paidCount);
    expect(result.props.liveContributionCount).toBe(paidCount);
    expect(result.props.donorSummary.props.contributionCount).toBe(18 + paidCount);
    expect(result.props.campaign.recentDonations).toHaveLength(18);
    expect(result.props.campaign.raisedAmountUsd).toBe(82500);
  });

  it("does not replace unavailable payment accounting with a fabricated starting count", async () => {
    mocks.count.mockRejectedValue(new Error("Unable to load campaign contribution count."));
    await expect(StreetVendorPage()).rejects.toThrow("Unable to load campaign contribution count.");
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
    expect(mocks.count).not.toHaveBeenCalled();
  });
});

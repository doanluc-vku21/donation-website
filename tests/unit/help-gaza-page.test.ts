// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCampaignMetadata } from "@/lib/campaign-metadata";
import {
  HELP_GAZA_CAMPAIGN_SLUG,
  HELP_GAZA_ONE_TIME_DONATION_OPTIONS,
  HELP_GAZA_PATH,
  localizeHelpGazaCampaign,
} from "@/lib/help-gaza-campaign";
import { locales } from "@/lib/i18n";
import { sampleCampaign } from "@/lib/sample-data";
import type { SanityCampaign } from "@/sanity/types/campaign";

const mocks = vi.hoisted(() => ({
  campaign: vi.fn(),
  fetch: vi.fn(),
  locale: vi.fn(),
  currency: vi.fn(),
}));

vi.mock("@/components/campaign/campaign-page", () => ({ CampaignPage: () => null }));
vi.mock("@/lib/queries/campaigns", () => ({ getCampaignBySlug: mocks.campaign }));
vi.mock("@/sanity/lib/client", () => ({ sanityClient: { fetch: mocks.fetch } }));
vi.mock("@/lib/i18n-server", () => ({ getLocale: mocks.locale }));
vi.mock("@/lib/currency-server", () => ({ getCurrencyContext: mocks.currency }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not-found"); } }));

import HelpGazaPage from "@/app/help-gaza/page";

const original: SanityCampaign = {
  _id: "gaza-content",
  slug: HELP_GAZA_CAMPAIGN_SLUG,
  title: "Old Title",
  heroImage: { asset: { _id: "old-image", url: "https://cdn.sanity.io/old.jpg" } },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.campaign.mockResolvedValue({
    ...sampleCampaign,
    id: "gaza-campaign-id",
    slug: HELP_GAZA_CAMPAIGN_SLUG,
  });
  mocks.fetch.mockResolvedValue(original);
  mocks.locale.mockResolvedValue("en");
  mocks.currency.mockResolvedValue({ currency: "USD", exchangeRate: 1 });
});

describe("/help-gaza landing page and content", () => {
  it.each(locales)("provides complete localized copy and the new hero image in %s", locale => {
    const content = localizeHelpGazaCampaign(original, locale);
    expect(content._id).toBe(original._id);
    expect(content.slug).toBe(HELP_GAZA_CAMPAIGN_SLUG);
    expect(content.title).not.toBe("Old Title");
    expect(content.story).toHaveLength(6);
    expect(content.heroImage?.asset).toMatchObject({
      url: "/help-gaza.jpg",
      metadata: { dimensions: { width: 1024, height: 576 } },
    });
    expect(content.seoTitle).toBe(content.title);
  });

  it("renders the exact ChatGPT copy in English with strong emphasis and hides the mobile hero overlay headline", async () => {
    const content = localizeHelpGazaCampaign(original, "en");
    expect(content.title).toBe("❤️ Help Feed Families in Gaza, Palestine 🇵🇸");
    expect(content.storyHeading).toBe("❤️ Help Feed Families in Gaza, Palestine 🇵🇸");
    expect(content.story?.map(block => block.children.map(span => span.text).join(""))).toEqual([
      "Your kindness can bring food, hope, and comfort to families in need.",
      "Every day, families in Gaza face the challenge of finding enough food for their loved ones. Your generous donation can help provide warm meals, essential nourishment, and much-needed relief.",
      "❤️ Every meal matters. Your support can bring comfort to children, parents, and families facing difficult times.",
      "🍽️ A meal is more than food. It is a symbol of compassion, dignity, and hope for a brighter tomorrow.",
      "🤲 Be the reason someone eats today. Whether you give once or monthly, your generosity can make a meaningful difference.",
      "Donate today and help bring hope to families in Gaza. ❤️🇵🇸",
    ]);

    const result = await HelpGazaPage();
    expect(mocks.campaign).toHaveBeenCalledExactlyOnceWith(HELP_GAZA_CAMPAIGN_SLUG);
    expect(result.props).toMatchObject({
      showMobileHeroHeadline: false,
      showDesktopHeadline: false,
      showProgress: false,
      showStory: true,
      showFundUsage: false,
      showSummary: false,
      expandStory: true,
      showOneTimeLabels: true,
      showOrganizationCharityStatus: true,
      showOrganizationVerification: true,
    });
    expect(result.props.campaign.donationOptions).toEqual(
      expect.arrayContaining(HELP_GAZA_ONE_TIME_DONATION_OPTIONS),
    );
  });

  it("uses /help-gaza and /help-gaza.jpg in metadata", () => {
    const content = localizeHelpGazaCampaign(original, "en");
    const metadata = getCampaignMetadata(content, HELP_GAZA_PATH);
    expect(String(metadata.alternates?.canonical)).toContain("/help-gaza");
    expect(metadata.openGraph).toMatchObject({
      title: content.title,
      images: [{ url: expect.stringContaining("/help-gaza.jpg") }],
    });
  });
});

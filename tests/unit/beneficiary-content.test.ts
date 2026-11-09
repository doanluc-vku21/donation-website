// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SanityCampaign } from "@/sanity/types/campaign";

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/sanity/lib/client", () => ({ sanityClient: { fetch: mocks.fetch } }));
import { BENEFICIARY_CONTENT_QUERY, getBeneficiaryContent } from "@/lib/queries/beneficiary-content";

beforeEach(() => { vi.clearAllMocks(); });

describe("beneficiary CMS content", () => {
  it("loads independent content and optional shared branding in one request", async () => {
    const campaign: SanityCampaign = { _id: "own-content", slug: "help-street-vendor", title: "Own content" };
    mocks.fetch.mockResolvedValue({ campaign, branding: { footerOrganizationName: "MEAL SUPPORT INC" } });
    expect(await getBeneficiaryContent("help-street-vendor")).toBe(campaign);
    expect(mocks.fetch).toHaveBeenCalledExactlyOnceWith(BENEFICIARY_CONTENT_QUERY,
      { slug: "help-street-vendor", brandingSlug: "akram-shake" }, { cache: "no-store" });
  });

  it("uses branding without a second request or another beneficiary's identity", async () => {
    mocks.fetch.mockResolvedValue({ campaign: null, branding: { footerOrganizationName: "MEAL SUPPORT INC" } });
    expect(await getBeneficiaryContent("help-street-vendor")).toEqual({
      _id: "help-street-vendor-page-content", slug: "help-street-vendor", title: "", footerOrganizationName: "MEAL SUPPORT INC",
    });
    expect(mocks.fetch).toHaveBeenCalledOnce();
    const brandingQuery = BENEFICIARY_CONTENT_QUERY.split('"branding":')[1];
    expect(brandingQuery).toContain("$brandingSlug");
    expect(brandingQuery).not.toMatch(/\b(?:heroImage|goalAmount|fundUsageItems|storyHeading|titleI18n)\b/);
  });

  it("propagates CMS failures instead of treating them as an empty campaign", async () => {
    mocks.fetch.mockRejectedValue(new Error("CMS unavailable"));
    await expect(getBeneficiaryContent("help-street-vendor")).rejects.toThrow("CMS unavailable");
  });
});

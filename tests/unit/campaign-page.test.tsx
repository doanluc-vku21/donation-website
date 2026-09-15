import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CampaignPage } from "@/components/campaign/campaign-page";
import { sampleCampaign } from "@/lib/sample-data";
import type { SanityCampaign } from "@/sanity/types/campaign";

const sanityContent: SanityCampaign = {
  _id: "campaign-content",
  title: sampleCampaign.title,
  slug: "give-a-child-a-brighter-tomorrow",
};

describe("CampaignPage", () => {
  it("presents the campaign story, donation form, and supporters", () => {
    render(<CampaignPage campaign={sampleCampaign} content={sanityContent} />);

    expect(screen.getByRole("heading", { level: 1, name: sampleCampaign.title })).toBeVisible();
    expect(screen.getByRole("region", { name: "Campaign progress" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Choose your gift" })).toBeVisible();
    expect(
      screen.getAllByRole("heading", {
        name: "Recent supporters",
      }),
    ).toHaveLength(2);
    expect(
      screen.getAllByText("Maya R."),
    ).toHaveLength(2);

  });

  it("uses original sample campaign media", () => {
    render(<CampaignPage campaign={sampleCampaign} content={sanityContent} />);

    expect(screen.getByRole("img", { name: sampleCampaign.title })).toHaveAttribute(
      "src",
      expect.stringContaining("sample-campaign-hero.svg"),
    );
  });
});

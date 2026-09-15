import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CampaignPage } from "@/components/campaign/campaign-page";
import { sampleCampaign } from "@/lib/sample-data";

describe("CampaignPage", () => {
  it("presents the campaign story, donation form, supporters and trust details", () => {
    render(<CampaignPage campaign={sampleCampaign} />);

    expect(screen.getByRole("heading", { level: 1, name: sampleCampaign.title })).toBeVisible();
    expect(screen.getByRole("region", { name: "Campaign progress" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Choose your gift" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Recent supporters" })).toBeVisible();
    expect(screen.getByText("Maya R.")).toBeVisible();
    expect(screen.getByText(/payments will be processed by stripe/i)).toBeVisible();
  });

  it("uses original sample campaign media", () => {
    render(<CampaignPage campaign={sampleCampaign} />);

    expect(screen.getByRole("img", { name: /children learning together/i })).toHaveAttribute(
      "src",
      expect.stringContaining("sample-campaign-hero.svg"),
    );
  });
});

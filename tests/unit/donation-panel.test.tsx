import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DonationPanel } from "@/components/donation/donation-panel";
import { sampleCampaign } from "@/lib/sample-data";

describe("DonationPanel", () => {
  it("starts with the recommended one-time gift selected", () => {
    render(<DonationPanel campaign={sampleCampaign} />);

    expect(screen.getByRole("radio", { name: /give once/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /\$50/i })).toBeChecked();
    expect(screen.getByRole("button", { name: "Continue with $50.00" })).toBeEnabled();
  });

  it("updates the total when the donor covers the estimated fee", async () => {
    const user = userEvent.setup();
    render(<DonationPanel campaign={sampleCampaign} />);

    await user.click(screen.getByRole("checkbox", { name: /cover transaction costs/i }));

    expect(screen.getByText("$1.75", { selector: "dd" })).toBeVisible();
    expect(screen.getByText("$51.75", { selector: "dd" })).toBeVisible();
  });

  it("moves from amount selection to donor information", async () => {
    const user = userEvent.setup();
    render(<DonationPanel campaign={sampleCampaign} />);

    await user.click(screen.getByRole("button", { name: "Continue with $50.00" }));

    expect(screen.getByRole("heading", { name: "Your information" })).toBeVisible();
    expect(screen.getByLabelText("Email address")).toBeVisible();
    expect(screen.getByRole("checkbox", { name: /display my name publicly/i })).not.toBeChecked();
  });
});

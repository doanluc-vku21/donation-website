import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ShareMenu } from "@/components/share/share-menu";

describe("ShareMenu", () => {
  it("opens accessible sharing choices", async () => {
    const user = userEvent.setup();
    render(<ShareMenu />);

    await user.click(screen.getByRole("button", { name: "Share" }));

    expect(screen.getByRole("dialog", { name: "Share this campaign" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Facebook" })).toBeVisible();
    expect(screen.getByRole("link", { name: "WhatsApp" })).toBeVisible();
    expect(screen.getByText("Scan to open this campaign")).toBeVisible();
  });
});

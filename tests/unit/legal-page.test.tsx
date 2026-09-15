import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalPage } from "@/components/legal/legal-page";

describe("LegalPage", () => {
  it("clearly labels sample legal content", () => {
    render(<LegalPage title="Privacy Policy"><p>Sample privacy text.</p></LegalPage>);
    expect(screen.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
    expect(screen.getByText(/replace and obtain client\/legal approval/i)).toBeVisible();
  });
});

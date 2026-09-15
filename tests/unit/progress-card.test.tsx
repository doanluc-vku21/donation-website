import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressCard } from "@/components/campaign/progress-card";

describe("ProgressCard", () => {
  it("renders campaign totals and accessible progress", () => {
    render(<ProgressCard raisedAmountUsd={37_425_00} goalAmountUsd={100_000_00} donorCount={638} />);

    expect(screen.getByText("$37,425.00")).toBeVisible();
    expect(screen.getByText(/of \$100,000 goal/i)).toBeVisible();
    expect(screen.getByText("638 supporters")).toBeVisible();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "37");
  });
});

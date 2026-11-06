import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecentDonations } from "@/components/campaign/recent-donations";
import { locales } from "@/lib/i18n";
import { sampleCampaign, type RecentDonation } from "@/lib/sample-data";
import { getUiTranslations } from "@/lib/ui-translations";

const supporters: RecentDonation[] = Array.from({ length: 20 }, (_, index) => ({
  id: String(index), displayName: `Supporter ${index}`, amountUsd: 1000 + index * 100,
  frequency: "monthly", relativeTime: "1 hour ago",
}));
const props = { donations: supporters, locale: "en" as const, currency: "USD" as const, exchangeRate: 1 };

describe("community supporter list", () => {
  it.each(locales)("labels actual one-time and monthly gifts in the preview and dialog in %s when enabled", locale => {
    const t = getUiTranslations(locale);
    render(<RecentDonations {...props} locale={locale} donations={sampleCampaign.recentDonations} previewLimit={1} showOneTimeLabels />);
    const previewRow = screen.getByRole("listitem");
    expect(within(previewRow).getByText(t.oneTime)).toBeVisible();
    expect(within(previewRow).queryByText(t.monthly)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: t.seeAllContributions }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByText(t.oneTime)).toHaveLength(2);
    expect(within(dialog).getAllByText(t.monthly)).toHaveLength(1);
  });

  it("hides times in both the preview and all-contributions dialog when requested", () => {
    render(<RecentDonations {...props} showDonationTimes={false} />);
    expect(screen.queryByText("1 hour ago")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "See all contributions" }));
    expect(screen.queryByText("1 hour ago")).not.toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getAllByRole("listitem")).toHaveLength(20);
  });

  it("matches the progress count and shows all unique supporters in the modal", () => {
    render(<RecentDonations {...props} monthlySupporterCount={20} />);
    expect(screen.getByRole("heading", { name: "Monthly Supporters" })).toBeVisible();
    expect(screen.getByText("20 Monthly Supporters")).toBeVisible();
    expect(screen.queryByText(/Contributions/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "See all monthly supporters" }));
    const dialog = screen.getByRole("dialog", { name: "Monthly Supporters" });
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(20);
    fireEvent.change(within(dialog).getByRole("combobox"), { target: { value: "highest" } });
    expect(within(dialog).getAllByRole("listitem")[0]).toHaveTextContent("Supporter 19");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each(locales)("localizes the title, count, and dialog controls in %s", (locale) => {
    const t = getUiTranslations(locale);
    render(<RecentDonations {...props} locale={locale} monthlySupporterCount={20} />);
    expect(screen.getByRole("heading", { name: t.monthlySupporters })).toBeVisible();
    const badge = screen.getByText(`${(20).toLocaleString(locale === "ar" ? "ar" : locale)} ${t.monthlySupporters}`);
    expect(badge).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    fireEvent.click(screen.getByRole("button", { name: t.seeAllMonthlySupporters }));
    const dialog = screen.getByRole("dialog", { name: t.monthlySupporters });
    fireEvent.click(within(dialog).getByRole("button", { name: t.closeMonthlySupporters }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("uses the singular label for one supporter", () => {
    render(<RecentDonations {...props} donations={supporters.slice(0, 1)} monthlySupporterCount={1} />);
    expect(screen.getByText("1 Monthly Supporter")).toBeVisible();
  });

  it("shows zero for an empty successful query", () => {
    render(<RecentDonations {...props} donations={[]} monthlySupporterCount={0} />);
    expect(screen.getByText("0 Monthly Supporters")).toBeVisible();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows unavailable instead of zero or the old contribution total after a failed query", () => {
    render(<RecentDonations {...props} donations={[]} monthlySupporterCount={null} />);
    expect(screen.getByText("Supporter count is temporarily unavailable.")).toBeVisible();
    expect(screen.queryByText(/0 Monthly|20 Monthly/)).not.toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("retains contribution counts and both frequencies on other campaign pages", () => {
    render(<RecentDonations {...props} donations={sampleCampaign.recentDonations} />);
    expect(screen.getByRole("heading", { name: "Contributions" })).toBeVisible();
    expect(screen.getByText("3 Contributions")).toBeVisible();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByText("One time")).not.toBeInTheDocument();
  });
});

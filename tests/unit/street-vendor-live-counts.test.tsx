import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState, type ImgHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { locales, type Locale } from "@/lib/i18n";
import { sampleCampaign } from "@/lib/sample-data";
import { STREET_VENDOR_SEED_DONATIONS } from "@/lib/street-vendor-campaign";
import { getUiTranslations } from "@/lib/ui-translations";

vi.mock("next/image", () => ({
  default: ({ alt, priority, ...props }: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    void priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={alt} />;
  },
}));
const navigation = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("@/components/i18n/locale-currency-switcher", () => ({ LocaleCurrencySwitcher: () => null }));
vi.mock("@/components/donation/donation-modal", () => ({
  DonationModal: function DraftDonationForm() {
    const [name, setName] = useState("");
    return <input aria-label="Donation draft" value={name} onChange={event => setName(event.target.value)} />;
  },
}));

import { CampaignPage } from "@/components/campaign/campaign-page";
import { HistoricalDonorSummary } from "@/components/campaign/historical-donor-summary";

const content = { _id: "street-vendor", slug: "help-street-vendor", title: "Street vendor" };
const campaign = { ...sampleCampaign, slug: "help-street-vendor", donorCount: 0, recentDonations: STREET_VENDOR_SEED_DONATIONS };

function page(contributionCount: number, locale: Locale = "en") {
  return <CampaignPage campaign={campaign} content={content} contributionCount={contributionCount}
    liveContributionCount={contributionCount - 18}
    donorSummary={<HistoricalDonorSummary contributionCount={contributionCount} locale={locale} />}
    autoRefresh locale={locale} currency="USD" exchangeRate={1} />;
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("synchronized street-vendor contribution counts", () => {
  it.each(locales)("shows the same total in mobile/desktop summaries and contribution badges in %s", locale => {
    const { container } = render(page(18, locale));
    const label = `${new Intl.NumberFormat(locale).format(18)} ${getUiTranslations(locale).contributions}`;
    const summaries = container.querySelectorAll('[data-donation-history="contribution-count"]');
    expect(summaries).toHaveLength(2);
    for (const summary of summaries) {
      expect(summary).toHaveTextContent(label);
      expect(summary).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    }
    expect(screen.getAllByText(label)).toHaveLength(2);
    expect(container).not.toHaveTextContent("742");
  });

  it("merges 18→19→20 and duplicate snapshots into all counters without resetting an in-progress form", () => {
    const { container, rerender } = render(page(18));
    const draft = screen.getByRole("textbox", { name: "Donation draft" });
    fireEvent.change(draft, { target: { value: "Unsaved entry" } });
    for (const count of [19, 19, 20]) {
      rerender(page(count));
      const t = getUiTranslations("en");
      const label = `${count} ${count === 1 ? t.contribution : t.contributions}`;
      expect(screen.getAllByText(label)).toHaveLength(2);
      for (const summary of container.querySelectorAll('[data-donation-history="contribution-count"]')) {
        expect(summary).toHaveTextContent(label);
      }
      expect(screen.getByRole("textbox", { name: "Donation draft" })).toBe(draft);
      expect(draft).toHaveValue("Unsaved entry");
    }
  });

  it("keeps all counters equal above the recent-list limit", () => {
    const { container } = render(page(168));
    expect(screen.getAllByText("168 Contributions")).toHaveLength(2);
    for (const summary of container.querySelectorAll('[data-donation-history="contribution-count"]')) {
      expect(summary).toHaveTextContent("168 Contributions");
    }
    expect(screen.queryByText("18 Contributions")).not.toBeInTheDocument();
  });

  it("compares live events against confirmed payments, not the 18-entry display baseline", () => {
    navigation.refresh.mockClear();
    let send!: (count: number) => void;
    vi.stubGlobal("EventSource", class {
      onmessage: ((event: MessageEvent<string>) => void) | null = null;
      close() {}
      constructor() { send = count => this.onmessage?.(new MessageEvent("message", { data: JSON.stringify({ count }) })); }
    });
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    const { rerender } = render(page(18));
    fireEvent(window, new Event("online"));
    navigation.refresh.mockClear();
    act(() => { send(0); });
    expect(navigation.refresh).not.toHaveBeenCalled();
    act(() => { send(1); });
    expect(navigation.refresh).toHaveBeenCalledTimes(1);
    rerender(page(19));
    act(() => { send(1); });
    expect(navigation.refresh).toHaveBeenCalledTimes(1);
  });
});

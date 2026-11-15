import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { familyFeedingPresets } from "@/lib/donation-presets";
import { sampleCampaign } from "@/lib/sample-data";

const navigation = vi.hoisted(() => ({ pathname: "/help-gaza" }));

vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));
vi.mock("@/lib/stripe/client", () => ({ getStripePromise: () => Promise.resolve(null), prepareStripe: vi.fn() }));
vi.mock("@stripe/react-stripe-js/checkout", () => ({
  CheckoutElementsProvider: ({ children }: { children: React.ReactNode }) => children,
  useCheckoutElements: () => ({ type: "success", checkout: { confirm: vi.fn() } }),
  PaymentElement: () => <div data-testid="card-fields" />,
  ContactDetailsElement: () => <input aria-label="Stripe contact email" type="email" required />,
}));
vi.mock("@/components/donation/donation-express-checkout", () => ({
  DonationExpressCheckout: () => null,
}));

import { DonationFlow } from "@/components/donation/donation-flow";

const IMPACT_COPY = [
  "Feeds 5 families for 1 month",
  "Feeds 2 families for 1 month",
  "Feeds a family for 1 month",
  "Feeds a family for 2 weeks",
  "Feeds a family for 1 week",
  "Feeds a family for 3 days",
];

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mount() {
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));

  render(
    <DonationFlow
      campaign={{
        ...sampleCampaign,
        donationOptions: [
          ...familyFeedingPresets("monthly"),
          ...familyFeedingPresets("one_time"),
        ],
      }}
      locale="en"
      currency="USD"
      exchangeRate={1}
    />,
  );
}

describe("help-gaza preset grid", () => {
  it("shows the six gifts highest-first with their impact copy and one-time default", () => {
    mount();

    const group = screen.getByRole("group", { name: "Donation amount" });
    const radios = within(group).getAllByRole("radio");

    expect(radios).toHaveLength(6);
    expect(radios.map(radio => radio.getAttribute("aria-label"))).toEqual([
      "$1,000",
      "$500",
      "$250",
      "$100",
      "$50 Recommended",
      "$25",
    ]);
    for (const copy of IMPACT_COPY) {
      expect(screen.getByText(copy)).toBeVisible();
    }
    expect(screen.getByRole("radio", { name: "$50 Recommended" })).toBeChecked();
    expect(screen.getByPlaceholderText("Enter amount")).toHaveValue(50);
    expect(screen.getByText("Total")).toBeVisible();
  });

  it("keeps the same six boxes when the donor switches to monthly", () => {
    mount();

    fireEvent.click(screen.getByRole("radio", { name: "Monthly" }));

    const group = screen.getByRole("group", { name: "Donation amount" });
    expect(within(group).getAllByRole("radio")).toHaveLength(6);
    for (const copy of IMPACT_COPY) {
      expect(screen.getByText(copy)).toBeVisible();
    }
    expect(screen.getByText("Total per month")).toBeVisible();
  });
});

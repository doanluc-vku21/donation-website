import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.cookie = "site_currency=; Path=/; Max-Age=0";
});

function mount() {
  const fetchMock = vi.fn((url: string) => {
    if (url.startsWith("/api/currency/rate?currency=USD")) {
      return Promise.resolve(new Response(JSON.stringify({ currency: "USD", rate: 1 }), { status: 200 }));
    }

    // Nothing else should be needed on the amount step.
    return new Promise<Response>(() => {});
  });

  vi.stubGlobal("fetch", fetchMock);

  render(<DonationFlow campaign={sampleCampaign} locale="en" currency="BDT" exchangeRate={125} />);

  return fetchMock;
}

describe("in-modal currency handling", () => {
  it("keeps a below-minimum custom amount visible with its symbol", () => {
    mount();

    const input = screen.getByPlaceholderText("Enter amount");

    fireEvent.change(input, { target: { value: "2499" } });

    expect(input).toHaveValue(2499);
    // The typed amount must stay on screen even though it is under the minimum.
    expect(screen.getByText("Total per month")).toBeVisible();
    expect(screen.getByText("৳2,499")).toBeVisible();
    expect(screen.getByText("The minimum donation amount is ৳2,500.")).toBeVisible();
    // The button stays clickable so pressing it surfaces the minimum warning.
    expect(screen.getByRole("button", { name: "Pay ৳2,499 by Card" })).toBeEnabled();
  });

  it("fills the minimum amount from the warning", () => {
    mount();

    const input = screen.getByPlaceholderText("Enter amount");

    fireEvent.change(input, { target: { value: "2499" } });
    fireEvent.click(screen.getByRole("button", { name: "Use ৳2,500" }));

    expect(input).toHaveValue(2500);
    expect(screen.queryByText(/The minimum donation amount is/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pay ৳2,500 by Card" })).toBeEnabled();
  });

  it("shows symbols on the presets instead of the ISO code", () => {
    mount();

    expect(screen.getByRole("radio", { name: "৳3,125" })).toBeInTheDocument();
    expect(screen.queryByText(/BDT \d/)).not.toBeInTheDocument();
  });

  it("switches currency inside the modal and re-anchors the amount", async () => {
    const fetchMock = mount();

    fireEvent.click(screen.getByRole("radio", { name: "৳3,125" }));
    expect(screen.getByRole("button", { name: "Pay ৳3,125 by Card" })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Change currency: BDT" })[0]);

    const sheet = screen.getByRole("dialog", { name: "Choose currency" });
    expect(sheet).toBeVisible();

    await act(async () => {
      fireEvent.click(screen.getByRole("option", { name: /^USD/ }));
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/currency/rate?currency=USD");
    expect(screen.queryByRole("dialog", { name: "Choose currency" })).not.toBeInTheDocument();
    expect(document.cookie).toContain("site_currency=USD");
    // $25 keeps the same donation value as BDT 3,125.
    expect(screen.getByRole("button", { name: "Pay $25 by Card" })).toBeEnabled();
    expect(screen.getAllByRole("radio", { name: "$25" }).some(radio => (radio as HTMLInputElement).checked)).toBe(true);
  });

  it("keeps the current currency and reports a failed switch", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.startsWith("/api/currency/rate")) {
        return Promise.resolve(new Response(JSON.stringify({ error: "Unable to load exchange rate." }), { status: 502 }));
      }

      return new Promise<Response>(() => {});
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<DonationFlow campaign={sampleCampaign} locale="en" currency="BDT" exchangeRate={125} />);

    fireEvent.change(screen.getByPlaceholderText("Enter amount"), { target: { value: "3125" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Change currency: BDT" })[0]);

    await act(async () => {
      fireEvent.click(screen.getByRole("option", { name: /^USD/ }));
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to switch currency. Please try again.");
    expect(screen.getByRole("button", { name: "Pay ৳3,125 by Card" })).toBeEnabled();
  });
});

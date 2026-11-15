import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { currencies } from "@/lib/currency";
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

function mount(currency = "BDT", exchangeRate = 125) {
  const fetchMock = vi.fn((url: string) => {
    if (url.startsWith("/api/currency/rate?currency=USD")) {
      return Promise.resolve(new Response(JSON.stringify({ currency: "USD", rate: 1 }), { status: 200 }));
    }

    // Nothing else should be needed on the amount step.
    return new Promise<Response>(() => {});
  });

  vi.stubGlobal("fetch", fetchMock);

  render(<DonationFlow campaign={sampleCampaign} locale="en" currency={currency as never} exchangeRate={exchangeRate} />);

  return fetchMock;
}

describe("in-modal currency handling", () => {
  it("keeps a below-minimum custom amount visible with its symbol", () => {
    mount();

    const input = screen.getByPlaceholderText("Enter amount");

    fireEvent.change(input, { target: { value: "499" } });

    expect(input).toHaveValue(499);
    // The typed amount must stay on screen even though it is under the minimum.
    expect(screen.getByText("Total")).toBeVisible();
    expect(screen.getByText("৳499")).toBeVisible();
    expect(screen.getByText("The minimum donation amount is ৳625.")).toBeVisible();
    // The button stays clickable so pressing it surfaces the minimum warning.
    expect(screen.getByRole("button", { name: "Pay ৳499 by Card" })).toBeEnabled();
  });

  it("fills the minimum amount from the warning", () => {
    mount();

    const input = screen.getByPlaceholderText("Enter amount");

    fireEvent.change(input, { target: { value: "499" } });
    fireEvent.click(screen.getByRole("button", { name: "Use ৳625" }));

    expect(input).toHaveValue(625);
    expect(screen.queryByText(/The minimum donation amount is/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pay ৳625 by Card" })).toBeEnabled();
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

describe("custom amount typing", () => {
  it("starts a fresh amount instead of appending to the selected preset", async () => {
    const fetchMock = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", fetchMock);

    render(<DonationFlow campaign={sampleCampaign} locale="en" currency="BDT" exchangeRate={124.95} />);

    const input = screen.getByPlaceholderText("Enter amount");

    fireEvent.click(screen.getByRole("radio", { name: "৳3,124" }));
    // The field mirrors the preset while it is unfocused ...
    expect(input).toHaveValue(3124);

    const user = userEvent.setup();
    await user.click(input);
    // ... and becomes a clean field as soon as the donor types into it.
    expect(input).toHaveValue(null);
    await user.keyboard("4550");
    expect(input).toHaveValue(4550);
    expect(screen.getByRole("button", { name: "Pay ৳4,550 by Card" })).toBeEnabled();
  });

  it("renders presets in whole local currency units", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));

    render(<DonationFlow campaign={sampleCampaign} locale="en" currency="BDT" exchangeRate={124.95} />);

    expect(screen.getByRole("radio", { name: "৳3,124" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /৳6,248/ })).toBeInTheDocument();
    expect(screen.queryByText("৳3,123.75")).not.toBeInTheDocument();
  });
});

describe("currency sheet stacking", () => {
  it("opens above the donation modal layer", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));

    render(<DonationFlow campaign={sampleCampaign} locale="en" currency="BDT" exchangeRate={125} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Change currency: BDT" })[0]);

    const sheet = screen.getByRole("dialog", { name: "Choose currency" });
    const overlay = sheet.closest(".fixed");

    expect(overlay?.className).toContain("z-[400]");
    expect(overlay?.className).toContain("inset-0");
  });
});

describe("zero-decimal currencies", () => {
  it("shows yen presets and totals as whole units", () => {
    mount("JPY", 152);

    // $25 -> 3,800 yen, never 38.00 or 380,000.
    expect(screen.getByRole("radio", { name: "¥3,800" })).toBeInTheDocument();
    expect(screen.queryByText("¥38.00")).not.toBeInTheDocument();
  });

  it("keeps a typed yen amount whole and uses yen for the minimum warning", () => {
    mount("JPY", 152);

    const input = screen.getByPlaceholderText("Enter amount");

    fireEvent.change(input, { target: { value: "500" } });

    expect(input).toHaveValue(500);
    expect(screen.getByText("The minimum donation amount is ¥760.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Pay ¥500 by Card" })).toBeEnabled();
  });
});

describe("currency sheet contents", () => {
  it("offers every supported currency, including the newly added ones", async () => {
    const user = userEvent.setup();

    mount("KWD", 0.307);

    await user.click(screen.getAllByRole("button", { name: /Change currency/i })[0]);

    const options = screen.getAllByRole("option");

    expect(options).toHaveLength(currencies.length);

    const labels = options.map((option) => option.textContent ?? "");

    for (const code of ["AFN", "BYN", "HUF", "JPY", "KRW", "RUB", "TND", "VND", "KWD"]) {
      expect(labels.some((label) => label.includes(code))).toBe(true);
    }
  });

  it("keeps the newly supported majors one tap away", async () => {
    const user = userEvent.setup();

    mount("KWD", 0.307);

    await user.click(screen.getAllByRole("button", { name: /Change currency/i })[0]);

    for (const code of ["KWD", "JPY", "KRW", "RUB", "TWD", "HUF"]) {
      expect(screen.getAllByRole("button", { name: new RegExp(`^${code}$`) }).length).toBeGreaterThan(0);
    }
  });
});

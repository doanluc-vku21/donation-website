import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect, useEffectEvent, type PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Currency } from "@/lib/currency";
import { sampleCampaign } from "@/lib/sample-data";

const navigation = vi.hoisted(() => ({ pathname: "/akram-shake-2" }));
const stripe = vi.hoisted(() => ({ confirm: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));
vi.mock("@/lib/stripe/client", () => ({ getStripePromise: () => Promise.resolve(null), prepareStripe: vi.fn() }));
vi.mock("@stripe/react-stripe-js/checkout", () => ({
  CheckoutElementsProvider: ({ children }: PropsWithChildren) => children,
  useCheckoutElements: () => ({ type: "success", checkout: { confirm: stripe.confirm } }),
  PaymentElement: () => <div data-testid="card-fields" />,
  ContactDetailsElement: () => <input aria-label="Stripe contact email" type="email" required />,
}));
vi.mock("@/components/donation/donation-express-checkout", () => ({
  DonationExpressCheckout: function MockWallet({ onAvailabilityChange }: { onAvailabilityChange?: (available: boolean) => void }) {
    const reportReady = useEffectEvent(() => { onAvailabilityChange?.(false); });
    useEffect(() => { reportReady(); }, []);
    return null;
  },
}));

import { DonationPayment } from "@/components/donation/donation-payment";
import { DonationFlow } from "@/components/donation/donation-flow";

beforeEach(() => {
  vi.useFakeTimers();
  stripe.confirm.mockReset().mockResolvedValue({ type: "success" });
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function advance(ms = 500) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}

describe("card payment email confirmation", () => {
  it("passes the latest donor email to a preloaded payment without automatically confirming", async () => {
    const props = { clientSecret: "unit_secret", locale: "en" as const, amountLabel: "$25.00", onBack: vi.fn() };
    const { rerender } = render(<DonationPayment {...props} email="" preloadOnly />);
    expect(stripe.confirm).not.toHaveBeenCalled();
    rerender(<DonationPayment {...props} email="  donor@example.com  " />);
    expect(screen.queryByRole("textbox", { name: "Stripe contact email" })).not.toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Donate $25.00" })); });
    expect(stripe.confirm).toHaveBeenCalledExactlyOnceWith({ email: "donor@example.com" });
  });

  it("lets Stripe collect the required contact email when the optional donor form was skipped", async () => {
    render(<DonationPayment clientSecret="unit_secret" locale="en" email="" amountLabel="$10.00" onBack={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Stripe contact email" })).toBeRequired();
    expect(stripe.confirm).not.toHaveBeenCalled();
  });

  it("retains the donor email and restores the payment button after Stripe declines", async () => {
    stripe.confirm.mockResolvedValueOnce({ type: "error", error: { message: "Card was declined" } });
    render(<DonationPayment clientSecret="unit_secret" locale="en" email="donor@example.com" amountLabel="$25.00" onBack={vi.fn()} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Donate $25.00" })); });
    expect(screen.getByRole("alert")).toHaveTextContent("Card was declined");
    expect(screen.getByRole("button", { name: "Donate $25.00" })).toBeEnabled();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Donate $25.00" })); });
    expect(stripe.confirm).toHaveBeenNthCalledWith(2, { email: "donor@example.com" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe.each(["/akram-shake-2", "/help-mango-seller"])("card donation flow on %s", (pathname) => {
  function mount(currency: Currency = "USD", exchangeRate = 1) {
    navigation.pathname = pathname;
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/donation-attempt") {
        // A pending optional reminder write must not block card confirmation.
        return new Promise<Response>(() => {});
      }
      const body = JSON.parse(String(init?.body));
      return Promise.resolve(new Response(JSON.stringify({
        clientSecret: "unit_secret", sessionId: "cs_card", totalAmountMinor: body.amountCents, currency: body.currency,
      })));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<DonationFlow campaign={sampleCampaign} locale="en" currency={currency} exchangeRate={exchangeRate} />);
    return fetchMock;
  }

  async function chooseGift(amount: number, monthlyOffer: boolean) {
    fireEvent.click(screen.getByRole("radio", { name: "Give once" }));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: String(amount) } });
    fireEvent.click(screen.getByRole("button", { name: /Pay.*Card/ }));
    fireEvent.click(screen.getByRole("button", { name: monthlyOffer ? /Give.*Monthly/ : /Keep my.*one-time gift/ }));
    await advance();
  }

  async function pay(firstName: string = "Test", lastName: string = "Donor") {
    fireEvent.change(screen.getByRole("textbox", { name: /First name/ }), { target: { value: firstName } });
    fireEvent.change(screen.getByRole("textbox", { name: /Last name/ }), { target: { value: lastName } });
    fireEvent.change(screen.getByRole("textbox", { name: /Email address/ }), { target: { value: "donor@example.com" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Continue to secure checkout" })); });
    expect(screen.getByRole("heading", { name: "Payment" })).toBeVisible();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /^Donate / })); });
    expect(stripe.confirm).toHaveBeenCalledExactlyOnceWith({ email: "donor@example.com" });
  }

  it("confirms a one-time card gift with the donor email while bookkeeping is pending", async () => {
    const fetchMock = mount();
    await chooseGift(25, false);
    await pay();
    const calls = fetchMock.mock.calls.filter(([url]) => url === "/api/stripe/checkout");
    expect(calls).toHaveLength(1);
    expect(JSON.parse(String(calls[0][1]?.body))).toMatchObject({ frequency: "one_time", amountCents: 2500 });
  });

  it.each([false, true])("allows empty names but requires a valid email (monthly offer: %s)", async (monthlyOffer) => {
    const fetchMock = mount();
    await chooseGift(25, monthlyOffer);
    expect(screen.getByRole("textbox", { name: "First name" })).not.toBeRequired();
    expect(screen.getByRole("textbox", { name: "Last name" })).not.toBeRequired();
    expect(screen.getAllByPlaceholderText("Optional")).toHaveLength(2);
    expect(screen.getByText("First and last names are optional. Email is required.")).toBeVisible();
    const email = screen.getByRole("textbox", { name: /Email address/ });
    expect(email).toBeRequired();
    const next = screen.getByRole("button", { name: "Continue to secure checkout" });
    await act(async () => { fireEvent.click(next); });
    expect(screen.getByRole("alert")).toHaveTextContent(/email/i);
    expect(stripe.confirm).not.toHaveBeenCalled();
    fireEvent.change(email, { target: { value: "invalid" } });
    await act(async () => { fireEvent.click(next); });
    expect(screen.getByRole("alert")).toHaveTextContent(/valid email/i);
    expect(stripe.confirm).not.toHaveBeenCalled();
    await pay("", "");
    const attempt = fetchMock.mock.calls.find(([url]) => url === "/api/donation-attempt");
    expect(JSON.parse(String(attempt?.[1]?.body))).toMatchObject({ firstName: "", lastName: "", email: "donor@example.com" });
  });

  it.each([
    ["USD", 1, 25, 2000],
    ["GBP", 0.8, 20, 1600],
  ] as const)("accepts the twenty-dollar monthly offer in %s", async (currency, rate, oneTimeAmount, monthlyAmount) => {
    const fetchMock = mount(currency, rate);
    await chooseGift(oneTimeAmount, true);
    await pay();
    const calls = fetchMock.mock.calls.filter(([url]) => url === "/api/stripe/checkout");
    expect(calls).toHaveLength(1);
    expect(JSON.parse(String(calls[0][1]?.body))).toMatchObject({ frequency: "monthly", amountCents: monthlyAmount, currency });
  });
});

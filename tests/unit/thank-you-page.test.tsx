import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getThankYouTranslations } from "@/lib/thank-you-translations";

const mocks = vi.hoisted(() => ({ retrieve: vi.fn(), purchase: vi.fn() }));
vi.mock("@/lib/stripe/server", () => ({ stripe: { checkout: { sessions: { retrieve: mocks.retrieve } } } }));
vi.mock("@/components/analytics/meta-pixel-purchase", () => ({
  MetaPixelPurchase: (props: unknown) => { mocks.purchase(props); return null; },
}));

import ThankYouPage from "@/app/thank-you/page";

const session = {
  id: "cs_thank_you", payment_status: "paid", amount_total: 2750,
  currency: "usd", customer_details: { email: "donor@example.com" },
  metadata: { charged_donation_amount_cents: "2500", charged_fee_amount_cents: "250", frequency: "monthly" },
};
const translations = getThankYouTranslations("en");

beforeEach(() => { vi.resetAllMocks(); });
afterEach(() => { vi.restoreAllMocks(); });

describe("Thank-you page after isolating Stripe retrieval errors", () => {
  it("renders the missing-session message without contacting Stripe", async () => {
    render(await ThankYouPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("heading", { name: translations.sessionNotFound })).toBeVisible();
    expect(mocks.retrieve).not.toHaveBeenCalled();
    expect(mocks.purchase).not.toHaveBeenCalled();
  });

  it("preserves verified payment totals and the Purchase event", async () => {
    mocks.retrieve.mockResolvedValue(session);
    render(await ThankYouPage({ searchParams: Promise.resolve({ session_id: session.id }) }));
    expect(mocks.retrieve).toHaveBeenCalledWith(session.id);
    expect(mocks.purchase).toHaveBeenCalledWith({ sessionId: session.id, value: 27.5, currency: "USD", frequency: "monthly" });
    expect(screen.getByText("donor@example.com")).toBeVisible();
    expect(screen.getAllByText("$27.50").length).toBeGreaterThan(0);
  });

  it("does not report an unpaid session as a Purchase", async () => {
    mocks.retrieve.mockResolvedValue({ ...session, payment_status: "unpaid" });
    render(await ThankYouPage({ searchParams: Promise.resolve({ session_id: session.id }) }));
    expect(screen.getByText("unpaid")).toBeVisible();
    expect(mocks.purchase).not.toHaveBeenCalled();
  });

  it("preserves the verification fallback when Stripe retrieval fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.retrieve.mockRejectedValue(new Error("Stripe temporarily unavailable"));
    render(await ThankYouPage({ searchParams: Promise.resolve({ session_id: session.id }) }));
    expect(screen.getByRole("heading", { name: translations.verifyError })).toBeVisible();
    expect(mocks.purchase).not.toHaveBeenCalled();
  });
});

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { isCurrency } from "@/lib/currency";
import { getUsdToCurrencyRate } from "@/lib/exchange-rate";
import { getDonationAmounts } from "@/lib/stripe/donation-amount";
import { convertUsdToCurrencyMinor } from "@/lib/money";

export async function POST(request: Request) {
  try {
    const { sessionId, clientSecret, amountCents } = await request.json();
    if (typeof sessionId !== "string" || !/^cs_[a-zA-Z0-9_]+$/.test(sessionId) ||
        typeof clientSecret !== "string" || clientSecret.length > 512 ||
        !Number.isSafeInteger(amountCents) || amountCents < 100 || amountCents > 99_999_999) {
      return NextResponse.json({ error: "Invalid payment amount update." }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
    const expected = Buffer.from(session.client_secret ?? "");
    const supplied = Buffer.from(clientSecret);
    // The browser must possess this Session's capability, not merely its ID.
    if (!expected.length || expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
      return NextResponse.json({ error: "Invalid checkout session." }, { status: 403 });
    }
    const metadata = session.metadata ?? {};
    const currency = metadata.charged_currency;
    const item = session.line_items?.data[0];
    if (session.status !== "open" || session.payment_status !== "unpaid" ||
        session.ui_mode !== "elements" || metadata.checkout_source !== "express_amount_step" ||
        !isCurrency(currency) || session.currency !== currency.toLowerCase() ||
        session.line_items?.data.length !== 1 || !item?.price ||
        !["payment", "subscription"].includes(session.mode)) {
      return NextResponse.json({ error: "This checkout cannot be updated." }, { status: 409 });
    }

    const exchangeRate = await getUsdToCurrencyRate(currency);
    // Fee coverage, campaign, frequency and currency come from the existing Session.
    const coverFee = Number(metadata.charged_fee_amount_cents) > 0;
    const amounts = getDonationAmounts(amountCents, coverFee, exchangeRate);
    if (amountCents < convertUsdToCurrencyMinor(2_000, exchangeRate) || amounts.totalAmountCents > 99_999_999) {
      return NextResponse.json({ error: "Invalid custom donation amount." }, { status: 400 });
    }
    const product = typeof item.price.product === "string" ? item.price.product : item.price.product.id;
    const updated = await stripe.checkout.sessions.update(session.id, {
      line_items: [{
        quantity: 1,
        price_data: {
          currency: session.currency!, product, unit_amount: amounts.totalAmountCents,
          ...(session.mode === "subscription" ? { recurring: { interval: "month" as const } } : {}),
        },
      }],
      metadata: {
        charged_donation_amount_cents: String(amountCents),
        charged_fee_amount_cents: String(amounts.feeAmountCents),
        charged_total_amount_cents: String(amounts.totalAmountCents),
        normalized_donation_usd_cents: String(amounts.normalizedDonationUsdCents),
        normalized_fee_usd_cents: String(amounts.normalizedFeeUsdCents),
        normalized_total_usd_cents: String(amounts.normalizedTotalUsdCents),
        usd_exchange_rate: String(exchangeRate),
      },
    });
    if (updated.amount_total !== amounts.totalAmountCents) {
      throw new Error("Checkout amount synchronization failed.");
    }
    return NextResponse.json({ totalAmountMinor: amounts.totalAmountCents, currency });
  } catch {
    // Do not log request data, Session secrets or Stripe request objects.
    console.warn("Express checkout amount update failed; a fresh Session is required.");
    return NextResponse.json({ error: "Unable to update payment amount." }, { status: 500 });
  }
}

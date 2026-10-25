import {
  NextResponse,
} from "next/server";

import Stripe from "stripe";
import { metaCapiEnabled, sendMetaPurchase } from "@/lib/meta/server";

import {
  stripe,
} from "@/lib/stripe/server";

import {
  resend,
} from "@/lib/resend";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

import {
  isCurrency,
  type Currency,
} from "@/lib/currency";

import {
  convertCurrencyMinorToUsd,
} from "@/lib/money";

import {
  getUsdToCurrencyRate,
} from "@/lib/exchange-rate";

export const runtime =
  "nodejs";


async function completeDonationAttempt(
  attemptId:
    string | undefined,
  stripeCheckoutSessionId?:
    string | null,
) {
  const normalizedAttemptId =
    attemptId
      ?.trim();

  if (
    !normalizedAttemptId
  ) {
    return;
  }

  const updatePayload: {
    status:
      "completed";

    completed_at:
      string;

    updated_at:
      string;

    stripe_checkout_session_id?:
      string;
  } = {
    status:
      "completed",

    completed_at:
      new Date().toISOString(),

    updated_at:
      new Date().toISOString(),
  };

  if (
    stripeCheckoutSessionId
  ) {
    updatePayload
      .stripe_checkout_session_id =
      stripeCheckoutSessionId;
  }

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "donation_attempts",
      )
      .update(
        updatePayload,
      )
      .eq(
        "id",
        normalizedAttemptId,
      );

  if (
    error
  ) {
    console.error(
      "Donation attempt completion error:",
      error,
    );

    throw error;
  }
}


type DonationReceiptInput = {
  donationId:
    string;

  email:
    string;

  firstName:
    string;

  amountCents:
    number;

  currency:
    string;

  frequency:
    "one_time" | "monthly";

  reference:
    string;

  paidAt:
    Date;
};

function escapeReceiptHtml(
  value:
    string,
) {
  return value
    .replaceAll(
      "&",
      "&amp;",
    )
    .replaceAll(
      "<",
      "&lt;",
    )
    .replaceAll(
      ">",
      "&gt;",
    )
    .replaceAll(
      '"',
      "&quot;",
    )
    .replaceAll(
      "'",
      "&#039;",
    );
}

function formatReceiptAmount(
  amountCents:
    number,
  currency:
    string,
) {
  try {
    return new Intl.NumberFormat(
      "en-US",
      {
        style:
          "currency",

        currency:
          currency.toUpperCase(),

        minimumFractionDigits:
          amountCents %
            100 ===
          0
            ? 0
            : 2,

        maximumFractionDigits:
          2,
      },
    ).format(
      amountCents /
        100,
    );
  } catch {
    return `${(
      amountCents /
        100
    ).toFixed(
      2,
    )} ${currency.toUpperCase()}`;
  }
}

async function sendDonationReceipt({
  donationId,
  email,
  firstName,
  amountCents,
  currency,
  frequency,
  reference,
  paidAt,
}: DonationReceiptInput) {
  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  if (
    !normalizedEmail
  ) {
    console.warn(
      "Skipping donation receipt because donor email is missing:",
      donationId,
    );

    return;
  }

  /*
   * Claim the receipt before sending.
   *
   * Stripe can send checkout.session.completed and
   * invoice.payment_succeeded very close together for the first
   * subscription payment. This conditional UPDATE prevents both
   * webhook executions from sending the same receipt.
   *
   * A claim older than 15 minutes is considered stale so a
   * later Stripe retry can recover if the process crashed.
   */
  const staleClaimBefore =
    new Date(
      Date.now() -
        15 *
          60 *
          1000,
    ).toISOString();

  const claimTime =
    new Date().toISOString();

  const {
    data:
      claimedDonation,
    error:
      claimError,
  } =
    await supabaseAdmin
      .from(
        "donations",
      )
      .update({
        receipt_claimed_at:
          claimTime,
      })
      .eq(
        "id",
        donationId,
      )
      .is(
        "receipt_sent_at",
        null,
      )
      .or(
        `receipt_claimed_at.is.null,receipt_claimed_at.lt.${staleClaimBefore}`,
      )
      .select(
        "id",
      )
      .maybeSingle();

  if (
    claimError
  ) {
    console.error(
      "Donation receipt claim error:",
      donationId,
      claimError,
    );

    throw claimError;
  }

  if (
    !claimedDonation
  ) {
    console.log(
      "Donation receipt already sent or currently being processed:",
      donationId,
    );

    return;
  }

  const amountLabel =
    formatReceiptAmount(
      amountCents,
      currency,
    );

  const frequencyLabel =
    frequency ===
    "monthly"
      ? "Monthly"
      : "One-time";

  const safeFirstName =
    escapeReceiptHtml(
      firstName.trim() ||
        "Donor",
    );

  const safeAmountLabel =
    escapeReceiptHtml(
      amountLabel,
    );

  const safeReference =
    escapeReceiptHtml(
      reference,
    );

  const dateLabel =
    paidAt.toLocaleDateString(
      "en-US",
      {
        year:
          "numeric",
        month:
          "long",
        day:
          "numeric",
      },
    );

  const html =
    `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f7f8f5;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Your donation payment was received successfully.
    </div>

    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="background:#f7f8f5;"
    >
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              max-width:560px;
              background:#ffffff;
              border:1px solid #e7ebe5;
              border-radius:18px;
            "
          >
            <tr>
              <td
                style="
                  padding:32px;
                  font-family:Arial,Helvetica,sans-serif;
                  color:#17233b;
                "
              >
                <div
                  style="
                    font-size:14px;
                    font-weight:700;
                    color:#25724a;
                    margin-bottom:20px;
                  "
                >
                  MEAL SUPPORT INC
                </div>

                <h1
                  style="
                    margin:0 0 10px;
                    font-size:26px;
                    line-height:1.3;
                    color:#17233b;
                  "
                >
                  Thank you for your donation ❤️
                </h1>

                <p
                  style="
                    margin:0 0 24px;
                    font-size:16px;
                    line-height:1.65;
                    color:#45534b;
                  "
                >
                  Hi ${safeFirstName}, we’ve successfully received
                  your donation. Here is your payment receipt.
                </p>

                <div
                  style="
                    padding:24px;
                    margin:0 0 24px;
                    border-radius:14px;
                    background:#f4f7f5;
                  "
                >
                  <div
                    style="
                      margin-bottom:6px;
                      font-size:13px;
                      color:#718078;
                    "
                  >
                    Donation amount
                  </div>

                  <div
                    style="
                      margin-bottom:22px;
                      font-size:30px;
                      font-weight:700;
                      color:#17233b;
                    "
                  >
                    ${safeAmountLabel}
                  </div>

                  <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                      font-size:14px;
                      line-height:1.7;
                      color:#45534b;
                    "
                  >
                    <tr>
                      <td>Donation type</td>
                      <td align="right">
                        <strong>${frequencyLabel}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>Payment status</td>
                      <td align="right">
                        <strong style="color:#25724a;">Paid</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>Payment date</td>
                      <td align="right">
                        <strong>${dateLabel}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>Currency</td>
                      <td align="right">
                        <strong>${escapeReceiptHtml(
                          currency.toUpperCase(),
                        )}</strong>
                      </td>
                    </tr>
                  </table>
                </div>

                <p
                  style="
                    margin:0 0 8px;
                    font-size:13px;
                    line-height:1.6;
                    color:#7a857f;
                  "
                >
                  Payment reference
                </p>

                <p
                  style="
                    margin:0 0 24px;
                    font-size:12px;
                    line-height:1.6;
                    color:#45534b;
                    word-break:break-all;
                  "
                >
                  ${safeReference}
                </p>

                <p
                  style="
                    margin:0;
                    font-size:14px;
                    line-height:1.65;
                    color:#45534b;
                  "
                >
                  Thank you for your kindness and support.<br />
                  MEAL SUPPORT INC
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `.trim();

  const receiptText =
    [
      "MEAL SUPPORT INC",
      "",
      `Thank you for your donation, ${firstName.trim() || "Donor"}!`,
      "",
      "We’ve successfully received your donation.",
      "",
      `Donation amount: ${amountLabel}`,
      `Donation type: ${frequencyLabel}`,
      "Payment status: Paid",
      `Payment date: ${dateLabel}`,
      `Currency: ${currency.toUpperCase()}`,
      `Payment reference: ${reference}`,
      "",
      "Thank you for your kindness and support.",
      "MEAL SUPPORT INC",
    ].join(
      "\n",
    );

  const {
    data:
      emailData,
    error:
      emailError,
  } =
    await resend.emails.send({
      from:
        process.env
          .RESEND_FROM_EMAIL ??
        "MEAL SUPPORT INC <donations@mail.mealsupport.org>",

      to:
        normalizedEmail,

      replyTo:
        process.env
          .RESEND_REPLY_TO ??
        "support@mealsupport.org",

      subject:
        "Thank you for your donation ❤️",

      html,

      text:
        receiptText,
    });

  if (
    emailError
  ) {
    const {
      error:
        releaseError,
    } =
      await supabaseAdmin
        .from(
          "donations",
        )
        .update({
          receipt_claimed_at:
            null,
        })
        .eq(
          "id",
          donationId,
        )
        .eq(
          "receipt_claimed_at",
          claimTime,
        )
        .is(
          "receipt_sent_at",
          null,
        );

    if (
      releaseError
    ) {
      console.error(
        "Donation receipt claim release error:",
        donationId,
        releaseError,
      );
    }

    console.error(
      "Donation receipt send error:",
      donationId,
      emailError,
    );

    throw new Error(
      `Unable to send donation receipt: ${emailError.message}`,
    );
  }

  const {
    error:
      receiptUpdateError,
  } =
    await supabaseAdmin
      .from(
        "donations",
      )
      .update({
        receipt_sent_at:
          new Date().toISOString(),

        receipt_email_id:
          emailData?.id ??
          null,

        receipt_claimed_at:
          null,
      })
      .eq(
        "id",
        donationId,
      )
      .eq(
        "receipt_claimed_at",
        claimTime,
      );

  if (
    receiptUpdateError
  ) {
    console.error(
      "Donation receipt database update error:",
      donationId,
      receiptUpdateError,
    );

    throw receiptUpdateError;
  }

  console.log(
    "Donation receipt sent:",
    donationId,
    emailData?.id ??
      "no-email-id",
  );
}

export async function POST(
  request: Request,
) {
  const signature =
    request.headers.get(
      "stripe-signature",
    );

  if (!signature) {
    return NextResponse.json(
      {
        error:
          "Missing Stripe signature.",
      },
      {
        status: 400,
      },
    );
  }

  const webhookSecret =
    process.env
      .STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error(
      "Missing STRIPE_WEBHOOK_SECRET",
    );

    return NextResponse.json(
      {
        error:
          "Stripe webhook secret is not configured.",
      },
      {
        status: 500,
      },
    );
  }

  const rawBody =
    await request.text();

  let event:
    Stripe.Event;

  try {
    event =
      stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
  } catch (
    error
  ) {
    console.error(
      "Webhook signature verification failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Invalid Stripe webhook signature.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    switch (
      event.type
    ) {
      case "checkout.session.completed":
case "checkout.session.async_payment_succeeded": {
  const session =
    event.data
      .object as Stripe.Checkout.Session;

  await handleCheckoutSessionCompleted(
    session,
  );

  // Existing-donation branches must still reach delivery on webhook retries.
  if (session.payment_status === "paid" && metaCapiEnabled()) {
    const latestSession = await stripe.checkout.sessions.retrieve(session.id);
    if (!latestSession.metadata?.meta_purchase_sent_at) {
      const sent = await sendMetaPurchase(latestSession, event.created);
      if (sent) {
        // Webhook snapshots are immutable; read fresh metadata on every retry.
        // Concurrent deliveries/timeouts share event_id for Meta deduplication.
        await stripe.checkout.sessions.update(session.id, {
          metadata: { meta_purchase_sent_at: new Date().toISOString() },
        });
      }
    }
  }

  break;
}

case "invoice.payment_succeeded": {
  const invoice =
    event.data
      .object as Stripe.Invoice;

  await handleInvoicePaymentSucceeded(
    invoice,
  );

  break;
}

      default: {
        console.log(
          "Unhandled Stripe event:",
          event.type,
        );
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (
    error
  ) {
    console.error(
      "Stripe webhook processing error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Webhook processing failed.",
      },
      {
        status: 500,
      },
    );
  }
}

// =========================================================
// CHECKOUT SESSION COMPLETED
// =========================================================

async function handleCheckoutSessionCompleted(
  session:
    Stripe.Checkout.Session,
) {
  if (
    session.payment_status !==
    "paid"
  ) {
    console.log(
      "Ignoring unpaid Checkout Session:",
      session.id,
      session.payment_status,
    );

    return;
  }

  const metadata =
    session.metadata ??
    {};


  await completeDonationAttempt(
    metadata
      .donation_attempt_id,
    session.id,
  );

  const campaignId =
    metadata.campaign_id;

  const customerName =
    session
      .customer_details
      ?.name
      ?.trim() ??
    "";

  const metadataFirstName =
    metadata
      .donor_first_name
      ?.trim() ??
    "";

  const metadataLastName =
    metadata
      .donor_last_name
      ?.trim() ??
    "";

  const {
    firstName:
      customerFirstName,
    lastName:
      customerLastName,
  } =
    splitCustomerName(
      customerName,
    );

  const firstName =
    metadataFirstName ||
    customerFirstName ||
    "Donor";

  const lastName =
    metadataLastName ||
    customerLastName ||
    "";

  const rawEmail =
    metadata
      .donor_email
      ?.trim() ||
    session
      .customer_details
      ?.email ||
    session.customer_email ||
    "";

  const email =
    rawEmail
      .trim()
      .toLowerCase();

  const phone =
    metadata
      .donor_phone
      ?.trim() ||
    session
      .customer_details
      ?.phone ||
    null;

  const isAnonymous =
    metadata
      .is_anonymous !==
    "false";

  const metadataDisplayName =
    metadata
      .display_name
      ?.trim() ??
    "";

  const displayName =
    isAnonymous
      ? "Anonymous"
      : metadataDisplayName ||
        buildPublicDisplayName(
          firstName,
          lastName,
        );

  const chargedCurrency =
    normalizeCurrency(
      session.currency ??
        metadata
          .charged_currency,
    );

  const chargedDonationAmountCents =
    readPositiveInteger(
      metadata
        .charged_donation_amount_cents,
    );

  const chargedFeeAmountCents =
    readNonNegativeInteger(
      metadata
        .charged_fee_amount_cents,
    );

  const chargedTotalAmountCents =
    Number.isInteger(
      session.amount_total,
    ) &&
    (session.amount_total ??
      0) >
      0
      ? Number(
          session.amount_total,
        )
      : readPositiveInteger(
          metadata
            .charged_total_amount_cents,
        );

  const normalizedDonationUsdCents =
    readPositiveInteger(
      metadata
        .normalized_donation_usd_cents,
    );

  const normalizedFeeUsdCents =
    readNonNegativeInteger(
      metadata
        .normalized_fee_usd_cents,
    );

  const normalizedTotalUsdCents =
    readPositiveInteger(
      metadata
        .normalized_total_usd_cents,
    );

  const exchangeRate =
    readPositiveNumber(
      metadata
        .usd_exchange_rate,
    );

  const frequency =
    metadata.frequency ===
    "monthly"
      ? "monthly"
      : "one_time";

  if (!campaignId) {
    throw new Error(
      `Missing campaign_id in Checkout Session ${session.id}`,
    );
  }

  if (!email) {
    throw new Error(
      `Missing donor email in Checkout Session ${session.id}`,
    );
  }

  if (
    !chargedCurrency ||
    !chargedDonationAmountCents ||
    chargedTotalAmountCents <=
      0 ||
    normalizedDonationUsdCents <=
      0 ||
    normalizedTotalUsdCents <=
      0
  ) {
    throw new Error(
      `Invalid multi-currency metadata in Checkout Session ${session.id}`,
    );
  }

  const {
    data:
      existingDonation,
    error:
      existingDonationError,
  } =
    await supabaseAdmin
      .from(
        "donations",
      )
      .select(
        "id",
      )
      .eq(
        "stripe_checkout_session_id",
        session.id,
      )
      .maybeSingle();

  if (
    existingDonationError
  ) {
    console.error(
      "Existing donation lookup error:",
      existingDonationError,
    );

    throw existingDonationError;
  }

  if (
    existingDonation
  ) {
    console.log(
      "Donation already saved:",
      session.id,
    );

    await sendDonationReceipt({
      donationId:
        existingDonation.id,

      email,

      firstName,

      amountCents:
        chargedDonationAmountCents,

      currency:
        chargedCurrency,

      frequency,

      reference:
        session.id,

      paidAt:
        new Date(
          session.created *
            1000,
        ),
    });

    return;
  }

  const donorId =
    await getOrCreateDonor(
      {
        email,
        firstName,
        lastName,
        phone,

        stripeCustomerId:
          typeof session.customer ===
          "string"
            ? session.customer
            : null,
      },
    );

  const paymentIntentId =
    typeof session
      .payment_intent ===
    "string"
      ? session.payment_intent
      : null;

  const subscriptionId =
    typeof session
      .subscription ===
    "string"
      ? session.subscription
      : null;

  /*
   * Express Checkout donor fields can be added to the Checkout
   * Session immediately before wallet confirmation.
   *
   * For monthly donations, copy those final values onto the
   * Subscription so future invoice.payment_succeeded events
   * keep the donor identity/email.
   */
  if (
    subscriptionId
  ) {
    await stripe.subscriptions.update(
      subscriptionId,
      {
        metadata: {
          ...metadata,

          donor_first_name:
            firstName,

          donor_last_name:
            lastName,

          donor_email:
            email,

          display_name:
            displayName,

          is_anonymous:
            isAnonymous
              ? "true"
              : "false",
        },
      },
    );
  }

  const stripeCustomerId =
    typeof session
      .customer ===
    "string"
      ? session.customer
      : null;

  /*
   * IMPORTANT:
   *
   * Existing amount_* columns stay normalized to USD.
   * This keeps current campaign stats/RPC correct.
   *
   * charged_* columns store what Stripe actually charged.
   */
  const {
    data:
      insertedDonation,
    error:
      donationError,
  } =
    await supabaseAdmin
      .from(
        "donations",
      )
      .insert({
        campaign_id:
          campaignId,

        donor_id:
          donorId,

        display_name:
          displayName,

        amount_cents:
          normalizedDonationUsdCents,

        fee_amount_cents:
          normalizedFeeUsdCents,

        total_amount_cents:
          normalizedTotalUsdCents,

        currency:
          "USD",

        charged_amount_cents:
          chargedDonationAmountCents,

        charged_fee_amount_cents:
          chargedFeeAmountCents,

        charged_total_amount_cents:
          chargedTotalAmountCents,

        charged_currency:
          chargedCurrency,

        usd_exchange_rate:
          exchangeRate,

        frequency,

        status:
          "succeeded",

        is_anonymous:
          isAnonymous,

        stripe_customer_id:
          stripeCustomerId,

        stripe_payment_intent_id:
          paymentIntentId,

        stripe_checkout_session_id:
          session.id,

        stripe_subscription_id:
          subscriptionId,
      })
      .select(
        "id",
      )
      .single();

  if (
    donationError
  ) {
    if (
      donationError.code ===
      "23505"
    ) {
      console.log(
        "Donation already processed by database constraint:",
        session.id,
      );

      const {
        data:
          duplicateDonation,
        error:
          duplicateLookupError,
      } =
        await supabaseAdmin
          .from(
            "donations",
          )
          .select(
            "id",
          )
          .eq(
            "stripe_checkout_session_id",
            session.id,
          )
          .maybeSingle();

      if (
        duplicateLookupError
      ) {
        throw duplicateLookupError;
      }

      if (
        duplicateDonation
      ) {
        await sendDonationReceipt({
          donationId:
            duplicateDonation.id,

          email,

          firstName,

          amountCents:
            chargedDonationAmountCents,

          currency:
            chargedCurrency,

          frequency,

          reference:
            session.id,

          paidAt:
            new Date(
              session.created *
                1000,
            ),
        });
      }

      return;
    }

    console.error(
      "Donation insert error:",
      donationError,
    );

    throw donationError;
  }

  await sendDonationReceipt({
    donationId:
      insertedDonation.id,

    email,

    firstName,

    amountCents:
      chargedDonationAmountCents,

    currency:
      chargedCurrency,

    frequency,

    reference:
      session.id,

    paidAt:
      new Date(
        session.created *
          1000,
      ),
  });

  console.log(
    "Donation saved successfully:",
    session.id,
    "Charged:",
    chargedDonationAmountCents,
    chargedCurrency,
    "Normalized USD:",
    normalizedDonationUsdCents,
  );
}

// =========================================================
// INVOICE PAYMENT SUCCEEDED
// Monthly recurring payment after first charge.
// =========================================================

async function handleInvoicePaymentSucceeded(
  invoice:
    Stripe.Invoice,
) {
  /*
   * Stripe API 2026-08-26.dahlia can expose the subscription at
   * invoice.parent.subscription_details.subscription instead of
   * invoice.subscription.
   *
   * Support both shapes so old and new Stripe events work.
   */
  const invoiceWithSubscription =
    invoice as Stripe.Invoice & {
      subscription?:
        | string
        | Stripe.Subscription
        | null;

      parent?: {
        type?: string | null;

        subscription_details?: {
          subscription?:
            | string
            | Stripe.Subscription
            | null;
        } | null;
      } | null;
    };

  const legacySubscriptionValue =
    invoiceWithSubscription
      .subscription;

  const parentSubscriptionValue =
    invoiceWithSubscription
      .parent
      ?.subscription_details
      ?.subscription;

  const subscriptionValue =
    legacySubscriptionValue ??
    parentSubscriptionValue ??
    null;

  const subscriptionId =
    typeof subscriptionValue ===
    "string"
      ? subscriptionValue
      : subscriptionValue
          ?.id ??
        null;

  if (
    !subscriptionId
  ) {
    return;
  }

  // =========================================================
  // SUBSCRIPTION
  // =========================================================

  const subscription =
    await stripe
      .subscriptions
      .retrieve(
        subscriptionId,
      );

  const metadata =
    subscription.metadata ??
    {};


  await completeDonationAttempt(
    metadata
      .donation_attempt_id,
  );

  const campaignId =
    metadata.campaign_id;

  let email =
    metadata
      .donor_email
      ?.trim()
      .toLowerCase() ??
    "";

  let firstName =
    metadata
      .donor_first_name
      ?.trim() ??
    "";

  let lastName =
    metadata
      .donor_last_name
      ?.trim() ??
    "";

  const phone =
    metadata
      .donor_phone
      ?.trim() ||
    null;

  let displayName =
    metadata
      .display_name
      ?.trim() ??
    "";

  const isAnonymous =
    metadata
      .is_anonymous ===
    "true";

  if (!campaignId) {
    throw new Error(
      `Missing campaign_id in Subscription ${subscriptionId}`,
    );
  }

  // =========================================================
  // CURRENCY
  // =========================================================

  const chargedCurrency =
    normalizeCurrency(
      invoice.currency ??
        metadata
          .charged_currency,
    );

  if (
    !chargedCurrency
  ) {
    throw new Error(
      `Invalid currency in invoice ${invoice.id}`,
    );
  }

  const chargedDonationAmountCents =
    readPositiveInteger(
      metadata
        .charged_donation_amount_cents,
    );

  const chargedFeeAmountCents =
    readNonNegativeInteger(
      metadata
        .charged_fee_amount_cents,
    );

  if (
    chargedDonationAmountCents <=
    0
  ) {
    throw new Error(
      `Invalid donation amount in Subscription ${subscriptionId}`,
    );
  }

  const chargedTotalAmountCents =
    Number.isFinite(
      invoice.amount_paid,
    ) &&
    invoice.amount_paid >
      0
      ? invoice.amount_paid
      : chargedDonationAmountCents +
        chargedFeeAmountCents;

  // =========================================================
  // CURRENT FX RATE
  // =========================================================

  const exchangeRate =
    await getUsdToCurrencyRate(
      chargedCurrency,
    );

  const normalizedDonationUsdCents =
    convertCurrencyMinorToUsd(
      chargedDonationAmountCents,
      exchangeRate,
    );

  const normalizedFeeUsdCents =
    convertCurrencyMinorToUsd(
      chargedFeeAmountCents,
      exchangeRate,
    );

  const normalizedTotalUsdCents =
    convertCurrencyMinorToUsd(
      chargedTotalAmountCents,
      exchangeRate,
    );

  // =========================================================
  // PAYMENT INTENT
  // =========================================================

  const paymentIntentValue =
    (
      invoice as Stripe.Invoice & {
        payment_intent?:
          | string
          | Stripe.PaymentIntent
          | null;
      }
    ).payment_intent;

  const paymentIntentId =
    typeof paymentIntentValue ===
    "string"
      ? paymentIntentValue
      : paymentIntentValue
          ?.id ??
        null;

  // =========================================================
  // MONTHLY FIRST PAYMENT
  // =========================================================

  const isInitialSubscriptionPayment =
    invoice.billing_reason ===
    "subscription_create";

  let checkoutSessionId:
    string | null =
    null;

  let checkoutSession:
    Stripe.Checkout.Session | null =
    null;

  /*
   * Initial monthly Express Checkout can emit
   * invoice.payment_succeeded before checkout.session.completed
   * has copied donor details onto Subscription metadata.
   *
   * Resolve donor identity from the Checkout Session first when
   * Subscription metadata is still incomplete.
   */
  if (
    isInitialSubscriptionPayment
  ) {
    const checkoutSessions =
      await stripe.checkout
        .sessions.list({
          subscription:
            subscriptionId,

          limit:
            1,
        });

    checkoutSession =
      checkoutSessions
        .data[0] ??
      null;

    checkoutSessionId =
      checkoutSession?.id ??
      null;

    if (
      !email &&
      checkoutSession
    ) {
      email =
        (
          checkoutSession
            .customer_details
            ?.email ??
          checkoutSession
            .customer_email ??
          ""
        )
          .trim()
          .toLowerCase();
    }

    if (
      !firstName &&
      checkoutSession
        ?.customer_details
        ?.name
    ) {
      const {
        firstName:
          checkoutFirstName,
        lastName:
          checkoutLastName,
      } =
        splitCustomerName(
          checkoutSession
            .customer_details
            .name,
        );

      firstName =
        checkoutFirstName;

      if (
        !lastName
      ) {
        lastName =
          checkoutLastName;
      }
    }

    if (
      checkoutSessionId
    ) {
      const {
        data:
          existingInitialDonation,

        error:
          initialLookupError,
      } =
        await supabaseAdmin
          .from(
            "donations",
          )
          .select(
            "id",
          )
          .eq(
            "stripe_checkout_session_id",
            checkoutSessionId,
          )
          .maybeSingle();

      if (
        initialLookupError
      ) {
        console.error(
          "Initial subscription donation lookup error:",
          initialLookupError,
        );

        throw initialLookupError;
      }

      if (
        existingInitialDonation
      ) {
        console.log(
          "Initial subscription donation already saved:",
          invoice.id,
        );

        await sendDonationReceipt({
          donationId:
            existingInitialDonation.id,

          email,

          firstName,

          amountCents:
            chargedDonationAmountCents,

          currency:
            chargedCurrency,

          frequency:
            "monthly",

          reference:
            invoice.id,

          paidAt:
            new Date(
              invoice.created *
                1000,
            ),
        });

        return;
      }
    }
  }

  if (
    !email &&
    subscription.customer
  ) {
    const customerId =
      typeof subscription
        .customer ===
      "string"
        ? subscription
            .customer
        : subscription
            .customer.id;

    const customer =
      await stripe.customers.retrieve(
        customerId,
      );

    if (
      !customer.deleted
    ) {
      email =
        customer.email
          ?.trim()
          .toLowerCase() ??
        "";

      if (
        !firstName &&
        customer.name
      ) {
        const {
          firstName:
            customerFirstName,
          lastName:
            customerLastName,
        } =
          splitCustomerName(
            customer.name,
          );

        firstName =
          customerFirstName;

        if (
          !lastName
        ) {
          lastName =
            customerLastName;
        }
      }
    }
  }

  if (!email) {
    throw new Error(
      `Unable to resolve donor email for Subscription ${subscriptionId}`,
    );
  }

  if (
    !displayName
  ) {
    displayName =
      isAnonymous
        ? "Anonymous"
        : buildPublicDisplayName(
            firstName ||
              "Donor",
            lastName,
          );
  }

  // =========================================================
  // DUPLICATE PAYMENT INTENT CHECK
  // =========================================================

  if (
    paymentIntentId
  ) {
    const {
      data:
        existingDonation,

      error:
        existingDonationError,
    } =
      await supabaseAdmin
        .from(
          "donations",
        )
        .select(
          "id",
        )
        .eq(
          "stripe_payment_intent_id",
          paymentIntentId,
        )
        .maybeSingle();

    if (
      existingDonationError
    ) {
      console.error(
        "Recurring donation lookup error:",
        existingDonationError,
      );

      throw existingDonationError;
    }

    if (
      existingDonation
    ) {
      console.log(
        "Donation already saved:",
        invoice.id,
      );

      await sendDonationReceipt({
        donationId:
          existingDonation.id,

        email,

        firstName,

        amountCents:
          chargedDonationAmountCents,

        currency:
          chargedCurrency,

        frequency:
          "monthly",

        reference:
          invoice.id,

        paidAt:
          new Date(
            invoice.created *
              1000,
          ),
      });

      return;
    }
  }

  // =========================================================
  // CUSTOMER
  // =========================================================

  const customerValue =
    invoice.customer;

  const stripeCustomerId =
    typeof customerValue ===
    "string"
      ? customerValue
      : customerValue
          ?.id ??
        null;

  const donorId =
    await getOrCreateDonor(
      {
        email,
        firstName,
        lastName,
        phone,
        stripeCustomerId,
      },
    );

  // =========================================================
  // INSERT DONATION
  // =========================================================

  const {
    data:
      insertedDonation,
    error:
      donationError,
  } =
    await supabaseAdmin
      .from(
        "donations",
      )
      .insert({
        campaign_id:
          campaignId,

        donor_id:
          donorId,

        display_name:
          displayName,

        amount_cents:
          normalizedDonationUsdCents,

        fee_amount_cents:
          normalizedFeeUsdCents,

        total_amount_cents:
          normalizedTotalUsdCents,

        currency:
          "USD",

        charged_amount_cents:
          chargedDonationAmountCents,

        charged_fee_amount_cents:
          chargedFeeAmountCents,

        charged_total_amount_cents:
          chargedTotalAmountCents,

        charged_currency:
          chargedCurrency,

        usd_exchange_rate:
          exchangeRate,

        frequency:
          "monthly",

        status:
          "succeeded",

        is_anonymous:
          isAnonymous,

        stripe_customer_id:
          stripeCustomerId,

        stripe_payment_intent_id:
          paymentIntentId,

        /*
         * Với payment Monthly đầu tiên,
         * lưu luôn Checkout Session ID.
         *
         * Các tháng tiếp theo = null.
         */
        stripe_checkout_session_id:
          checkoutSessionId,

        stripe_subscription_id:
          subscriptionId,
      })
      .select(
        "id",
      )
      .single();

  if (
    donationError
  ) {
    /*
     * Hai Stripe events có thể chạy gần như cùng lúc:
     *
     * checkout.session.completed
     * invoice.payment_succeeded
     *
     * Nếu event còn lại đã insert trước thì unique constraint
     * sẽ trả 23505. Đây không phải lỗi payment.
     */
    if (
      donationError.code ===
      "23505"
    ) {
      console.log(
        "Donation already processed by another Stripe event:",
        invoice.id,
      );

      let duplicateDonationId:
        string | null =
        null;

      if (
        paymentIntentId
      ) {
        const {
          data:
            duplicateDonation,
          error:
            duplicateLookupError,
        } =
          await supabaseAdmin
            .from(
              "donations",
            )
            .select(
              "id",
            )
            .eq(
              "stripe_payment_intent_id",
              paymentIntentId,
            )
            .maybeSingle();

        if (
          duplicateLookupError
        ) {
          throw duplicateLookupError;
        }

        duplicateDonationId =
          duplicateDonation?.id ??
          null;
      }

      if (
        !duplicateDonationId &&
        checkoutSessionId
      ) {
        const {
          data:
            duplicateDonation,
          error:
            duplicateLookupError,
        } =
          await supabaseAdmin
            .from(
              "donations",
            )
            .select(
              "id",
            )
            .eq(
              "stripe_checkout_session_id",
              checkoutSessionId,
            )
            .maybeSingle();

        if (
          duplicateLookupError
        ) {
          throw duplicateLookupError;
        }

        duplicateDonationId =
          duplicateDonation?.id ??
          null;
      }

      if (
        duplicateDonationId
      ) {
        await sendDonationReceipt({
          donationId:
            duplicateDonationId,

          email,

          firstName,

          amountCents:
            chargedDonationAmountCents,

          currency:
            chargedCurrency,

          frequency:
            "monthly",

          reference:
            invoice.id,

          paidAt:
            new Date(
              invoice.created *
                1000,
            ),
        });
      }

      return;
    }

    console.error(
      "Monthly donation insert error:",
      donationError,
    );

    throw donationError;
  }

  await sendDonationReceipt({
    donationId:
      insertedDonation.id,

    email,

    firstName,

    amountCents:
      chargedDonationAmountCents,

    currency:
      chargedCurrency,

    frequency:
      "monthly",

    reference:
      invoice.id,

    paidAt:
      new Date(
        invoice.created *
          1000,
      ),
  });

  console.log(
    isInitialSubscriptionPayment
      ? "Initial monthly donation saved:"
      : "Recurring monthly donation saved:",
    invoice.id,
    "Charged:",
    chargedDonationAmountCents,
    chargedCurrency,
    "Normalized USD:",
    normalizedDonationUsdCents,
  );
}

// =========================================================
// HELPERS
// =========================================================

function normalizeCurrency(
  value:
    | string
    | null
    | undefined,
): Currency | null {
  const normalized =
    value
      ?.trim()
      .toUpperCase();

  return isCurrency(
    normalized,
  )
    ? normalized
    : null;
}

function readPositiveInteger(
  value:
    | string
    | undefined,
) {
  const parsed =
    Number(
      value,
    );

  return Number.isInteger(
    parsed,
  ) &&
    parsed >
      0
    ? parsed
    : 0;
}

function readNonNegativeInteger(
  value:
    | string
    | undefined,
) {
  const parsed =
    Number(
      value ??
        0,
    );

  return Number.isInteger(
    parsed,
  ) &&
    parsed >=
      0
    ? parsed
    : 0;
}

function readPositiveNumber(
  value:
    | string
    | undefined,
) {
  const parsed =
    Number(
      value,
    );

  return Number.isFinite(
    parsed,
  ) &&
    parsed >
      0
    ? parsed
    : 1;
}

function splitCustomerName(
  fullName:
    string,
) {
  const parts =
    fullName
      .trim()
      .split(
        /\s+/,
      )
      .filter(
        Boolean,
      );

  if (
    parts.length ===
    0
  ) {
    return {
      firstName:
        "",
      lastName:
        "",
    };
  }

  if (
    parts.length ===
    1
  ) {
    return {
      firstName:
        parts[0],
      lastName:
        "",
    };
  }

  return {
    firstName:
      parts[0],

    lastName:
      parts
        .slice(
          1,
        )
        .join(
          " ",
        ),
  };
}

function buildPublicDisplayName(
  firstName:
    string,
  lastName:
    string,
) {
  const first =
    firstName
      .trim();

  const last =
    lastName
      .trim();

  if (
    !first
  ) {
    return "Donor";
  }

  if (
    !last
  ) {
    return first;
  }

  return `${first} ${last.charAt(0)}.`;
}

// =========================================================
// GET OR CREATE DONOR
// =========================================================

async function getOrCreateDonor({
  email,
  firstName,
  lastName,
  phone,
  stripeCustomerId,
}: {
  email: string;
  firstName: string;
  lastName: string;
  phone:
    string | null;
  stripeCustomerId:
    string | null;
}) {
  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  const {
    data:
      existingDonor,
    error:
      donorLookupError,
  } =
    await supabaseAdmin
      .from(
        "donors",
      )
      .select(
        `
          id,
          first_name,
          last_name,
          email,
          phone,
          stripe_customer_id
        `,
      )
      .ilike(
        "email",
        normalizedEmail,
      )
      .maybeSingle();

  if (
    donorLookupError
  ) {
    console.error(
      "Donor lookup error:",
      donorLookupError,
    );

    throw donorLookupError;
  }

  if (
    existingDonor
  ) {
    const {
      error:
        donorUpdateError,
    } =
      await supabaseAdmin
        .from(
          "donors",
        )
        .update({
          first_name:
            firstName ||
            existingDonor
              .first_name,

          last_name:
            lastName ||
            existingDonor
              .last_name,

          phone:
            phone ||
            existingDonor
              .phone,

          stripe_customer_id:
            stripeCustomerId ||
            existingDonor
              .stripe_customer_id,
        })
        .eq(
          "id",
          existingDonor.id,
        );

    if (
      donorUpdateError
    ) {
      console.error(
        "Donor update error:",
        donorUpdateError,
      );

      throw donorUpdateError;
    }

    return existingDonor.id;
  }

  const {
    data:
      newDonor,
    error:
      donorInsertError,
  } =
    await supabaseAdmin
      .from(
        "donors",
      )
      .insert({
        first_name:
          firstName ||
          "Donor",

        last_name:
          lastName,

        email:
          normalizedEmail,

        phone,

        stripe_customer_id:
          stripeCustomerId,
      })
      .select(
        "id",
      )
      .single();

  if (
    donorInsertError
  ) {
    console.error(
      "Donor insert error:",
      donorInsertError,
    );

    throw donorInsertError;
  }

  return newDonor.id;
}

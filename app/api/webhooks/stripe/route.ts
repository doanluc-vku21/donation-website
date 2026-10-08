import {
  NextResponse,
} from "next/server";

import Stripe from "stripe";

import {
  stripe,
} from "@/lib/stripe/server";

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
      case "checkout.session.completed": {
        const session =
          event.data
            .object as Stripe.Checkout.Session;

        await handleCheckoutSessionCompleted(
          session,
        );

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
      });

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

      return;
    }

    console.error(
      "Donation insert error:",
      donationError,
    );

    throw donationError;
  }

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
  const subscriptionValue =
    (
      invoice as Stripe.Invoice & {
        subscription?:
          | string
          | Stripe.Subscription
          | null;
      }
    ).subscription;

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

  /*
   * First subscription invoice was already saved by
   * checkout.session.completed.
   */
  if (
    invoice.billing_reason ===
    "subscription_create"
  ) {
    console.log(
      "Initial subscription invoice ignored:",
      invoice.id,
    );

    return;
  }

  const subscription =
    await stripe
      .subscriptions
      .retrieve(
        subscriptionId,
      );

  const metadata =
    subscription.metadata ??
    {};

  const campaignId =
    metadata.campaign_id;

  const email =
    metadata
      .donor_email
      ?.trim()
      .toLowerCase();

  const firstName =
    metadata
      .donor_first_name
      ?.trim() ??
    "";

  const lastName =
    metadata
      .donor_last_name
      ?.trim() ??
    "";

  const phone =
    metadata
      .donor_phone
      ?.trim() ||
    null;

  const displayName =
    metadata
      .display_name
      ?.trim() ||
    "Anonymous";

  const isAnonymous =
    metadata
      .is_anonymous ===
    "true";

  if (!campaignId) {
    throw new Error(
      `Missing campaign_id in Subscription ${subscriptionId}`,
    );
  }

  if (!email) {
    throw new Error(
      `Missing donor_email in Subscription ${subscriptionId}`,
    );
  }

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
      `Invalid currency in recurring invoice ${invoice.id}`,
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
    )
      ? invoice.amount_paid
      : chargedDonationAmountCents +
        chargedFeeAmountCents;

  /*
   * Recurring payments happen in the future, so normalize them
   * using the FX rate at payment time rather than the old rate.
   */
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
        "Recurring donation already saved:",
        invoice.id,
      );

      return;
    }
  }

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

  const {
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

        stripe_checkout_session_id:
          null,

        stripe_subscription_id:
          subscriptionId,
      });

  if (
    donationError
  ) {
    if (
      donationError.code ===
      "23505"
    ) {
      console.log(
        "Recurring donation already processed:",
        invoice.id,
      );

      return;
    }

    console.error(
      "Recurring donation insert error:",
      donationError,
    );

    throw donationError;
  }

  console.log(
    "Recurring monthly donation saved:",
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

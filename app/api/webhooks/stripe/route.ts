import { NextResponse } from "next/server";
import Stripe from "stripe";

import { stripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      {
        error: "Missing Stripe signature.",
      },
      {
        status: 400,
      },
    );
  }

  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET;

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

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (error) {
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
    switch (event.type) {
      case "checkout.session.completed": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        await handleCheckoutSessionCompleted(
          session,
        );

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice =
          event.data.object as Stripe.Invoice;

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
  } catch (error) {
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

/*
 * ============================================================
 * CHECKOUT SESSION COMPLETED
 *
 * Dùng cho:
 * - One-time donation
 * - Monthly donation lần đầu
 * ============================================================
 */

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
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
    session.metadata ?? {};

  const campaignId =
    metadata.campaign_id;

  const firstName =
    metadata.donor_first_name?.trim() ??
    "";

  const lastName =
    metadata.donor_last_name?.trim() ??
    "";

  const rawEmail =
    metadata.donor_email?.trim() ||
    session.customer_details
      ?.email ||
    session.customer_email ||
    "";

  const email =
    rawEmail
      .trim()
      .toLowerCase();

  const phone =
    metadata.donor_phone?.trim() ||
    session.customer_details
      ?.phone ||
    null;

  const displayName =
    metadata.display_name?.trim() ||
    "Anonymous";

  const isAnonymous =
    metadata.is_anonymous ===
    "true";

  const donationAmountCents =
    Number(
      metadata.donation_amount_cents,
    );

  const feeAmountCents =
    Number(
      metadata.fee_amount_cents ??
        0,
    );

  const totalAmountCents =
    Number(
      metadata.total_amount_cents ??
        session.amount_total ??
        0,
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

  if (
    !Number.isInteger(
      donationAmountCents,
    ) ||
    donationAmountCents <= 0
  ) {
    throw new Error(
      `Invalid donation amount in Checkout Session ${session.id}`,
    );
  }

  if (!email) {
    throw new Error(
      `Missing donor email in Checkout Session ${session.id}`,
    );
  }

  /*
   * Idempotency:
   * không tạo lại donation nếu Stripe retry event.
   */
  const {
    data: existingDonation,
    error: existingDonationError,
  } = await supabaseAdmin
    .from("donations")
    .select("id")
    .eq(
      "stripe_checkout_session_id",
      session.id,
    )
    .maybeSingle();

  if (existingDonationError) {
    console.error(
      "Existing donation lookup error:",
      existingDonationError,
    );

    throw existingDonationError;
  }

  if (existingDonation) {
    console.log(
      "Donation already saved:",
      session.id,
    );

    return;
  }

  /*
   * Tìm hoặc tạo donor.
   */
  const donorId =
    await getOrCreateDonor({
      email,
      firstName,
      lastName,
      phone,

      stripeCustomerId:
        typeof session.customer ===
        "string"
          ? session.customer
          : null,
    });

  const paymentIntentId =
    typeof session.payment_intent ===
    "string"
      ? session.payment_intent
      : null;

  const subscriptionId =
    typeof session.subscription ===
    "string"
      ? session.subscription
      : null;

  const stripeCustomerId =
    typeof session.customer ===
    "string"
      ? session.customer
      : null;

  /*
   * Tạo donation cho lần thanh toán đầu tiên.
   */
  const {
    error: donationError,
  } = await supabaseAdmin
    .from("donations")
    .insert({
      campaign_id:
        campaignId,

      donor_id:
        donorId,

      display_name:
        displayName,

      amount_cents:
        donationAmountCents,

      fee_amount_cents:
        Number.isFinite(
          feeAmountCents,
        )
          ? feeAmountCents
          : 0,

      total_amount_cents:
        Number.isFinite(
          totalAmountCents,
        )
          ? totalAmountCents
          : donationAmountCents,

      currency:
        session.currency
          ?.toUpperCase() ??
        "USD",

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

if (donationError) {
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
    "Frequency:",
    frequency,
    "Subscription:",
    subscriptionId,
    "Donor:",
    donorId,
  );
}

/*
 * ============================================================
 * INVOICE PAYMENT SUCCEEDED
 *
 * Dùng cho:
 * monthly recurring payment ở các tháng sau.
 * ============================================================
 */

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
) {
  /*
   * Lấy subscription id.
   *
   * Một số phiên bản Stripe typings có thể không expose trực tiếp
   * invoice.subscription, nên cast nhẹ để an toàn.
   */
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
      : subscriptionValue?.id ??
        null;

  /*
   * Invoice không thuộc subscription thì bỏ qua.
   */
  if (!subscriptionId) {
    return;
  }

  /*
   * Invoice đầu tiên của subscription đã được ghi bằng
   * checkout.session.completed.
   *
   * Nếu ghi tiếp ở đây sẽ bị duplicate donation đầu tiên.
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

  /*
   * Retrieve subscription để lấy metadata.
   */
  const subscription =
    await stripe.subscriptions.retrieve(
      subscriptionId,
    );

  const metadata =
    subscription.metadata ?? {};

  const campaignId =
    metadata.campaign_id;

  const email =
    metadata.donor_email
      ?.trim()
      .toLowerCase();

  const firstName =
    metadata.donor_first_name?.trim() ??
    "";

  const lastName =
    metadata.donor_last_name?.trim() ??
    "";

  const phone =
    metadata.donor_phone?.trim() ||
    null;

  const displayName =
    metadata.display_name?.trim() ||
    "Anonymous";

  const isAnonymous =
    metadata.is_anonymous ===
    "true";

  const donationAmountCents =
    Number(
      metadata.donation_amount_cents,
    );

  const feeAmountCents =
    Number(
      metadata.fee_amount_cents ??
        0,
    );

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

  if (
    !Number.isInteger(
      donationAmountCents,
    ) ||
    donationAmountCents <= 0
  ) {
    throw new Error(
      `Invalid donation amount in Subscription ${subscriptionId}`,
    );
  }

  /*
   * Lấy PaymentIntent ID từ invoice.
   */
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
      : paymentIntentValue?.id ??
        null;

  /*
   * Idempotency cho recurring payment.
   *
   * Nếu invoice webhook retry,
   * không tạo thêm donation.
   */
  if (paymentIntentId) {
    const {
      data: existingDonation,
      error:
        existingDonationError,
    } = await supabaseAdmin
      .from("donations")
      .select("id")
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

  /*
   * Stripe Customer ID.
   */
  const customerValue =
    invoice.customer;

  const stripeCustomerId =
    typeof customerValue ===
    "string"
      ? customerValue
      : customerValue?.id ??
        null;

  /*
   * Reuse donor hiện tại.
   */
  const donorId =
    await getOrCreateDonor({
      email,
      firstName,
      lastName,
      phone,
      stripeCustomerId,
    });

  /*
   * Tổng Stripe thực thu kỳ này.
   */
  const totalAmountCents =
    Number.isFinite(
      invoice.amount_paid,
    )
      ? invoice.amount_paid
      : donationAmountCents +
        feeAmountCents;

  /*
   * Insert recurring donation.
   */
  const {
    error: donationError,
  } = await supabaseAdmin
    .from("donations")
    .insert({
      campaign_id:
        campaignId,

      donor_id:
        donorId,

      display_name:
        displayName,

      amount_cents:
        donationAmountCents,

      fee_amount_cents:
        Number.isFinite(
          feeAmountCents,
        )
          ? feeAmountCents
          : 0,

      total_amount_cents:
        totalAmountCents,

      currency:
        invoice.currency
          ?.toUpperCase() ??
        "USD",

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
if (donationError) {
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
    "Subscription:",
    subscriptionId,
    "Donor:",
    donorId,
  );
}

/*
 * ============================================================
 * GET OR CREATE DONOR
 *
 * Email tồn tại:
 * → reuse donor
 *
 * Email chưa tồn tại:
 * → tạo donor mới
 * ============================================================
 */

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
  phone: string | null;
  stripeCustomerId: string | null;
}) {
  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  const {
    data: existingDonor,
    error: donorLookupError,
  } = await supabaseAdmin
    .from("donors")
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

  if (donorLookupError) {
    console.error(
      "Donor lookup error:",
      donorLookupError,
    );

    throw donorLookupError;
  }

  /*
   * Donor đã tồn tại.
   */
  if (existingDonor) {
    const {
      error: donorUpdateError,
    } = await supabaseAdmin
      .from("donors")
      .update({
        first_name:
          firstName ||
          existingDonor.first_name,

        last_name:
          lastName ||
          existingDonor.last_name,

        phone:
          phone ||
          existingDonor.phone,

        stripe_customer_id:
          stripeCustomerId ||
          existingDonor.stripe_customer_id,
      })
      .eq(
        "id",
        existingDonor.id,
      );

    if (donorUpdateError) {
      console.error(
        "Donor update error:",
        donorUpdateError,
      );

      throw donorUpdateError;
    }

    console.log(
      "Existing donor reused:",
      existingDonor.id,
      normalizedEmail,
    );

    return existingDonor.id;
  }

  /*
   * Donor chưa tồn tại.
   */
  const {
    data: newDonor,
    error: donorInsertError,
  } = await supabaseAdmin
    .from("donors")
    .insert({
      first_name:
        firstName || "Donor",

      last_name:
        lastName,

      email:
        normalizedEmail,

      phone,

      stripe_customer_id:
        stripeCustomerId,
    })
    .select("id")
    .single();

  if (donorInsertError) {
    console.error(
      "Donor insert error:",
      donorInsertError,
    );

    throw donorInsertError;
  }

  console.log(
    "New donor created:",
    newDonor.id,
    normalizedEmail,
  );

  return newDonor.id;
}
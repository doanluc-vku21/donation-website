import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe/server";

type DonationFrequency =
  | "one_time"
  | "monthly";

type CheckoutBody = {
  campaignId: string;
  amountCents: number;
  coverFee: boolean;
  frequency: DonationFrequency;

  donor: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    displayPublicly: boolean;
  };
};

export async function POST(
  request: Request,
) {
  try {
    const body =
      (await request.json()) as CheckoutBody;

    const {
      campaignId,
      amountCents,
      coverFee,
      frequency,
      donor,
    } = body;

    // =========================================================
    // VALIDATE CAMPAIGN
    // =========================================================

    if (!campaignId) {
      return NextResponse.json(
        {
          error:
            "Campaign is required.",
        },
        {
          status: 400,
        },
      );
    }

    // =========================================================
    // VALIDATE DONATION AMOUNT
    //
    // amountCents uses cents
    // 5000 = $50
    // =========================================================

    if (
      !Number.isInteger(
        amountCents,
      ) ||
      amountCents < 100
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid donation amount.",
        },
        {
          status: 400,
        },
      );
    }

    // =========================================================
    // VALIDATE FREQUENCY
    // =========================================================

    if (
      frequency !==
        "one_time" &&
      frequency !==
        "monthly"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid donation frequency.",
        },
        {
          status: 400,
        },
      );
    }

    // =========================================================
    // VALIDATE DONOR
    // =========================================================

    if (
      !donor?.firstName?.trim() ||
      !donor?.lastName?.trim() ||
      !donor?.email?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter your name and email.",
        },
        {
          status: 400,
        },
      );
    }

    // =========================================================
    // EMAIL VALIDATION
    // =========================================================

    const email =
      donor.email
        .trim()
        .toLowerCase();

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(
        email,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        },
      );
    }

    // =========================================================
    // TRANSACTION COST CONTRIBUTION
    //
    // Never trust a total sent by client.
    // Server calculates again.
    // =========================================================

    const feeAmountCents =
      coverFee
        ? Math.round(
            amountCents *
              0.029 +
              30,
          )
        : 0;

    const totalAmountCents =
      amountCents +
      feeAmountCents;

    // =========================================================
    // SITE URL
    //
    // Local:
    // http://localhost:3000
    //
    // Production:
    // https://donate.hungersupport.org
    // =========================================================

    const siteUrl =
      process.env
        .NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    // =========================================================
    // DISPLAY NAME
    // =========================================================

    const displayName =
      donor.displayPublicly
        ? `${donor.firstName.trim()} ${donor.lastName
            .trim()
            .charAt(0)}.`
        : "Anonymous";

    // =========================================================
    // SHARED METADATA
    //
    // Webhook reads this metadata later.
    // =========================================================

    const metadata = {
      campaign_id:
        campaignId,

      donation_amount_cents:
        String(
          amountCents,
        ),

      fee_amount_cents:
        String(
          feeAmountCents,
        ),

      total_amount_cents:
        String(
          totalAmountCents,
        ),

      frequency,

      donor_first_name:
        donor.firstName.trim(),

      donor_last_name:
        donor.lastName.trim(),

      donor_email:
        email,

      donor_phone:
        donor.phone?.trim() ??
        "",

      display_name:
        displayName,

      is_anonymous:
        donor.displayPublicly
          ? "false"
          : "true",
    };

    // =========================================================
    // CREATE STRIPE CHECKOUT SESSION
    // =========================================================

    const session =
      await stripe.checkout.sessions.create(
        {
          // -----------------------------------------------------
          // MODE
          //
          // one_time = payment
          // monthly = subscription
          // -----------------------------------------------------

          mode:
            frequency ===
            "monthly"
              ? "subscription"
              : "payment",

          // -----------------------------------------------------
          // CUSTOMER
          // -----------------------------------------------------

          customer_email:
            email,

          // -----------------------------------------------------
          // LINE ITEM
          // -----------------------------------------------------

          line_items: [
            {
              quantity: 1,

              price_data: {
                currency:
                  "usd",

                unit_amount:
                  totalAmountCents,

                // Monthly recurring only
                ...(frequency ===
                "monthly"
                  ? {
                      recurring:
                        {
                          interval:
                            "month" as const,
                        },
                    }
                  : {}),

                product_data:
                  {
                    name:
                      frequency ===
                      "monthly"
                        ? "Monthly donation"
                        : "One-time donation",

                    description:
                      coverFee
                        ? frequency ===
                          "monthly"
                          ? "Monthly donation including transaction cost contribution"
                          : "One-time donation including transaction cost contribution"
                        : frequency ===
                          "monthly"
                          ? "Monthly campaign donation"
                          : "One-time campaign donation",
                  },
              },
            },
          ],

          // =====================================================
          // REDIRECT URLS
          // =====================================================

          success_url:
            `${siteUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${siteUrl}/gaza-food#donation-panel`,

          // =====================================================
          // CHECKOUT SESSION METADATA
          // =====================================================

          metadata,

          // =====================================================
          // SUBSCRIPTION METADATA
          //
          // Copy metadata into subscription so recurring
          // invoice/payment events can identify campaign/donor.
          // =====================================================

          ...(frequency ===
          "monthly"
            ? {
                subscription_data:
                  {
                    metadata,
                  },
              }
            : {}),
        },
      );

    // =========================================================
    // STRIPE MUST RETURN CHECKOUT URL
    // =========================================================

    if (!session.url) {
      throw new Error(
        "Stripe Checkout URL was not created.",
      );
    }

    // =========================================================
    // RESPONSE
    // =========================================================

    return NextResponse.json(
      {
        url: session.url,

        sessionId:
          session.id,

        mode:
          frequency ===
          "monthly"
            ? "subscription"
            : "payment",
      },
    );
  } catch (error) {
    console.error(
      "Stripe checkout error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to create checkout session.",
      },
      {
        status: 500,
      },
    );
  }
}
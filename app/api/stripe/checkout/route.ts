import {
  NextResponse,
} from "next/server";

import {
  stripe,
} from "@/lib/stripe/server";

import {
  isLocale,
  type Locale,
} from "@/lib/i18n";

type DonationFrequency =
  | "one_time"
  | "monthly";

type StripeSupportedLocale =
  | "en"
  | "fr"
  | "de"
  | "es";

type CheckoutBody = {
  campaignId: string;

  campaignSlug: string;

  amountCents: number;

  coverFee: boolean;

  frequency:
    DonationFrequency;

  locale:
    Locale;

  donor: {
    firstName:
      string;

    lastName:
      string;

    email:
      string;

    displayPublicly:
      boolean;
  };
};

// =========================================================
// PUBLIC CAMPAIGN PATH
// =========================================================

function getCampaignPublicPath(
  campaignSlug: string,
) {
  switch (
    campaignSlug
  ) {
    case "give-a-child-a-brighter-tomorrow":
      return "/gaza-food";

    case "akram-shake":
      return "/akram-shake";

    default:
      return `/${campaignSlug}`;
  }
}

// =========================================================
// STRIPE PRODUCT TRANSLATIONS
// =========================================================

const stripeProductTranslations:
  Record<
    StripeSupportedLocale,
    {
      monthlyName:
        string;

      oneTimeName:
        string;

      monthlyWithFeeDescription:
        string;

      oneTimeWithFeeDescription:
        string;

      monthlyDescription:
        string;

      oneTimeDescription:
        string;
    }
  > = {
  en: {
    monthlyName:
      "Monthly donation",

    oneTimeName:
      "One-time donation",

    monthlyWithFeeDescription:
      "Monthly donation including transaction cost contribution",

    oneTimeWithFeeDescription:
      "One-time donation including transaction cost contribution",

    monthlyDescription:
      "Monthly campaign donation",

    oneTimeDescription:
      "One-time campaign donation",
  },

  fr: {
    monthlyName:
      "Don mensuel",

    oneTimeName:
      "Don unique",

    monthlyWithFeeDescription:
      "Don mensuel incluant une contribution aux frais de transaction",

    oneTimeWithFeeDescription:
      "Don unique incluant une contribution aux frais de transaction",

    monthlyDescription:
      "Don mensuel à la campagne",

    oneTimeDescription:
      "Don unique à la campagne",
  },

  de: {
    monthlyName:
      "Monatliche Spende",

    oneTimeName:
      "Einmalige Spende",

    monthlyWithFeeDescription:
      "Monatliche Spende einschließlich eines Beitrags zu den Transaktionskosten",

    oneTimeWithFeeDescription:
      "Einmalige Spende einschließlich eines Beitrags zu den Transaktionskosten",

    monthlyDescription:
      "Monatliche Kampagnenspende",

    oneTimeDescription:
      "Einmalige Kampagnenspende",
  },

  es: {
    monthlyName:
      "Donación mensual",

    oneTimeName:
      "Donación única",

    monthlyWithFeeDescription:
      "Donación mensual que incluye una contribución a los gastos de transacción",

    oneTimeWithFeeDescription:
      "Donación única que incluye una contribución a los gastos de transacción",

    monthlyDescription:
      "Donación mensual a la campaña",

    oneTimeDescription:
      "Donación única a la campaña",
  },
};

export async function POST(
  request: Request,
) {
  try {
    const body =
      (await request.json()) as CheckoutBody;

    const {
      campaignId,
      campaignSlug,
      amountCents,
      coverFee,
      frequency,
      locale,
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
    // VALIDATE CAMPAIGN SLUG
    // =========================================================

    if (
      !campaignSlug ||
      !/^[a-z0-9-]+$/.test(
        campaignSlug,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid campaign slug.",
        },
        {
          status: 400,
        },
      );
    }

    // =========================================================
    // PUBLIC CAMPAIGN PATH
    // =========================================================

    const campaignPath =
      getCampaignPublicPath(
        campaignSlug,
      );

    // =========================================================
    // LOCALE
    // =========================================================

    const siteLocale:
      Locale =
      isLocale(
        locale,
      )
        ? locale
        : "en";

    // Stripe Checkout không hỗ trợ Arabic.
    // Arabic trên website vẫn được giữ trong metadata.
    // Stripe riêng sẽ fallback sang English.

    const stripeLocale:
      StripeSupportedLocale =
      siteLocale === "ar"
        ? "en"
        : siteLocale;

    const stripeText =
      stripeProductTranslations[
        stripeLocale
      ];

    // =========================================================
    // VALIDATE DONATION AMOUNT
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
      !donor
        ?.firstName
        ?.trim() ||
      !donor
        ?.lastName
        ?.trim() ||
      !donor
        ?.email
        ?.trim()
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
    // EMAIL
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
    // TRANSACTION COST
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
    // METADATA
    // =========================================================

    const metadata = {
      campaign_id:
        campaignId,

      // DB slug
      campaign_slug:
        campaignSlug,

      // Public website path
      campaign_path:
        campaignPath,

      // Giữ locale website thật.
      // Arabic vẫn là "ar".
      locale:
        siteLocale,

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

      display_name:
        displayName,

      is_anonymous:
        donor.displayPublicly
          ? "false"
          : "true",
    };

    // =========================================================
    // PRODUCT NAME
    // =========================================================

    const productName =
      frequency ===
      "monthly"
        ? stripeText
            .monthlyName
        : stripeText
            .oneTimeName;

    // =========================================================
    // PRODUCT DESCRIPTION
    // =========================================================

    const productDescription =
      coverFee
        ? frequency ===
          "monthly"
          ? stripeText
              .monthlyWithFeeDescription
          : stripeText
              .oneTimeWithFeeDescription
        : frequency ===
          "monthly"
          ? stripeText
              .monthlyDescription
          : stripeText
              .oneTimeDescription;

    // =========================================================
    // CREATE STRIPE SESSION
    // =========================================================

    const session =
      await stripe.checkout.sessions.create(
        {
          mode:
            frequency ===
            "monthly"
              ? "subscription"
              : "payment",

          // =====================================
          // STRIPE LOCALE
          // =====================================

          locale:
            stripeLocale,

          // =====================================
          // CUSTOMER
          // =====================================

          customer_email:
            email,

          // =====================================
          // LINE ITEM
          // =====================================

          line_items: [
            {
              quantity: 1,

              price_data: {
                currency:
                  "usd",

                unit_amount:
                  totalAmountCents,

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

                product_data: {
                  name:
                    productName,

                  description:
                    productDescription,
                },
              },
            },
          ],

          // ===================================================
          // REDIRECT
          // ===================================================

          success_url:
            `${siteUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}`,

          // Quan trọng:
          // dùng campaignPath, không dùng campaignSlug
          cancel_url:
            `${siteUrl}${campaignPath}#donation-panel`,

          // ===================================================
          // METADATA
          // ===================================================

          metadata,

          // ===================================================
          // SUBSCRIPTION METADATA
          // ===================================================

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
    // VALIDATE SESSION URL
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
        url:
          session.url,

        sessionId:
          session.id,

        mode:
          frequency ===
          "monthly"
            ? "subscription"
            : "payment",
      },
    );
  } catch (
    error
  ) {
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
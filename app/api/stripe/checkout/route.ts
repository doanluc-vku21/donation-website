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

import {
  isCurrency,
  type Currency,
} from "@/lib/currency";

import {
  calculateFeeContribution,
  convertCurrencyMinorToUsd,
} from "@/lib/money";

import {
  getUsdToCurrencyRate,
} from "@/lib/exchange-rate";

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

  /**
   * LOCAL CURRENCY minor units.
   *
   * Example:
   * GBP 4000 = £40.00
   * EUR 5000 = €50.00
   */
  amountCents: number;

  currency: Currency;

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
      monthlyName: string;

      oneTimeName: string;

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
      currency,
      coverFee,
      frequency,
      locale,
      donor,
    } = body;

    // =======================================================
    // CAMPAIGN
    // =======================================================

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

    const campaignPath =
      getCampaignPublicPath(
        campaignSlug,
      );

    // =======================================================
    // LOCALE
    // =======================================================

    const siteLocale:
      Locale =
      isLocale(
        locale,
      )
        ? locale
        : "en";

    const stripeLocale:
      StripeSupportedLocale =
      siteLocale === "ar"
        ? "en"
        : siteLocale;

    const stripeText =
      stripeProductTranslations[
        stripeLocale
      ];

    // =======================================================
    // CURRENCY
    // =======================================================

    if (
      !isCurrency(
        currency,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid currency.",
        },
        {
          status: 400,
        },
      );
    }

    const siteCurrency:
      Currency =
      currency;

    /*
     * SERVER is source of truth for FX.
     * Never trust an exchange rate sent by the browser.
     *
     * 1 USD = exchangeRate local currency.
     */
    const exchangeRate =
      await getUsdToCurrencyRate(
        siteCurrency,
      );

    // =======================================================
    // AMOUNT
    // =======================================================

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

    // =======================================================
    // FREQUENCY
    // =======================================================

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

    // =======================================================
    // DONOR
    // =======================================================

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

    // =======================================================
    // LOCAL CHARGE AMOUNTS
    // =======================================================

    const feeAmountCents =
      coverFee
        ? calculateFeeContribution(
            amountCents,
            exchangeRate,
          )
        : 0;

    const totalAmountCents =
      amountCents +
      feeAmountCents;

    // =======================================================
    // NORMALIZED USD AMOUNTS
    //
    // Existing campaign stats/RPC expect amount_cents in USD.
    // =======================================================

    const normalizedDonationUsdCents =
      convertCurrencyMinorToUsd(
        amountCents,
        exchangeRate,
      );

    const normalizedFeeUsdCents =
      coverFee
        ? convertCurrencyMinorToUsd(
            feeAmountCents,
            exchangeRate,
          )
        : 0;

    const normalizedTotalUsdCents =
      normalizedDonationUsdCents +
      normalizedFeeUsdCents;

    if (
      normalizedDonationUsdCents <=
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Unable to normalize donation amount.",
        },
        {
          status: 400,
        },
      );
    }

    // =======================================================
    // URL
    // =======================================================

    const siteUrl =
      process.env
        .NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    // =======================================================
    // DISPLAY NAME
    // =======================================================

    const displayName =
      donor.displayPublicly
        ? `${donor.firstName.trim()} ${donor.lastName
            .trim()
            .charAt(0)}.`
        : "Anonymous";

    // =======================================================
    // METADATA
    // =======================================================

    const metadata = {
      campaign_id:
        campaignId,

      campaign_slug:
        campaignSlug,

      campaign_path:
        campaignPath,

      locale:
        siteLocale,

      charged_currency:
        siteCurrency,

      charged_donation_amount_cents:
        String(
          amountCents,
        ),

      charged_fee_amount_cents:
        String(
          feeAmountCents,
        ),

      charged_total_amount_cents:
        String(
          totalAmountCents,
        ),

      normalized_donation_usd_cents:
        String(
          normalizedDonationUsdCents,
        ),

      normalized_fee_usd_cents:
        String(
          normalizedFeeUsdCents,
        ),

      normalized_total_usd_cents:
        String(
          normalizedTotalUsdCents,
        ),

      usd_exchange_rate:
        String(
          exchangeRate,
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

    // =======================================================
    // PRODUCT
    // =======================================================

    const productName =
      frequency ===
      "monthly"
        ? stripeText
            .monthlyName
        : stripeText
            .oneTimeName;

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

    // =======================================================
    // CREATE CHECKOUT SESSION
    // =======================================================

    const session =
      await stripe.checkout.sessions.create(
        {
          ui_mode:
            "elements",

          mode:
            frequency ===
            "monthly"
              ? "subscription"
              : "payment",

          locale:
            stripeLocale,

          customer_email:
            email,

          line_items: [
            {
              quantity: 1,

              price_data: {
                currency:
                  siteCurrency.toLowerCase(),

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

          return_url:
            `${siteUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}`,

          metadata,

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

    if (
      !session.client_secret
    ) {
      throw new Error(
        "Checkout Session client secret was not created.",
      );
    }

    return NextResponse.json(
      {
        clientSecret:
          session.client_secret,

        sessionId:
          session.id,

        returnUrl:
          `${siteUrl}/thank-you?session_id=${session.id}`,

        mode:
          frequency ===
          "monthly"
            ? "subscription"
            : "payment",

        currency:
          siteCurrency,

        donationAmountMinor:
          amountCents,

        feeAmountMinor:
          feeAmountCents,

        totalAmountMinor:
          totalAmountCents,
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

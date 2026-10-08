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

type ExpressCheckoutBody = {
  campaignId:
    string;

  campaignSlug:
    string;

  amountCents:
    number;

  currency:
    Currency;

  coverFee:
    boolean;

  frequency:
    DonationFrequency;

  locale:
    Locale;

  displayPublicly:
    boolean;
};

type StripeSupportedLocale =
  | "en"
  | "fr"
  | "de"
  | "es";

function getCampaignPublicPath(
  campaignSlug:
    string,
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

const productTranslations:
  Record<
    StripeSupportedLocale,
    {
      oneTimeName:
        string;

      monthlyName:
        string;

      oneTimeDescription:
        string;

      monthlyDescription:
        string;

      oneTimeDescriptionWithFee:
        string;

      monthlyDescriptionWithFee:
        string;
    }
  > = {
  en: {
    oneTimeName:
      "One-time donation",

    monthlyName:
      "Monthly donation",

    oneTimeDescription:
      "One-time campaign donation",

    monthlyDescription:
      "Monthly campaign donation",

    oneTimeDescriptionWithFee:
      "One-time donation including transaction cost contribution",

    monthlyDescriptionWithFee:
      "Monthly donation including transaction cost contribution",
  },

  fr: {
    oneTimeName:
      "Don unique",

    monthlyName:
      "Don mensuel",

    oneTimeDescription:
      "Don unique à la campagne",

    monthlyDescription:
      "Don mensuel à la campagne",

    oneTimeDescriptionWithFee:
      "Don unique incluant une contribution aux frais de transaction",

    monthlyDescriptionWithFee:
      "Don mensuel incluant une contribution aux frais de transaction",
  },

  de: {
    oneTimeName:
      "Einmalige Spende",

    monthlyName:
      "Monatliche Spende",

    oneTimeDescription:
      "Einmalige Kampagnenspende",

    monthlyDescription:
      "Monatliche Kampagnenspende",

    oneTimeDescriptionWithFee:
      "Einmalige Spende einschließlich eines Beitrags zu den Transaktionskosten",

    monthlyDescriptionWithFee:
      "Monatliche Spende einschließlich eines Beitrags zu den Transaktionskosten",
  },

  es: {
    oneTimeName:
      "Donación única",

    monthlyName:
      "Donación mensual",

    oneTimeDescription:
      "Donación única a la campaña",

    monthlyDescription:
      "Donación mensual a la campaña",

    oneTimeDescriptionWithFee:
      "Donación única que incluye una contribución a los gastos de transacción",

    monthlyDescriptionWithFee:
      "Donación mensual que incluye una contribución a los gastos de transacción",
  },
};

export async function POST(
  request:
    Request,
) {
  try {
    const body =
      (await request.json()) as ExpressCheckoutBody;

    const {
      campaignId,
      campaignSlug,
      amountCents,
      currency,
      coverFee,
      frequency,
      locale,
      displayPublicly,
    } = body;

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

    if (
      !Number.isInteger(
        amountCents,
      ) ||
      amountCents <
        100
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

    const siteLocale:
      Locale =
      isLocale(
        locale,
      )
        ? locale
        : "en";

    const stripeLocale:
      StripeSupportedLocale =
      siteLocale ===
      "ar"
        ? "en"
        : siteLocale;

    const siteCurrency:
      Currency =
      currency;

    const exchangeRate =
      await getUsdToCurrencyRate(
        siteCurrency,
      );

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

    const campaignPath =
      getCampaignPublicPath(
        campaignSlug,
      );

    const siteUrl =
      process.env
        .NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    const stripeText =
      productTranslations[
        stripeLocale
      ];

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
              .monthlyDescriptionWithFee
          : stripeText
              .oneTimeDescriptionWithFee
        : frequency ===
          "monthly"
          ? stripeText
              .monthlyDescription
          : stripeText
              .oneTimeDescription;

    /*
     * Express Checkout does not require donor name/email
     * before creating the Session.
     *
     * Wallets provide customer details during checkout.
     * The webhook already falls back to session.customer_details.
     */
    const metadata = {
      checkout_source:
        "express_amount_step",

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
        "",

      donor_last_name:
        "",

      donor_email:
        "",

      display_name:
        "",

      is_anonymous:
        displayPublicly
          ? "false"
          : "true",
    };

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

          /*
           * customer_creation is valid/useful for payment mode.
           * Subscription Checkout creates a Customer as part
           * of the subscription flow, so don't send it there.
           */
          ...(frequency ===
          "one_time"
            ? {
                customer_creation:
                  "always" as const,
              }
            : {}),

          line_items: [
            {
              quantity:
                1,

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
        "Express Checkout Session client secret was not created.",
      );
    }

    return NextResponse.json(
      {
        clientSecret:
          session.client_secret,

        sessionId:
          session.id,

        mode:
          frequency ===
          "monthly"
            ? "subscription"
            : "payment",

        frequency,

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
      "Express checkout session error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to create express checkout session.",
      },
      {
        status: 500,
      },
    );
  }
}

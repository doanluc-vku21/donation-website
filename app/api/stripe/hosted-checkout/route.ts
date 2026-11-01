import {
  NextResponse,
} from "next/server";
import { captureMetaRequest } from "@/lib/meta/server";
import { areDonorNamesOptional, isMonthlyOnlyDonationPage } from "@/lib/donation-page-policy";
import { saveDonationAttempt } from "@/lib/donation-attempt";
import { createHash } from "node:crypto";
import type Stripe from "stripe";

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

type HostedCheckoutBody = {
  campaignId:
    string;

  campaignSlug:
    string;

  campaignPath?:
    string;

  donationAttemptId?:
    string | null;

  prepareDonationAttempt?: boolean;
  checkoutRequestId?: string;

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

  donor: {
    firstName?:
      string;

    lastName?:
      string;

    email:
      string;

    displayPublicly:
      boolean;
  };
};

type StripeSupportedLocale =
  | "en"
  | "fr"
  | "de"
  | "es";

const DIRECT_CAMPAIGN_PATHS:
  Record<
    string,
    string
  > = {
  "akram-shake":
    "/akram-shake-1",

  "give-a-child-a-brighter-tomorrow":
    "/gaza-help",

  "child-health":
    "/child-health",
};

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

function buildPublicDisplayName(
  firstName:
    string,
  lastName:
    string,
) {
  const first =
    firstName.trim();

  const last =
    lastName.trim();

  if (!first) {
    return "Donor";
  }

  if (!last) {
    return first;
  }

  return `${first} ${last.charAt(0)}.`;
}

export async function POST(
  request:
    Request,
) {
  const startedAt = performance.now();
  const timings: string[] = [];
  const timed = async <T,>(name: string, operation: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try { return await operation(); }
    finally { timings.push(`${name};dur=${(performance.now() - start).toFixed(1)}`); }
  };
  const timingHeaders = () => {
    const value = [...timings, `total;dur=${(performance.now() - startedAt).toFixed(1)}`].join(", ");
    console.info("hosted_checkout_timing", value);
    return { "Server-Timing": value };
  };

  try {
    const body =
      (await request.json()) as HostedCheckoutBody;

    const {
      campaignId,
      campaignSlug,
      campaignPath:
        requestedCampaignPath,
      donationAttemptId,
      prepareDonationAttempt,
      checkoutRequestId,
      amountCents,
      currency,
      coverFee,
      frequency,
      locale,
      donor,
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

    /*
     * Direct pages use a second public URL only.
     * The underlying Supabase campaign slug remains unchanged.
     */
    const directPublicPath =
      DIRECT_CAMPAIGN_PATHS[
        campaignSlug
      ];


    const campaignPath =
      requestedCampaignPath ===
        directPublicPath
        ? requestedCampaignPath
        : directPublicPath;

    if (
      !directPublicPath
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid direct checkout campaign.",
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

    if (isMonthlyOnlyDonationPage(campaignPath) && frequency !== "monthly") {
      return NextResponse.json(
        { error: "This page accepts monthly donations only." },
        { status: 400 },
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

    const firstName =
      donor
        ?.firstName
        ?.trim() ??
      "";

    const lastName =
      donor
        ?.lastName
        ?.trim() ??
      "";

    const email =
      donor
        ?.email
        ?.trim()
        .toLowerCase() ??
      "";

    const namesOptional = areDonorNamesOptional(campaignPath, frequency);

    if (!email || (!namesOptional && (!firstName || !lastName))) {
      return NextResponse.json(
        {
          error:
            namesOptional ? "Please enter your email address." : "Please enter your name and email.",
        },
        {
          status: 400,
        },
      );
    }

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

    const displayPublicly =
      donor
        ?.displayPublicly ===
      true;

    if (checkoutRequestId !== undefined &&
        (typeof checkoutRequestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(checkoutRequestId))) {
      return NextResponse.json({ error: "Invalid checkout request ID." }, { status: 400 });
    }

    const displayName =
      displayPublicly
        ? buildPublicDisplayName(
            firstName,
            lastName,
          )
        : "Anonymous";

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

    const [rateResult, attemptResult] = await Promise.allSettled([
      timed("exchange_rate", () => getUsdToCurrencyRate(siteCurrency)),
      prepareDonationAttempt === true && campaignPath === "/akram-shake-1"
        ? timed("donation_attempt", () => saveDonationAttempt({
            campaignId, campaignSlug, campaignPath, amountCents, currency, frequency,
            email, firstName, lastName,
          }))
        : Promise.resolve(null),
    ]);

    // Finish persistence even if the independent rate lookup fails; returning
    // early could strand an in-flight database write in a serverless runtime.
    if (attemptResult.status === "rejected") throw attemptResult.reason;
    const attemptResponse = attemptResult.value;
    let resolvedAttemptId = donationAttemptId;
    if (attemptResponse) {
      if (!attemptResponse.ok) {
        attemptResponse.headers.set("Server-Timing", timingHeaders()["Server-Timing"]);
        return attemptResponse;
      }
      const attempt = await attemptResponse.json() as { attemptId?: string };
      if (!attempt.attemptId) throw new Error("Donation attempt ID was not returned.");
      resolvedAttemptId = attempt.attemptId;
    }
    if (rateResult.status === "rejected") throw rateResult.reason;
    const exchangeRate = rateResult.value;

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
     * IMPORTANT:
     * Keep these metadata keys aligned with the CURRENT
     * Stripe webhook, not the old commit.
     */
    const metadata = {
      ...captureMetaRequest(request),
      checkout_source:
        campaignSlug ===
        "akram-shake"
          ? "hosted_checkout_akram_shake_1"
          : campaignSlug ===
              "child-health"
            ? "hosted_checkout_child_health"
            : "hosted_checkout_gaza_help",

      campaign_id:
        campaignId,

      campaign_slug:
        campaignSlug,

      campaign_path:
        campaignPath,

      donation_attempt_id:
        resolvedAttemptId ??
        "",

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
        firstName,

      donor_last_name:
        lastName,

      donor_email:
        email,

      display_name:
        displayName,

      is_anonymous:
        displayPublicly
          ? "false"
          : "true",
    };

    const siteUrl =
      process.env
        .NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    /*
     * Hosted Checkout:
     * no ui_mode: "elements".
     * Stripe returns session.url and the frontend redirects there.
     */
    const sessionParameters: Stripe.Checkout.SessionCreateParams =
        {
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

          success_url:
            `${siteUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${siteUrl}${campaignPath}`,

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
        };

    // Keep an uncertain client/network retry on the same Stripe request. Hash
    // the complete payment parameters so changed amounts or metadata never
    // reuse an idempotency key for a different request. No donor text is put in
    // the key or diagnostic log.
    const idempotencyKey = campaignPath === "/akram-shake-1" && checkoutRequestId
      ? `hosted_${createHash("sha256").update(JSON.stringify([checkoutRequestId, sessionParameters])).digest("hex")}`
      : undefined;
    const session = await timed("stripe_session", () => stripe.checkout.sessions.create(
      sessionParameters, idempotencyKey ? { idempotencyKey } : undefined,
    ));

    if (!session.url) {
      throw new Error(
        "Stripe Checkout URL was not created.",
      );
    }

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
      { headers: timingHeaders() },
    );
  } catch (
    error
  ) {
    console.error(
      "Hosted Stripe checkout error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to create hosted checkout session.",
      },
      {
        status: 500,
        headers: timingHeaders(),
      },
    );
  }
}

import Link from "next/link";

import {
  Check,
  Heart,
  Mail,
  Share2,
  ShieldCheck,
} from "lucide-react";

import {
  MetaPixelPurchase,
} from "@/components/analytics/meta-pixel-purchase";

import {
  stripe,
} from "@/lib/stripe/server";

import {
  formatUsd,
} from "@/lib/money";

import {
  isLocale,
  type Locale,
} from "@/lib/i18n";

import {
  getThankYouTranslations,
} from "@/lib/thank-you-translations";

type ThankYouPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function ThankYouPage({
  searchParams,
}: ThankYouPageProps) {
  const params =
    await searchParams;

  const sessionId =
    params.session_id;

  // =========================================================
  // NO SESSION ID
  // =========================================================

  if (
    !sessionId
  ) {
    const locale:
      Locale = "en";

    const t =
      getThankYouTranslations(
        locale,
      );

    return (
      <main
        dir="ltr"
        className="
          grid
          min-h-screen
          place-items-center
          bg-[radial-gradient(circle_at_top,#dce9ff,transparent_36%),var(--page)]
          px-5
          py-12
        "
      >
        <section
          className="
            w-full
            max-w-xl
            rounded-[32px]
            border
            border-[var(--border)]
            bg-white
            p-7
            text-center
            shadow-[0_28px_90px_rgba(20,43,78,.13)]

            sm:p-11
          "
        >
          <h1
            className="
              text-3xl
              font-semibold
            "
          >
            {
              t.sessionNotFound
            }
          </h1>

          <p
            className="
              mt-4
              text-[var(--muted)]
            "
          >
            {
              t.sessionNotFoundText
            }
          </p>

          <Link
            href="/"
            className="
              mt-7
              inline-flex
              min-h-12
              items-center
              justify-center
              rounded-2xl
              bg-[var(--accent)]
              px-6
              font-semibold
              text-white
            "
          >
            {
              t.returnToCampaign
            }
          </Link>
        </section>
      </main>
    );
  }

  try {
    const session =
      await stripe.checkout.sessions.retrieve(
        sessionId,
      );

    // =========================================================
    // LOCALE + CAMPAIGN
    // =========================================================

    const metadataLocale =
      session.metadata
        ?.locale;

    const locale:
      Locale =
      isLocale(
        metadataLocale,
      )
        ? metadataLocale
        : "en";

    const t =
      getThankYouTranslations(
        locale,
      );

    const direction =
      locale === "ar"
        ? "rtl"
        : "ltr";

    const campaignSlug =
  session.metadata
    ?.campaign_slug ??
  "";

const campaignPath =
  session.metadata
    ?.campaign_path;

const campaignUrl =
  campaignPath ||
  (
    campaignSlug ===
    "give-a-child-a-brighter-tomorrow"
      ? "/gaza-food"
      : campaignSlug ===
          "akram-shake"
        ? "/akram-shake"
        : "/"
  );

    // =========================================================
    // PAYMENT DATA
    // =========================================================

    const amountTotal =
      session.amount_total ??
      0;

    const donationAmount =
      Number(
        session.metadata
          ?.donation_amount_cents ??
          amountTotal,
      );

    const feeAmount =
      Number(
        session.metadata
          ?.fee_amount_cents ??
          0,
      );

    const email =
      session
        .customer_details
        ?.email ??
      session
        .customer_email ??
      session
        .metadata
        ?.donor_email ??
      "";

    const paymentSucceeded =
      session.payment_status ===
      "paid";

    const displayName =
      session.metadata
        ?.display_name ??
      "";

    const frequency =
      session.metadata
        ?.frequency ??
      "one_time";

    const currency =
      session.currency ??
      "usd";

    return (
      <>
        {/* =================================================
            META PURCHASE
        ================================================== */}

        {paymentSucceeded && (
          <MetaPixelPurchase
            sessionId={
              session.id
            }
            value={
              amountTotal /
              100
            }
            currency={
              currency
            }
            frequency={
              frequency
            }
          />
        )}

        {/* =================================================
            PAGE
        ================================================== */}

        <main
          dir="ltr"
          className="
            grid
            min-h-screen
            place-items-center
            bg-[radial-gradient(circle_at_top,#dce9ff,transparent_36%),var(--page)]
            px-5
            py-12
          "
        >
          <section
            dir={
              direction
            }
            className="
              w-full
              max-w-xl
              rounded-[32px]
              border
              border-[var(--border)]
              bg-white
              p-7
              text-center
              shadow-[0_28px_90px_rgba(20,43,78,.13)]

              sm:p-11
            "
          >
            <span
              className="
                mx-auto
                grid
                size-16
                place-items-center
                rounded-full
                bg-[var(--success-soft)]
                text-[var(--success)]
              "
            >
              <Check
                aria-hidden="true"
                className="size-8"
              />
            </span>

            <p
              className="
                mt-6
                text-xs
                font-bold
                uppercase
                tracking-[.18em]
                text-[var(--accent)]
              "
            >
              {
                t.paymentConfirmed
              }
            </p>

            <h1
              className="
                mt-3
                text-4xl
                font-semibold
                tracking-[-.04em]
              "
            >
              {t.thankYou}

              {displayName &&
              displayName !==
                "Anonymous"
                ? `, ${displayName}`
                : ""}

              .
            </h1>

            <p
              className="
                mt-4
                text-lg
                leading-8
                text-[var(--muted)]
              "
            >
              {
                t.successMessage
              }
            </p>

            {/* =============================================
                DONATION SUMMARY
            ============================================== */}

            <div
              className="
                mt-7
                rounded-2xl
                bg-[var(--surface)]
                p-5
              "
            >
              <p
                className="
                  text-sm
                  text-[var(--muted)]
                "
              >
                {
                  t.yourDonation
                }
              </p>

              <p
                dir="ltr"
                className="
                  mt-1
                  text-3xl
                  font-semibold
                "
              >
                {formatUsd(
                  donationAmount,
                )}
              </p>

              {feeAmount >
                0 && (
                <div
                  className="
                    mt-4
                    border-t
                    border-[var(--border)]
                    pt-4
                    text-sm
                  "
                >
                  <SummaryRow
                    label={
                      t.donation
                    }
                    value={
                      formatUsd(
                        donationAmount,
                      )
                    }
                  />

                  <div className="mt-2">
                    <SummaryRow
                      label={
                        t.transactionCost
                      }
                      value={
                        formatUsd(
                          feeAmount,
                        )
                      }
                    />
                  </div>

                  <div className="mt-3">
                    <SummaryRow
                      label={
                        t.totalPaid
                      }
                      value={
                        formatUsd(
                          amountTotal,
                        )
                      }
                      strong
                    />
                  </div>
                </div>
              )}

              <div
                className="
                  mt-4
                  flex
                  items-center
                  justify-center
                  gap-2
                  text-sm
                  text-[var(--muted)]
                "
              >
                <ShieldCheck
                  aria-hidden="true"
                  className="
                    size-4
                    text-[var(--success)]
                  "
                />

                {paymentSucceeded
                  ? t.paymentSuccessful
                  : `${t.paymentStatus}: ${session.payment_status}`}
              </div>

              {email && (
                <p
                  className="
                    mt-3
                    inline-flex
                    items-center
                    gap-2
                    text-sm
                    text-[var(--muted)]
                  "
                >
                  <Mail
                    aria-hidden="true"
                    className="size-4"
                  />

                  {
                    t.confirmationSent
                  }{" "}

                  <strong
                    dir="ltr"
                    className="
                      font-medium
                      text-[var(--ink)]
                    "
                  >
                    {email}
                  </strong>
                </p>
              )}
            </div>

            {/* =============================================
                INFO
            ============================================== */}

            <div
              className="
                mt-5
                rounded-2xl
                border
                border-[var(--border)]
                px-4
                py-3
                text-sm
              "
            >
              <InfoRow
                label={
                  t.donationType
                }
                value={
                  frequency ===
                  "monthly"
                    ? t.monthly
                    : t.oneTime
                }
              />

              <div className="mt-2">
                <InfoRow
                  label={
                    t.paymentStatus
                  }
                  value={
                    session.payment_status
                  }
                  success={
                    paymentSucceeded
                  }
                />
              </div>

              <div className="mt-2">
                <InfoRow
                  label={
                    t.currency
                  }
                  value={
                    currency.toUpperCase()
                  }
                  ltrValue
                />
              </div>
            </div>

            {/* =============================================
                ACTIONS
            ============================================== */}

            <div
              dir="ltr"
              className="
                mt-7
                grid
                gap-3

                sm:grid-cols-2
              "
            >
              <Link
                href={`${campaignUrl}#donation-panel`}
                className="
                  flex
                  min-h-12
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  bg-[var(--accent)]
                  px-5
                  font-semibold
                  text-white
                  transition

                  hover:bg-[var(--accent-dark)]
                "
              >
                <Heart
                  aria-hidden="true"
                  className="
                    size-4
                    fill-current
                  "
                />

                <span
                  dir={
                    direction
                  }
                >
                  {
                    t.donateAgain
                  }
                </span>
              </Link>

              <Link
                href={`${campaignUrl}#top`}
                className="
                  flex
                  min-h-12
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  border
                  border-[var(--border)]
                  px-5
                  font-semibold
                  transition

                  hover:border-[var(--accent)]
                  hover:text-[var(--accent)]
                "
              >
                <Share2
                  aria-hidden="true"
                  className="size-4"
                />

                <span
                  dir={
                    direction
                  }
                >
                  {
                    t.shareCampaign
                  }
                </span>
              </Link>
            </div>

            <p
              className="
                mt-6
                text-xs
                leading-5
                text-[var(--muted)]
              "
            >
              {
                t.securePayment
              }
            </p>
          </section>
        </main>
      </>
    );
  } catch (
    error
  ) {
    console.error(
      "Unable to retrieve Stripe session:",
      error,
    );

    const locale:
      Locale = "en";

    const t =
      getThankYouTranslations(
        locale,
      );

    return (
      <main
        className="
          grid
          min-h-screen
          place-items-center
          bg-[radial-gradient(circle_at_top,#dce9ff,transparent_36%),var(--page)]
          px-5
          py-12
        "
      >
        <section
          className="
            w-full
            max-w-xl
            rounded-[32px]
            border
            border-[var(--border)]
            bg-white
            p-7
            text-center
            shadow-[0_28px_90px_rgba(20,43,78,.13)]

            sm:p-11
          "
        >
          <h1
            className="
              text-3xl
              font-semibold
            "
          >
            {
              t.verifyError
            }
          </h1>

          <p
            className="
              mt-4
              leading-7
              text-[var(--muted)]
            "
          >
            {
              t.verifyErrorText
            }
          </p>

          <Link
            href="/"
            className="
              mt-7
              inline-flex
              min-h-12
              items-center
              justify-center
              rounded-2xl
              bg-[var(--accent)]
              px-6
              font-semibold
              text-white
            "
          >
            {
              t.returnToCampaign
            }
          </Link>
        </section>
      </main>
    );
  }
}

// =========================================================
// SUMMARY ROW
// =========================================================

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;

  value: string;

  strong?: boolean;
}) {
  return (
    <div
      className="
        flex
        justify-between
        gap-4
      "
    >
      <span
        className={
          strong
            ? "font-semibold text-[var(--ink)]"
            : "text-[var(--muted)]"
        }
      >
        {label}
      </span>

      <span
        dir="ltr"
        className={
          strong
            ? "font-semibold text-[var(--ink)]"
            : "text-[var(--muted)]"
        }
      >
        {value}
      </span>
    </div>
  );
}

// =========================================================
// INFO ROW
// =========================================================

function InfoRow({
  label,
  value,
  success = false,
  ltrValue = false,
}: {
  label: string;

  value: string;

  success?: boolean;

  ltrValue?: boolean;
}) {
  return (
    <div
      className="
        flex
        justify-between
        gap-4
      "
    >
      <span
        className="
          text-[var(--muted)]
        "
      >
        {label}
      </span>

      <strong
        dir={
          ltrValue
            ? "ltr"
            : undefined
        }
        className={
          success
            ? "text-[var(--success)]"
            : ""
        }
      >
        {value}
      </strong>
    </div>
  );
}
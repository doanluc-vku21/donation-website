"use client";

import Image from "next/image";

import {
  Heart,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import type {
  Campaign,
  DonationFrequency,
} from "@/lib/sample-data";

import type {
  Locale,
} from "@/lib/i18n";

import {
  getUiTranslations,
} from "@/lib/ui-translations";

import type {
  SanityCampaign,
} from "@/sanity/types/campaign";

import {
  DonationFlow,
  type ExpressPrefetch,
  type ExpressPrefetchResult,
} from "./donation-flow";

import type {
  Currency,
} from "@/lib/currency";

import {
  convertUsdToCurrencyMinor,
} from "@/lib/money";

type DonationStep =
  | "amount"
  | "donor"
  | "payment";

type DonationModalProps = {
  campaign: Campaign;
  content: SanityCampaign;
  locale: Locale;

  currency: Currency;
  exchangeRate: number;

  triggerClassName?: string;
  triggerLabel?: string;

  showHeart?: boolean;
};

/*
 * Shared across every DonationModal on the page.
 *
 * The campaign page can render more than one Donate button
 * (desktop card, mobile hero, sticky bar). This Map prevents
 * those buttons from creating duplicate prefetch requests for
 * the same Stripe Checkout Session configuration.
 */
const expressPrefetchCache =
  new Map<
    string,
    Promise<ExpressPrefetchResult>
  >();

function buildExpressKey({
  campaignId,
  frequency,
  amount,
  currency,
  locale,
}: {
  campaignId:
    string;

  frequency:
    DonationFrequency;

  amount:
    number;

  currency:
    Currency;

  locale:
    Locale;
}) {
  return [
    campaignId,
    frequency,
    amount,
    currency,
    "no-fee",
    "public",
    locale,
  ].join(
    ":",
  );
}

function getOrCreateExpressPrefetch({
  campaignId,
  campaignSlug,
  frequency,
  amount,
  currency,
  locale,
}: {
  campaignId:
    string;

  campaignSlug:
    string;

  frequency:
    DonationFrequency;

  amount:
    number;

  currency:
    Currency;

  locale:
    Locale;
}): ExpressPrefetch {
  const key =
    buildExpressKey({
      campaignId,
      frequency,
      amount,
      currency,
      locale,
    });

  let promise =
    expressPrefetchCache.get(
      key,
    );

  if (!promise) {
    promise =
      fetch(
        "/api/stripe/express-checkout",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              {
                campaignId,

                campaignSlug,

                amountCents:
                  amount,

                currency,

                coverFee:
                  false,

                frequency,

                locale,

                displayPublicly:
                  true,
              },
            ),
        },
      )
        .then(
          async (
            response,
          ) => {
            const data =
              await response.json();

            if (
              !response.ok ||
              !data.clientSecret ||
              !data.sessionId
            ) {
              throw new Error(
                data.error ??
                  "Unable to prefetch express checkout.",
              );
            }

            return {
              clientSecret:
                data.clientSecret as string,

              sessionId:
                data.sessionId as string,
            };
          },
        )
        .catch(
          (
            error,
          ) => {
            /*
             * Remove failed entries so a later interaction
             * can retry instead of keeping a rejected Promise.
             */
            expressPrefetchCache.delete(
              key,
            );

            throw error;
          },
        );

    expressPrefetchCache.set(
      key,
      promise,
    );
  }

  return {
    key,
    promise,
  };
}

export function DonationModal({
  campaign,
  content,
  locale,
  currency,
  exchangeRate,
  triggerClassName = "",
  triggerLabel,
  showHeart = true,
}: DonationModalProps) {
  const t =
    getUiTranslations(
      locale,
    );

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    step,
    setStep,
  ] =
    useState<DonationStep>(
      "amount",
    );

  const [
    prefetchedExpress,
    setPrefetchedExpress,
  ] =
    useState<
      Partial<
        Record<
          DonationFrequency,
          ExpressPrefetch
        >
      >
    >({});

  const defaultDonationOptionUsd =
    campaign.donationOptions.find(
      (
        option,
      ) =>
        option.featured,
    )?.amountUsd ??
    campaign.donationOptions[0]
      ?.amountUsd ??
    1000;

  const defaultAmount =
    convertUsdToCurrencyMinor(
      defaultDonationOptionUsd,
      exchangeRate,
    );

  const heroUrl =
    content.heroImage
      ?.asset?.url;

  const heroWidth =
    content.heroImage
      ?.asset
      ?.metadata
      ?.dimensions
      ?.width ?? 1200;

  const heroHeight =
    content.heroImage
      ?.asset
      ?.metadata
      ?.dimensions
      ?.height ?? 760;

  const organizationName =
    content.organizationName ||
    campaign.organizationName;

  function prefetchExpressCheckout() {
    const oneTime =
      getOrCreateExpressPrefetch(
        {
          campaignId:
            campaign.id,

          campaignSlug:
            campaign.slug,

          frequency:
            "one_time",

          amount:
            defaultAmount,

          currency,

          locale,
        },
      );

    const monthly =
      getOrCreateExpressPrefetch(
        {
          campaignId:
            campaign.id,

          campaignSlug:
            campaign.slug,

          frequency:
            "monthly",

          amount:
            defaultAmount,

          currency,

          locale,
        },
      );

    setPrefetchedExpress(
      (
        current,
      ) => {
        if (
          current
            .one_time
            ?.key ===
            oneTime.key &&
          current
            .monthly
            ?.key ===
            monthly.key
        ) {
          return current;
        }

        return {
          one_time:
            oneTime,

          monthly,
        };
      },
    );
  }

  /*
   * Warm both Give once and Monthly shortly after the page is
   * interactive. By the time the donor clicks Donate, Stripe
   * usually already has the client_secret ready.
   *
   * Every visible Donate button shares the module-level cache,
   * so the same campaign configuration only sends one request
   * per frequency.
   */
  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          prefetchExpressCheckout();
        },
        120,
      );

    return () => {
      window.clearTimeout(
        timeout,
      );
    };
  }, [
    campaign.id,
    campaign.slug,
    currency,
    defaultAmount,
    locale,
  ]);

  function openModal() {
    /*
     * Also warm on the actual interaction in case the user
     * clicks before the short background prefetch fires.
     */
    prefetchExpressCheckout();

    setStep(
      "amount",
    );

    setOpen(
      true,
    );
  }

  function closeModal() {
    setOpen(
      false,
    );

    window.setTimeout(
      () => {
        setStep(
          "amount",
        );
      },
      150,
    );
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const oldOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow = "hidden";

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        closeModal();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style
        .overflow =
        oldOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onPointerEnter={
          prefetchExpressCheckout
        }
        onPointerDown={
          prefetchExpressCheckout
        }
        onFocus={
          prefetchExpressCheckout
        }
        onClick={
          openModal
        }
        className={
          triggerClassName
        }
      >
        {showHeart && (
          <Heart
            aria-hidden="true"
            className="size-[18px]"
          />
        )}

        {triggerLabel ??
          t.donate}
      </button>

      <div
        aria-hidden={
          !open
        }
        className={`
          fixed
          inset-0
          z-[300]
          flex
          items-end
          justify-center
          bg-[#10233f]/45
          backdrop-blur-[3px]
          transition-opacity
          duration-150

          sm:items-center
          sm:p-4

          ${
            open
              ? "visible pointer-events-auto opacity-100"
              : "invisible pointer-events-none opacity-0"
          }
        `}
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <section
            dir={
              locale ===
              "ar"
                ? "rtl"
                : "ltr"
            }
            role="dialog"
            aria-modal={
              open
            }
            aria-labelledby="donation-modal-title"
            className="
              w-full
              max-h-[calc(100dvh-12px)]
              overflow-hidden
              rounded-t-[30px]
              bg-[#fffdfb]
              shadow-[0_-20px_60px_rgba(0,0,0,.22)]

              sm:min-h-0
              sm:max-h-[90vh]
              sm:max-w-[520px]
              sm:rounded-[28px]
              sm:shadow-[0_24px_80px_rgba(0,0,0,.24)]
            "
          >
            <div
              className="
                flex
                max-h-[calc(100dvh-12px)]
                min-h-0
                flex-col
                overflow-y-auto
                overscroll-contain
                px-4
                pb-[max(88px,calc(env(safe-area-inset-bottom)+72px))]
                pt-5
                [-webkit-overflow-scrolling:touch]

                sm:max-h-[90vh]
                sm:px-6
                sm:pb-8
                sm:pt-6
              "
            >
              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-3
                "
              >
                <div
                  className="
                    min-w-0
                  "
                >
                  <h2
                    id="donation-modal-title"
                    className="
                      text-[23px]
                      font-bold
                      leading-[1.1]
                      tracking-[-0.03em]
                      text-[#12233d]
                    "
                  >
                    {
                      t.makeYourDonation
                    }
                  </h2>

                  {step ===
                    "amount" && (
                    <p
                      className="
                        mt-1
                        text-[13px]
                        leading-5
                        text-[#6f7a86]
                      "
                    >
                      {
                        t.everyGiftWorks
                      }
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  aria-label={
                    t.closeDonationForm
                  }
                  onClick={
                    closeModal
                  }
                  className="
                    grid
                    size-9
                    shrink-0
                    place-items-center
                    rounded-full
                    bg-[#f7f4f1]
                    text-[#5f6975]
                    transition

                    hover:bg-[#efebe7]
                    hover:text-[#12233d]
                  "
                >
                  <X
                    aria-hidden="true"
                    className="size-[18px]"
                  />
                </button>
              </div>

              <div
                className={`
                  flex
                  items-center
                  gap-2.5
                  rounded-[14px]
                  bg-[#faf6f3]

                  ${
                    step ===
                    "amount"
                      ? "mt-5 p-2.5"
                      : "mt-4 p-2.5"
                  }
                `}
              >
                <div
                  className={`
                    shrink-0
                    overflow-hidden
                    rounded-[10px]
                    bg-[#eceee9]

                    ${
                      step ===
                      "amount"
                        ? "h-[58px] w-[58px]"
                        : "h-[50px] w-[50px]"
                    }
                  `}
                >
                  {heroUrl ? (
                    <Image
                      src={
                        heroUrl
                      }
                      alt={
                        content
                          .heroImage
                          ?.alt ||
                        content.title
                      }
                      width={
                        heroWidth
                      }
                      height={
                        heroHeight
                      }
                      className="
                        h-full
                        w-full
                        object-cover
                      "
                    />
                  ) : (
                    <div
                      className="
                        h-full
                        w-full
                        bg-[#24543d]
                      "
                    />
                  )}
                </div>

                <div
                  className="
                    min-w-0
                    flex-1
                  "
                >
                  <p
                    className={`
                      line-clamp-2
                      font-semibold
                      leading-[1.25]
                      text-[#12233d]

                      ${
                        step ===
                        "amount"
                          ? "text-[13px]"
                          : "text-[12px]"
                      }
                    `}
                  >
                    {
                      content.title
                    }
                  </p>

                  <p
                    className="
                      mt-0.5
                      truncate
                      text-[10px]
                      text-[#7a817d]
                    "
                  >
                    {
                      t.organizedBy
                    }{" "}
                    {
                      organizationName
                    }
                  </p>
                </div>
              </div>

              <div
                className={
                  step ===
                  "amount"
                    ? "mt-5"
                    : "mt-4"
                }
              >
                <DonationFlow
                  campaign={
                    campaign
                  }
                  locale={
                    locale
                  }
                  currency={
                    currency
                  }
                  exchangeRate={
                    exchangeRate
                  }
                  prefetchedExpress={
                    prefetchedExpress
                  }
                  embedded
                  onStepChange={(
                    nextStep,
                  ) => {
                    setStep(
                      nextStep,
                    );
                  }}
                />
              </div>
            </div>
          </section>
      </div>
    </>
  );
}

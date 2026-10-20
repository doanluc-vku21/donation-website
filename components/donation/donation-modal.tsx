"use client";

import Image from "next/image";

import {
  usePathname,
} from "next/navigation";

import {
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

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

import {
  DONATION_MODAL_OPEN_EVENT,
} from "./donation-modal-events";

type DonationStep =
  | "amount"
  | "one_time_offer"
  | "donor"
  | "payment";

type DonationModalProps = {
  campaign: Campaign;
  content: SanityCampaign;
  locale: Locale;

  currency: Currency;
  exchangeRate: number;
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
  campaignPath,
  frequency,
  amount,
  currency,
  locale,
}: {
  campaignId:
    string;

  campaignPath:
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
    campaignPath,
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
  campaignPath,
  frequency,
  amount,
  currency,
  locale,
}: {
  campaignId:
    string;

  campaignSlug:
    string;

  campaignPath:
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
      campaignPath,
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

                campaignPath,

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
}: DonationModalProps) {
  const t =
    getUiTranslations(
      locale,
    );

  const pathname =
    usePathname();

  const disableExpressPrefetch =
    pathname ===
      "/akram-shake-1" ||
    pathname ===
      "/gaza-help" ||
    pathname ===
      "/child-health";

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    mounted,
    setMounted,
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

  const monthlyDonationOptions =
    campaign.donationOptions.filter(
      (
        option,
      ) =>
        option.frequency ===
        "monthly",
    );

  const defaultDonationOptions =
    monthlyDonationOptions.length >
    0
      ? monthlyDonationOptions
      : campaign.donationOptions;

  const defaultDonationOptionUsd =
    defaultDonationOptions.find(
      (
        option,
      ) =>
        option.featured,
    )?.amountUsd ??
    defaultDonationOptions[0]
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
    if (
      disableExpressPrefetch
    ) {
      return;
    }

    const monthly =
      getOrCreateExpressPrefetch(
        {
          campaignId:
            campaign.id,

          campaignSlug:
            campaign.slug,

          campaignPath:
            pathname,

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
            .monthly
            ?.key ===
            monthly.key
        ) {
          return current;
        }

        return {
          ...current,

          monthly,
        };
      },
    );
  }

  /*
   * Warm only the default Monthly Express Checkout session.
   *
   * There is now exactly one DonationModal / DonationFlow on
   * the campaign page. This avoids creating multiple Stripe
   * Elements trees for the same campaign.
   *
   * Give once is created only when the donor switches to it.
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
    disableExpressPrefetch,
    locale,
    pathname,
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
    setMounted(
      true,
    );
  }, []);

  useEffect(() => {
    function handleOpenDonationModal() {
      openModal();
    }

    window.addEventListener(
      DONATION_MODAL_OPEN_EVENT,
      handleOpenDonationModal,
    );

    return () => {
      window.removeEventListener(
        DONATION_MODAL_OPEN_EVENT,
        handleOpenDonationModal,
      );
    };
  });

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
      {mounted &&
        createPortal(
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
                pb-[max(20px,env(safe-area-inset-bottom))]
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
                {open && (
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
                )}
              </div>
            </div>
          </section>
      </div>,
          document.body,
        )}
    </>
  );
}

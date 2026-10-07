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
} from "./donation-flow";

import type {
  Currency,
} from "@/lib/currency";

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

  function openModal() {
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

      {open && (
        <div
          className="
            fixed
            inset-0
            z-[300]
            flex
            items-end
            justify-center
            bg-[#10233f]/45
            backdrop-blur-[3px]

            sm:items-center
            sm:p-4
          "
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
            aria-modal="true"
            aria-labelledby="donation-modal-title"
            className="
              w-full
              min-h-[640px]
              max-h-[94dvh]
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
                min-h-[640px]
                flex-col
                px-4
                pb-[max(20px,env(safe-area-inset-bottom))]
                pt-5

                sm:min-h-0
                sm:px-6
                sm:pb-6
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
      )}
    </>
  );
}
"use client";

import Image from "next/image";

import {
  BadgeCheck,
} from "lucide-react";

import {
  DonationModalTrigger,
} from "@/components/donation/donation-modal-trigger";
import { MonthlySupporterProgress } from "@/components/campaign/monthly-supporter-progress";
import { RotatingDonationHint } from "@/components/campaign/recent-donation-rotation";

import {
  ShareMenu,
} from "@/components/share/share-menu";

import type {
  Campaign,
} from "@/lib/sample-data";

import type {
  Locale,
} from "@/lib/i18n";

import type {
  Currency,
} from "@/lib/currency";

import {
  getUiTranslations,
} from "@/lib/ui-translations";

import type {
  SanityCampaign,
} from "@/sanity/types/campaign";

import {
  convertUsdToCurrencyMinor,
  formatMoney,
  progressPercent,
} from "@/lib/money";

type MobileCampaignHeroProps = {
  showOrganizationCharityStatus?: boolean;
  showOrganizationVerification?: boolean;
  campaign: Campaign;
  content: SanityCampaign;
  locale: Locale;
  currency: Currency;
  exchangeRate: number;
};

export function MobileCampaignHero({
  campaign,
  content,
  locale,
  currency,
  exchangeRate,
  showOrganizationCharityStatus = false,
  showOrganizationVerification = true,
}: MobileCampaignHeroProps) {
  const t =
    getUiTranslations(
      locale,
    );

  const textDirection =
    locale === "ar"
      ? "rtl"
      : "ltr";

  const progress =
    progressPercent(
      campaign.raisedAmountUsd,
      campaign.goalAmountUsd,
    );

  const raisedAmount =
    convertUsdToCurrencyMinor(
      campaign.raisedAmountUsd,
      exchangeRate,
    );

  const goalAmount =
    convertUsdToCurrencyMinor(
      campaign.goalAmountUsd,
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
      ?.height ?? 1000;

  const logoUrl =
    content.organizationLogo
      ?.asset?.url;

  const logoWidth =
    content.organizationLogo
      ?.asset
      ?.metadata
      ?.dimensions
      ?.width ?? 100;

  const logoHeight =
    content.organizationLogo
      ?.asset
      ?.metadata
      ?.dimensions
      ?.height ?? 100;

  const organizationName =
    content.organizationName ||
    campaign.organizationName;

  const verificationBadge = showOrganizationVerification ? (
    <span className="inline-flex shrink-0 items-center justify-center text-[#5aa2ff]">
      <BadgeCheck aria-hidden="true" className={showOrganizationCharityStatus
        ? "size-3 fill-[#2f7df4] text-white min-[380px]:size-3.5 sm:size-4"
        : "size-4 fill-[#2f7df4] text-white"} />
    </span>
  ) : null;

  const organizationBadge = (
    <div
      className={showOrganizationCharityStatus
        ? "absolute left-3 right-[156px] top-4 z-10 min-[380px]:left-4 min-[380px]:right-[148px] sm:right-[248px]"
        : "absolute left-4 right-[168px] top-4 z-10"}
    >
      <div
        dir="ltr"
        className={`
          inline-flex
          max-w-full
          items-center
          ${showOrganizationCharityStatus ? "gap-1 sm:gap-2" : "gap-2"}
          rounded-full
          border
          border-white/15
          bg-black/30
          py-1
          pl-1
          pr-2.5
          text-white
          shadow-[0_4px_18px_rgba(0,0,0,.18)]
          backdrop-blur-md
        `}
      >
        <span
          className={`
            grid
            ${showOrganizationCharityStatus ? "size-6 min-[380px]:size-7 sm:size-[34px]" : "size-[34px]"}
            shrink-0
            place-items-center
            overflow-hidden
            rounded-full
            border
            border-white/70
            bg-white
            shadow-sm
          `}
        >
          {logoUrl ? (
            <Image
              src={
                logoUrl
              }
              alt={
                organizationName
              }
              width={
                logoWidth
              }
              sizes="34px"
              height={
                logoHeight
              }
              className="
                h-full
                w-full
                object-contain
                p-[2px]
              "
            />
          ) : (
            <Image
              src="/sample-logo.svg"
              alt={
                organizationName
              }
              width={40}
              height={40}
              className="
                h-full
                w-full
                object-contain
                p-[2px]
              "
            />
          )}
        </span>

        <span className={showOrganizationCharityStatus ? "min-w-0 sm:py-1" : "min-w-0"}>
          <span dir="ltr" className={showOrganizationCharityStatus ? "flex items-center gap-1 sm:gap-1.5" : "block"}>
            <span
              className={showOrganizationCharityStatus
                ? "block whitespace-normal break-words text-[9px] font-semibold leading-[14px] tracking-[-0.01em] text-white min-[380px]:text-[11px] sm:text-[12px] sm:leading-4"
                : "block min-w-0 max-w-[108px] truncate text-[12px] font-semibold leading-none tracking-[-0.01em] text-white"}
            >
              {organizationName}
            </span>
            {showOrganizationCharityStatus && verificationBadge}
          </span>
          {showOrganizationCharityStatus && (
            <span dir={textDirection} className="mt-0.5 block text-[8px] font-normal leading-[10px] text-white/85 sm:mt-1 sm:text-[10px] sm:leading-[14px]">
              {t.organizationCharityStatus}
            </span>
          )}
        </span>

        {!showOrganizationCharityStatus && verificationBadge}
      </div>
    </div>
  );

  return (
    <div
      dir="ltr"
      className="
        -mx-5
        -mt-7

        lg:hidden
      "
    >
      <section
        className="
          relative
          min-h-[435px]
          overflow-hidden
          bg-[#1e281d]
        "
      >
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={
              content.heroImage
                ?.alt ||
              content.title
            }
            width={heroWidth}
            height={heroHeight}
            priority
            fetchPriority="high"
            sizes="(min-width: 1024px) 686px, 100vw"
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
            "
          />
        ) : (
          <Image
            src="/sample-campaign-hero.svg"
            alt={
              content.title
            }
            width={1200}
            height={1000}
            priority
            fetchPriority="high"
            sizes="(min-width: 1024px) 686px, 100vw"
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
            "
          />
        )}

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-b
            from-black/30
            via-black/5
            to-black/75
          "
        />

        {organizationBadge}

        <div
          className="
            absolute
            bottom-12
            left-5
            right-5
            z-10
          "
        >
          <h1
            dir={
              textDirection
            }
            className={`
              max-w-[370px]
              text-[27px]
              font-extrabold
              leading-[1.08]
              tracking-[-0.035em]
              text-white
              drop-shadow-[0_2px_4px_rgba(0,0,0,.45)]

              ${
                locale === "ar"
                  ? "ml-auto text-right"
                  : "text-left"
              }
            `}
          >
            {
              content.title
            }
          </h1>
        </div>

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-[1px]
            left-1/2
            z-20
            h-[30px]
            w-[120%]
            -translate-x-1/2
            rounded-[50%_50%_0_0/100%_100%_0_0]
            bg-white
          "
        />
      </section>

      <section
        id="mobile-inline-donate"
        dir="ltr"
        className="
          relative
          z-20
          -mt-[1px]
          rounded-b-[20px]
          border-x
          border-b
          border-[#e6e9e4]
          bg-white
          px-5
          pb-3
          pt-3
          shadow-[0_5px_18px_rgba(0,0,0,.04)]
        "
      >
        {campaign.supporterProgress ? (
          <MonthlySupporterProgress progress={campaign.supporterProgress} locale={locale} />
        ) : (
        <div
          className="
            flex
            items-center
            gap-4
          "
        >
          <div
            className="
              grid
              size-[64px]
              shrink-0
              place-items-center
              rounded-full
            "
            style={{
              background: `conic-gradient(
                #73c840 ${Math.min(
                  progress,
                  100,
                )}%,
                #edf1e8 0
              )`,
            }}
          >
            <div
              className="
                grid
                size-[46px]
                place-items-center
                rounded-full
                bg-white
              "
            >
              <strong
                dir="ltr"
                className="
                  text-[14px]
                  font-bold
                  text-[#15233a]
                "
              >
                {progress}%
              </strong>
            </div>
          </div>

          <div
            dir={
              textDirection
            }
            className="
              min-w-0
              flex-1
            "
          >
            <p
              className="
                text-[19px]
                font-bold
                leading-tight
                tracking-[-0.025em]
                text-[#182136]
              "
            >
              <span
                dir="ltr"
                className="inline-block"
              >
                {formatMoney(
                  raisedAmount,
                  currency,
                  locale,
                )}
              </span>{" "}

              {t.raised}{" "}

              <span
                className="
                  font-normal
                  text-[#727e91]
                "
              >
                {t.of}{" "}

                <span
                  dir="ltr"
                  className="
                    inline-block
                    underline
                    underline-offset-2
                  "
                >
                  {formatMoney(
                    goalAmount,
                    currency,
                    locale,
                    {
                      hideZeroDecimals:
                        true,
                    },
                  )}
                </span>
              </span>
            </p>

            <RotatingDonationHint
              donations={campaign.recentDonations}
              locale={locale}
              currency={currency}
              exchangeRate={exchangeRate}
              className="mt-1 text-[12px] text-[#687489]"
              showArrow
            />
          </div>
        </div>

        )}

        <div className="mt-3">
          <DonationModalTrigger
            locale={
              locale
            }
            className="
              flex
              min-h-[50px]
              w-full
              items-center
              justify-center
              gap-2
              rounded-full
              bg-[#bcf778]
              px-5
              text-[17px]
              font-semibold
              text-[#194e29]
              shadow-[0_4px_12px_rgba(100,170,50,.13)]
              transition

              hover:bg-[#afe96e]
              active:scale-[0.99]
            "
          />
        </div>

        <div
          className="
            mt-1
            flex
            justify-center
          "
        >
          <ShareMenu
            title={
              content.title
            }
            locale={
              locale
            }
            triggerVariant="inline"
          />
        </div>
      </section>
    </div>
  );
}

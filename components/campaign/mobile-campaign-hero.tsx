"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Check,
  Heart,
  Share2,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  Campaign,
} from "@/lib/sample-data";

import type {
  SanityCampaign,
} from "@/sanity/types/campaign";

import {
  formatUsd,
  progressPercent,
} from "@/lib/money";

type MobileCampaignHeroProps = {
  campaign: Campaign;
  content: SanityCampaign;
};

export function MobileCampaignHero({
  campaign,
  content,
}: MobileCampaignHeroProps) {
  const [copied, setCopied] =
    useState(false);

  const progress =
    progressPercent(
      campaign.raisedAmountUsd,
      campaign.goalAmountUsd,
    );

  const latestDonation =
    campaign.recentDonations?.[0];

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

  async function handleShare() {
    const url =
      window.location.href;

    try {
      if (
        typeof navigator.share ===
        "function"
      ) {
        await navigator.share({
          title:
            campaign.title,
          text:
            campaign.title,
          url,
        });

        return;
      }

      await navigator.clipboard.writeText(
        url,
      );

      setCopied(true);

      window.setTimeout(
        () => {
          setCopied(false);
        },
        1800,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name ===
          "AbortError"
      ) {
        return;
      }

      console.error(
        error,
      );
    }
  }

  return (
    <div
      className="
        -mx-5
        -mt-7

        lg:hidden
      "
    >
      {/* ==========================================
          HERO IMAGE
      =========================================== */}

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
            alt={content.title}
            width={1200}
            height={1000}
            priority
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
            "
          />
        )}

        {/* DARK GRADIENT */}

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-b
            from-black/25
            via-black/5
            to-black/70
          "
        />

        {/* ORGANIZATION */}

        <div
          className="
            absolute
            left-5
            right-5
            top-5
            z-10
            flex
            items-center
            gap-2.5
            text-white
          "
        >
          <span
            className="
              grid
              size-9
              shrink-0
              place-items-center
              overflow-hidden
              rounded-full
              border-2
              border-white
              bg-white
            "
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={
                  content.organizationName ||
                  campaign.organizationName
                }
                width={logoWidth}
                height={logoHeight}
                className="
                  h-full
                  w-full
                  object-contain
                "
              />
            ) : (
              <Image
                src="/sample-logo.svg"
                alt={
                  campaign.organizationName
                }
                width={40}
                height={40}
                className="
                  h-full
                  w-full
                  object-contain
                "
              />
            )}
          </span>

          <strong
            className="
              text-[13px]
              font-semibold
              drop-shadow
            "
          >
            {content.organizationName ||
              campaign.organizationName}
          </strong>

          <span
            className="
              grid
              size-[15px]
              place-items-center
              rounded-full
              bg-[#2879f4]
              text-[9px]
              font-bold
              text-white
            "
          >
            ✓
          </span>
        </div>

        {/* TITLE */}

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
            className="
              max-w-[370px]
              text-[27px]
              font-extrabold
              leading-[1.08]
              tracking-[-0.035em]
              text-white
              drop-shadow-[0_2px_4px_rgba(0,0,0,.45)]
            "
          >
            {content.title}
          </h1>
        </div>
        {/* CURVED WHITE BOTTOM */}
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

      {/* ==========================================
          INLINE DONATION PANEL
      =========================================== */}

      <section
  id="mobile-inline-donate"
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
        {/* MONEY */}

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
                className="
                  text-[14px]
                  font-bold
                "
              >
                {progress}%
              </strong>
            </div>
          </div>

          <div
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
              {formatUsd(
                campaign.raisedAmountUsd,
              )}{" "}
              raised{" "}
              <span
                className="
                  font-normal
                  text-[#727e91]
                "
              >
                of{" "}
                <span
                  className="
                    underline
                    underline-offset-2
                  "
                >
                  {formatUsd(
                    campaign.goalAmountUsd,
                  ).replace(
                    ".00",
                    "",
                  )}
                </span>
              </span>
            </p>

            {latestDonation && (
              <p
                className="
                  mt-1
                  truncate
                  text-[12px]
                  text-[#687489]
                "
              >
                {
                  latestDonation.displayName
                }{" "}
                donated{" "}
                {formatUsd(
                  latestDonation.amountUsd,
                ).replace(
                  ".00",
                  "",
                )}{" "}
                ›
              </p>
            )}
          </div>
        </div>

        {/* DONATE */}

        <Link
          href="/gaza-food/donate"
          className="
            mt-3
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
          "
        >
          <Heart
            aria-hidden="true"
            className="size-[18px]"
          />

          Donate
        </Link>

        {/* SHARE */}

        <button
          type="button"
          onClick={handleShare}
          className="
            mx-auto
            mt-1
            flex
            min-h-[38px]
            items-center
            justify-center
            gap-2
            px-4
            text-[13px]
            font-medium
            text-[#44536a]
          "
        >
          {copied ? (
            <Check
              aria-hidden="true"
              className="size-4"
            />
          ) : (
            <Share2
              aria-hidden="true"
              className="size-4"
            />
          )}

          {copied
            ? "Copied"
            : "Share"}
        </button>
      </section>
    </div>
  );
}
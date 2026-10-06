"use client";

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
  formatUsd,
  progressPercent,
} from "@/lib/money";

import {
  ShareMenu,
} from "@/components/share/share-menu";

import {
  DonationModal,
} from "@/components/donation/donation-modal";

type MobileDonateBarProps = {
  campaign: Campaign;
  content: SanityCampaign;
  locale: Locale;
};

export function MobileDonateBar({
  campaign,
  content,
  locale,
}: MobileDonateBarProps) {
  const t =
    getUiTranslations(
      locale,
    );

  const textDirection =
    locale === "ar"
      ? "rtl"
      : "ltr";

  const [
    visible,
    setVisible,
  ] = useState(false);

  const progress =
    progressPercent(
      campaign.raisedAmountUsd,
      campaign.goalAmountUsd,
    );

  const latestDonation =
    campaign
      .recentDonations
      ?.[0];

  useEffect(() => {
    const target =
      document.getElementById(
        "mobile-inline-donate",
      );

    if (
      !target ||
      typeof IntersectionObserver ===
        "undefined"
    ) {
      return;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          const rect =
            entry
              .boundingClientRect;

          const passedAbove =
            !entry.isIntersecting &&
            rect.bottom <= 0;

          setVisible(
            passedAbove,
          );
        },
        {
          threshold: 0,
        },
      );

    observer.observe(
      target,
    );

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      dir="ltr"
      className="
        fixed
        inset-x-0
        bottom-0
        z-50
        px-2
        pb-[max(8px,env(safe-area-inset-bottom))]

        lg:hidden
      "
    >
      <section
        dir="ltr"
        className="
          mx-auto
          w-full
          max-w-[430px]
          rounded-[26px]
          border
          border-[#e8ece7]
          bg-white
          px-4
          pb-4
          pt-4
          shadow-[0_-8px_28px_rgba(15,30,40,0.14)]
        "
      >
        {/* =====================================
            PROGRESS
        ====================================== */}

        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          <ProgressCircle
            progress={
              progress
            }
          />

          <div
            dir={
              textDirection
            }
            className="
              min-w-0
              flex-1
            "
          >
            <RaisedText
              campaign={
                campaign
              }
              locale={
                locale
              }
            />

            {latestDonation && (
              <p
                className="
                  mt-1
                  truncate
                  text-[12px]
                  text-[#697387]
                "
              >
                <span
                  dir="ltr"
                  className="inline-block"
                >
                  {
                    latestDonation
                      .displayName
                  }
                </span>{" "}

                {t.donated}{" "}

                <span
                  dir="ltr"
                  className="inline-block"
                >
                  {formatUsd(
                    latestDonation
                      .amountUsd,
                  ).replace(
                    ".00",
                    "",
                  )}
                </span>{" "}

                ›
              </p>
            )}
          </div>
        </div>

        {/* =====================================
            ACTIONS
        ====================================== */}

        <div
          dir="ltr"
          className="
            mt-4
            grid
            grid-cols-2
            gap-3
          "
        >
          <DonationModal
            campaign={
              campaign
            }
            content={
              content
            }
            locale={
              locale
            }
            triggerClassName="
              flex
              min-h-[50px]
              w-full
              items-center
              justify-center
              gap-2
              rounded-full
              bg-[#bcf778]
              px-4
              text-[16px]
              font-bold
              text-[#194d29]
            "
          />

          <ShareMenu
            title={
              content.title
            }
            locale={
              locale
            }
            triggerVariant="solid"
          />
        </div>
      </section>
    </div>
  );
}

// =================================================
// PROGRESS CIRCLE
// =================================================

function ProgressCircle({
  progress,
}: {
  progress: number;
}) {
  return (
    <div
      dir="ltr"
      className="
        grid
        size-[62px]
        shrink-0
        place-items-center
        rounded-full
      "
      style={{
        background: `conic-gradient(
          #74c943 ${Math.min(
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
          size-[49px]
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
            text-[#162034]
          "
        >
          {progress}%
        </strong>
      </div>
    </div>
  );
}

// =================================================
// RAISED TEXT
// =================================================

function RaisedText({
  campaign,
  locale,
}: {
  campaign: Campaign;
  locale: Locale;
}) {
  const t =
    getUiTranslations(
      locale,
    );

  const textDirection =
    locale === "ar"
      ? "rtl"
      : "ltr";

  return (
    <p
      dir={
        textDirection
      }
      className="
        truncate
        text-[17px]
        font-bold
        leading-tight
        tracking-[-0.02em]
        text-[#172033]
      "
    >
      <span
        dir="ltr"
        className="inline-block"
      >
        {formatUsd(
          campaign
            .raisedAmountUsd,
        )}
      </span>{" "}

      {t.raised}{" "}

      <span
        className="
          font-normal
          text-[#758092]
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
          {formatUsd(
            campaign
              .goalAmountUsd,
          ).replace(
            ".00",
            "",
          )}
        </span>
      </span>
    </p>
  );
}
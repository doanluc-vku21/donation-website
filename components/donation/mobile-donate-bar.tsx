"use client";

import Link from "next/link";

import {
  Heart,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import type {
  Campaign,
} from "@/lib/sample-data";

import {
  formatUsd,
  progressPercent,
} from "@/lib/money";

import {
  ShareMenu,
} from "@/components/share/share-menu";

type MobileDonateBarProps = {
  campaign: Campaign;
};

export function MobileDonateBar({
  campaign,
}: MobileDonateBarProps) {
  const [visible, setVisible] =
    useState(false);

  const progress =
    progressPercent(
      campaign.raisedAmountUsd,
      campaign.goalAmountUsd,
    );

  const latestDonation =
    campaign.recentDonations?.[0];

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
            entry.boundingClientRect;

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

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
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
        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          <ProgressCircle
            progress={progress}
          />

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <RaisedText
              campaign={campaign}
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

        <div
          className="
            mt-4
            grid
            grid-cols-2
            gap-3
          "
        >
          <Link
            href="/gaza-food/donate"
            className="
              flex
              min-h-[50px]
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
          >
            <Heart
              aria-hidden="true"
              className="size-[17px]"
            />

            Donate
          </Link>

          <ShareMenu
            title={
              campaign.title
            }
            triggerVariant="solid"
          />
        </div>
      </section>
    </div>
  );
}

function ProgressCircle({
  progress,
}: {
  progress: number;
}) {
  return (
    <div
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

function RaisedText({
  campaign,
}: {
  campaign: Campaign;
}) {
  return (
    <p
      className="
        truncate
        text-[17px]
        font-bold
        leading-tight
        tracking-[-0.02em]
        text-[#172033]
      "
    >
      {formatUsd(
        campaign.raisedAmountUsd,
      )}{" "}
      raised{" "}
      <span
        className="
          font-normal
          text-[#758092]
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
  );
}
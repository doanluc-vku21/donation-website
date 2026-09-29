import Link from "next/link";

import {
  Heart,
  LockKeyhole,
} from "lucide-react";

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

type CampaignDonateCardProps = {
  campaign: Campaign;
  donateHref: string;
};

export function CampaignDonateCard({
  campaign,
  donateHref,
}: CampaignDonateCardProps) {
  const progress =
    progressPercent(
      campaign.raisedAmountUsd,
      campaign.goalAmountUsd,
    );

  const latestDonation =
    campaign.recentDonations?.[0];

  return (
    <section
      className="
        w-full
        rounded-[24px]
        border
        border-[#d9e0e7]
        bg-white
        p-6
        shadow-[0_18px_50px_rgba(15,35,60,0.08)]
      "
    >
      {/* ================================
          PROGRESS INFO
      ================================= */}

      <div className="flex items-start gap-4">
        <div
          className="
            relative
            grid
            size-[64px]
            shrink-0
            place-items-center
            rounded-full
          "
          style={{
            background: `conic-gradient(
              #b8f06a ${Math.min(
                progress,
                100,
              )}%,
              #edf1e9 0
            )`,
          }}
        >
          <div
            className="
              grid
              size-[50px]
              place-items-center
              rounded-full
              bg-white
            "
          >
            <strong
              className="
                text-[15px]
                font-bold
                text-[#18263b]
              "
            >
              {progress}%
            </strong>
          </div>
        </div>

        <div className="min-w-0 pt-1">
          <p
            className="
              text-[18px]
              font-bold
              leading-[1.25]
              tracking-[-0.02em]
              text-[#162338]
            "
          >
            {formatUsd(
              campaign.raisedAmountUsd,
            )}{" "}
            raised{" "}
            <span className="font-normal text-[#6e7a8b]">
              of
            </span>
          </p>

          <p
            className="
              mt-1
              text-[16px]
              text-[#647187]
              underline
              decoration-[#aab3bf]
              underline-offset-2
            "
          >
            {formatUsd(
              campaign.goalAmountUsd,
            ).replace(
              ".00",
              "",
            )}
          </p>

          {latestDonation && (
            <p
              className="
                mt-2
                line-clamp-1
                text-[12px]
                text-[#6b7687]
              "
            >
              {latestDonation.displayName} donated{" "}
              {formatUsd(
                latestDonation.amountUsd,
              ).replace(
                ".00",
                "",
              )}
            </p>
          )}
        </div>
      </div>

      {/* ================================
          DONATE BUTTON
      ================================= */}

      <Link
        href={donateHref}
        className="
          mt-6
          flex
          min-h-[52px]
          w-full
          items-center
          justify-center
          gap-2
          rounded-full
          bg-[#bdf676]
          px-5
          text-[17px]
          font-semibold
          text-[#18421d]
          shadow-[0_5px_14px_rgba(114,184,44,0.17)]
          transition

          hover:bg-[#b0ed67]

          focus-visible:outline
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-[#287a33]
        "
      >
        <Heart
          aria-hidden="true"
          className="size-[18px]"
        />

        Donate
      </Link>

      {/* ================================
          SHARE
      ================================= */}

      <div
        className="
          mt-3
          flex
          justify-center
        "
      >
        <ShareMenu />
      </div>

      {/* ================================
          STRIPE SECURE TEXT
      ================================= */}

      <div
        className="
          mt-5
          flex
          items-center
          justify-center
          gap-2
          border-t
          border-[#edf0f3]
          pt-5
          text-center
          text-[12px]
          text-[#798597]
        "
      >
        <LockKeyhole
          aria-hidden="true"
          className="size-4"
        />

        <span>
          Secure payment through Stripe
        </span>
      </div>
    </section>
  );
}
import {
  LockKeyhole,
} from "lucide-react";

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
  convertUsdToCurrencyMinor,
  formatMoney,
  progressPercent,
} from "@/lib/money";

import type {
  Currency,
} from "@/lib/currency";

import {
  ShareMenu,
} from "@/components/share/share-menu";

import {
  DonationModal,
} from "@/components/donation/donation-modal";

type CampaignDonateCardProps = {
  campaign: Campaign;
  content: SanityCampaign;
  locale: Locale;
  currency: Currency;
  exchangeRate: number;
};

export function CampaignDonateCard({
  campaign,
  content,
  locale,
  currency,
  exchangeRate,
}: CampaignDonateCardProps) {
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

  const latestDonation =
    campaign
      .recentDonations
      ?.[0];

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

  const latestDonationAmount =
    latestDonation
      ? convertUsdToCurrencyMinor(
          latestDonation.amountUsd,
          exchangeRate,
        )
      : 0;

  return (
    <section
      dir="ltr"
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
      <div
        className="
          flex
          items-start
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
              dir="ltr"
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

        <div
          dir={
            textDirection
          }
          className="
            min-w-0
            flex-1
            pt-1
          "
        >
          <p
            className="
              text-[18px]
              font-bold
              leading-[1.25]
              tracking-[-0.02em]
              text-[#162338]
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
                text-[#6e7a8b]
              "
            >
              {t.of}
            </span>
          </p>

          <p
            dir="ltr"
            className="
              mt-1
              inline-block
              text-[16px]
              text-[#647187]
              underline
              decoration-[#aab3bf]
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
              {
                latestDonation
                  .displayName
              }{" "}

              {t.donated}{" "}

              <span
                dir="ltr"
                className="inline-block"
              >
                {formatMoney(
                  latestDonationAmount,
                  currency,
                  locale,
                  {
                    hideZeroDecimals:
                      true,
                  },
                )}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
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
          currency={
            currency
          }
          exchangeRate={
            exchangeRate
          }
          triggerClassName="
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
            active:scale-[0.99]
          "
        />
      </div>

      <div
        className="
          mt-3
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
        />
      </div>

      <div
        dir="ltr"
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
          className="
            size-4
            shrink-0
          "
        />

        <span
          dir={
            textDirection
          }
        >
          {
            t.securePaymentThroughStripe
          }
        </span>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";

import {
  ArrowLeft,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

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
  DonationFlow,
} from "./donation-flow";

type DonatePageProps = {
  campaign: Campaign;
  content: SanityCampaign;
  locale: Locale;
  currency: Currency;
  exchangeRate: number;
};

export function DonatePage({
  campaign,
  content,
  locale,
  currency,
  exchangeRate,
}: DonatePageProps) {
  const t =
    getUiTranslations(
      locale,
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

  const heroAlt =
    content.heroImage
      ?.alt ||
    content.title ||
    campaign.title;

  const organizationName =
    content.organizationName ||
    campaign.organizationName;

  const backHref =
    campaign.slug ===
    "akram-shake"
      ? "/akram-shake"
      : "/gaza-food";

  const direction =
    locale === "ar"
      ? "rtl"
      : "ltr";

  return (
    <main
      dir={direction}
      className="
        min-h-screen
        bg-[#fbfcf8]
        px-4
        py-6
        text-[#131313]

        sm:px-6
        sm:py-8
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[540px]
        "
      >
        <div>
          <Link
            href={
              backHref
            }
            className="
              inline-flex
              min-h-10
              items-center
              gap-2
              text-sm
              font-medium
              text-[#55705f]
              transition

              hover:text-[#183d2a]
            "
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4"
            />

            {t.back}
          </Link>
        </div>

        <header
          className="
            mt-4
          "
        >
          <h1
            className="
              text-[24px]
              font-bold
              leading-[1.15]
              tracking-[-0.025em]
              text-[#151515]

              sm:text-[28px]
            "
          >
            {t.makeYourDonation}
          </h1>

          <p
            className="
              mt-1
              text-[13px]
              leading-5
              text-[#6d776f]
            "
          >
            {t.everyGiftWorks}
          </p>
        </header>

        <section
          className="
            mt-5
            flex
            items-center
            gap-3
            rounded-[18px]
            border
            border-[#e7e9e5]
            bg-[#f8f6f2]
            p-3
          "
        >
          <div
            className="
              relative
              h-[66px]
              w-[66px]
              shrink-0
              overflow-hidden
              rounded-[12px]
              bg-[#eceee9]
            "
          >
            {heroUrl ? (
              <Image
                src={
                  heroUrl
                }
                alt={
                  heroAlt
                }
                width={
                  heroWidth
                }
                height={
                  heroHeight
                }
                priority
                className="
                  h-full
                  w-full
                  object-cover
                "
              />
            ) : (
              <div
                className="
                  grid
                  h-full
                  w-full
                  place-items-center
                  bg-[#24543d]
                  px-2
                  text-center
                  text-[10px]
                  font-bold
                  text-white
                "
              >
                Donation
              </div>
            )}
          </div>

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <h2
              className="
                line-clamp-2
                text-[14px]
                font-semibold
                leading-[1.35]
                text-[#151515]

                sm:text-[15px]
              "
            >
              {
                content.title
              }
            </h2>

            <p
              className="
                mt-1
                truncate
                text-[11px]
                leading-4
                text-[#777f78]
              "
            >
              {
                t.organizedBy
              }{" "}

              <span
                className="
                  font-medium
                  text-[#566159]
                "
              >
                {
                  organizationName
                }
              </span>
            </p>
          </div>
        </section>

        <div className="mt-4">
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
          />
        </div>

        <footer
          className="
            mt-5
            pb-8
            text-center
          "
        >
          <div
            className="
              flex
              flex-wrap
              items-center
              justify-center
              gap-x-5
              gap-y-2
              text-[12px]
              text-[#52645b]
            "
          >
            <span
              className="
                inline-flex
                items-center
                gap-1.5
              "
            >
              <LockKeyhole
                aria-hidden="true"
                className="
                  size-3.5
                  text-[#176d50]
                "
              />

              {
                t.securePaymentByStripe
              }
            </span>

            <span
              className="
                inline-flex
                items-center
                gap-1.5
              "
            >
              <ShieldCheck
                aria-hidden="true"
                className="
                  size-3.5
                  text-[#176d50]
                "
              />

              {
                t.paymentProcessedStripe
              }
            </span>
          </div>

          <p
            className="
              mt-3
              text-[11px]
              leading-5
              text-[#6d7c75]
            "
          >
            {
              organizationName
            }
          </p>
        </footer>
      </div>
    </main>
  );
}

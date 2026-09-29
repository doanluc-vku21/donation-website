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
  SanityCampaign,
} from "@/sanity/types/campaign";

import {
  DonationFlow,
} from "./donation-flow";

type DonatePageProps = {
  campaign: Campaign;
  content: SanityCampaign;
};

export function DonatePage({
  campaign,
  content,
}: DonatePageProps) {
  const logoUrl =
    content.organizationLogo
      ?.asset?.url;

  const logoWidth =
    content.organizationLogo
      ?.asset
      ?.metadata
      ?.dimensions
      ?.width ?? 120;

  const logoHeight =
    content.organizationLogo
      ?.asset
      ?.metadata
      ?.dimensions
      ?.height ?? 80;

  const logoAlt =
    content.organizationLogo
      ?.alt ||
    content.organizationName ||
    campaign.organizationName ||
    "Organization logo";

  return (
    <main
      className="
        min-h-screen
        bg-[#fbfcf8]
        px-4
        py-8
        text-[#131313]

        sm:px-6
        sm:py-10
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[540px]
        "
      >
        {/* ============================================
            BACK
        ============================================= */}

        <div>
          <Link
            href="/gaza-food"
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

            Back to campaign
          </Link>
        </div>

        {/* ============================================
            HEADER
        ============================================= */}

        <header
          className="
            mt-5
            text-center
          "
        >
          {/* LOGO */}

          <div
            className="
              flex
              justify-center
            "
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={logoAlt}
                width={logoWidth}
                height={logoHeight}
                priority
                className="
                  h-auto
                  max-h-[56px]
                  w-auto
                  max-w-[190px]
                  object-contain
                "
              />
            ) : (
              <Image
                src="/sample-logo.svg"
                alt={logoAlt}
                width={140}
                height={56}
                priority
                className="
                  h-auto
                  max-h-[56px]
                  w-auto
                  object-contain
                "
              />
            )}
          </div>

          {/* TITLE */}

          <h1
            className="
              mx-auto
              mt-7
              max-w-[500px]
              text-[30px]
              font-extrabold
              leading-[1.08]
              tracking-[-0.035em]
              text-[#161616]

              sm:text-[36px]
            "
          >
            {content.title}
          </h1>
        </header>

        {/* ============================================
            DONATION FLOW
        ============================================= */}

        <div className="mt-8">
          <DonationFlow
            campaign={campaign}
          />
        </div>

        {/* ============================================
            TRUST AREA
        ============================================= */}

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

              Secure payment by Stripe
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

              Secure donation
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
            {content.organizationName ||
              campaign.organizationName}
          </p>
        </footer>
      </div>
    </main>
  );
}
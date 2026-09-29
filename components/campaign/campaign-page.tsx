import Image from "next/image";

import {
  Sparkles,
} from "lucide-react";

import type {
  Campaign,
} from "@/lib/sample-data";

import type {
  SanityCampaign,
} from "@/sanity/types/campaign";

import {
  ProgressCard,
} from "./progress-card";

import {
  CampaignStory,
} from "./campaign-story";

import {
  RecentDonations,
} from "./recent-donations";

import {
  SiteFooter,
} from "./site-footer";

import {
  MobileStoryToggle,
} from "./mobile-story-toggle";

import {
  MobileDonateBar,
} from "@/components/donation/mobile-donate-bar";

import {
  ShareMenu,
} from "@/components/share/share-menu";

import {
  CampaignDonateCard,
} from "./campaign-donate-card";
import {
  MobileCampaignHero,
} from "./mobile-campaign-hero";

export function CampaignPage({
  campaign,
  content,
}: {
  campaign: Campaign;
  content: SanityCampaign;
}) {
  // ===========================================================
  // ORGANIZATION LOGO
  // ===========================================================

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

  const logoAlt =
    content.organizationLogo
      ?.alt ||
    content.organizationName ||
    campaign.organizationName ||
    "Organization logo";

  // ===========================================================
  // HERO IMAGE
  // ===========================================================

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

  return (
    <main
  className="
    min-h-screen
    w-full
    overflow-x-hidden
    bg-white

    pb-[140px]
    lg:pb-0
  "
>
      <div
        className="
          mx-auto
          grid
          w-full
          min-w-0
          max-w-[1120px]
          gap-8
          px-5
          py-7

          lg:grid-cols-[minmax(0,1fr)_330px]
          lg:items-start
          lg:gap-x-10
          lg:gap-y-10
          lg:px-8
          lg:py-10
        "
      >
        {/* =====================================================
            LEFT COLUMN
        ====================================================== */}
        <MobileCampaignHero
  campaign={{
    ...campaign,

    goalAmountUsd:
      content.goalAmount != null
        ? Math.round(
            content.goalAmount * 100,
          )
        : campaign.goalAmountUsd,
  }}
  content={content}
/>
        <div
          className="
            w-full
            min-w-0
          "
        >
          {/* ===================================================
              TITLE
          ==================================================== */}

          <section
  id="top"
  className="
    hidden
    w-full
    min-w-0

    lg:block
  "
>
            {content.eyebrow && (
              <p
                className="
                  mb-4
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-[#f5f7f2]
                  px-3
                  py-2
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.14em]
                  text-[#376341]

                  lg:hidden
                "
              >
                <Sparkles
                  aria-hidden="true"
                  className="size-3.5"
                />

                {content.eyebrow}
              </p>
            )}

            <h1
              className="
                max-w-[760px]
                break-words
                text-[34px]
                font-bold
                leading-[1.08]
                tracking-[-0.035em]
                text-[#101820]

                sm:text-[42px]

                lg:text-[48px]
              "
            >
              {content.title}
            </h1>

            {/* ===============================================
                ORGANIZER
            ================================================ */}

            <div
              className="
                mt-5
                flex
                items-center
                gap-3
              "
            >
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={logoAlt}
                  width={logoWidth}
                  height={logoHeight}
                  className="
                    size-8
                    shrink-0
                    object-contain
                  "
                />
              ) : (
                <Image
                  src="/sample-logo.svg"
                  alt={logoAlt}
                  width={32}
                  height={32}
                  className="
                    size-8
                    shrink-0
                    object-contain
                  "
                />
              )}

              <p
                className="
                  text-sm
                  text-[#687386]
                "
              >
                Organized by{" "}
                <strong
                  className="
                    font-semibold
                    text-[#182333]
                  "
                >
                  {content.organizationName ||
                    campaign.organizationName}
                </strong>
              </p>

              <div className="ml-auto lg:hidden">
                <ShareMenu />
              </div>
            </div>

            {/* ===============================================
                HERO
            ================================================ */}

            <figure
              className="
                relative
                mt-8
                overflow-hidden
                rounded-[18px]
                bg-[#eef1f3]
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
                    block
                    h-auto
                    w-full
                  "
                />
              ) : (
                <Image
                  src="/sample-campaign-hero.svg"
                  alt={content.title}
                  width={1200}
                  height={760}
                  priority
                  className="
                    block
                    h-auto
                    w-full
                  "
                />
              )}
            </figure>
          </section>

          {/* =================================================
              MOBILE PROGRESS
          ================================================== */}

          

          {/* =================================================
              MOBILE STORY
          ================================================== */}

          <div
            className="
              mt-7
              lg:hidden
            "
          >
            <MobileStoryToggle>
              <CampaignStory
                campaign={campaign}
                content={content}
              />
            </MobileStoryToggle>
          </div>

          {/* =================================================
              DESKTOP STORY
          ================================================== */}

          <div
            className="
              mt-8
              hidden

              lg:block
            "
          >
            <CampaignStory
              campaign={campaign}
              content={content}
            />

            <RecentDonations
              donations={
                campaign.recentDonations
              }
            />

            <SiteFooter
              content={content}
            />
          </div>

          {/* =================================================
              MOBILE RECENT
          ================================================== */}

          <div
            className="
              mt-7
              lg:hidden
            "
          >
            <RecentDonations
              donations={
                campaign.recentDonations
              }
            />
          </div>

          {/* =================================================
              MOBILE FOOTER
          ================================================== */}

          <div
            className="
              mt-8
              lg:hidden
            "
          >
            <SiteFooter
              content={content}
            />
          </div>
        </div>

        {/* =====================================================
            RIGHT COLUMN
        ====================================================== */}

        <aside
          className="
            hidden
            w-full
            min-w-0

            lg:block
          "
          aria-label="Donation summary"
        >
          <div
            className="
              sticky
              top-6
              w-full
            "
          >
            <CampaignDonateCard
              campaign={{
                ...campaign,

                goalAmountUsd:
                  content.goalAmount != null
                    ? Math.round(
                        content.goalAmount *
                          100,
                      )
                    : campaign.goalAmountUsd,
              }}
              donateHref="/gaza-food/donate"
            />
          </div>
        </aside>
      </div>

      <MobileDonateBar
  campaign={{
    ...campaign,

    goalAmountUsd:
      content.goalAmount != null
        ? Math.round(
            content.goalAmount *
              100,
          )
        : campaign.goalAmountUsd,
  }}
/>
    </main>
  );
}
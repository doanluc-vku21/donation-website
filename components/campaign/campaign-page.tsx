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
  DonationPanel,
} from "@/components/donation/donation-panel";

import {
  MobileDonateBar,
} from "@/components/donation/mobile-donate-bar";

import {
  ShareMenu,
} from "@/components/share/share-menu";

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
    <main className="min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_12%_5%,rgba(226,235,251,.9),transparent_28%),var(--page)]">
      <div
        className="
          mx-auto
          grid
          w-full
          min-w-0
          max-w-[1400px]
          gap-10
          px-5
          py-6

          lg:grid-cols-[minmax(0,3fr)_minmax(380px,2fr)]
          lg:items-start
          lg:gap-x-16
          lg:gap-y-12
          lg:px-10
          lg:py-8

          xl:px-16
        "
      >
        {/* =====================================================
            CAMPAIGN INTRO
        ====================================================== */}

        <div className="w-full min-w-0 max-w-full">
          <header className="flex min-w-0 items-center justify-between gap-3 sm:gap-5">
            <a
              href="#top"
              className="inline-flex min-w-0 items-center gap-3 rounded-lg"
            >
              {/* ===============================================
                  ORGANIZATION LOGO
              ================================================ */}

              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={logoAlt}
                  width={logoWidth}
                  height={logoHeight}
                  className="
                    size-11
                    shrink-0
                    object-contain
                  "
                />
              ) : (
                <Image
                  src="/sample-logo.svg"
                  alt={logoAlt}
                  width={46}
                  height={46}
                  className="
                    size-11
                    shrink-0
                    object-contain
                  "
                />
              )}

              <span className="min-w-0">
                <strong className="block truncate text-[17px] tracking-tight">
                  {content.organizationName ||
                    campaign.organizationName}
                </strong>

                <small className="block truncate text-xs text-[var(--muted)]">
                  Care, made tangible
                </small>
              </span>
            </a>

            <div className="shrink-0">
              <ShareMenu />
            </div>
          </header>

          <section
            id="top"
            className="w-full min-w-0 max-w-full pt-12 sm:pt-16"
          >
            {content.eyebrow && (
              <p className="inline-flex max-w-full items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-[.16em] text-[var(--accent)] shadow-sm">
                <Sparkles
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                />

                <span className="truncate">
                  {content.eyebrow}
                </span>
              </p>
            )}

            <h1
              className="
                mt-6
                max-w-full
                break-words
                text-[clamp(2.4rem,11vw,5.4rem)]
                font-semibold
                leading-[.98]
                tracking-[-.055em]

                sm:text-[clamp(2.6rem,8vw,5.4rem)]

                lg:max-w-3xl
                lg:text-[clamp(2.6rem,6vw,5.4rem)]
              "
            >
              {content.title}
            </h1>

            {content.summary && (
              <p className="mt-6 max-w-full text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8 lg:max-w-2xl">
                {content.summary}
              </p>
            )}

            <div className="mt-8 w-full min-w-0 max-w-full">
              <ProgressCard
                raisedAmountUsd={
                  campaign.raisedAmountUsd
                }
                goalAmountUsd={
                  content.goalAmount != null
                    ? Math.round(
                        content.goalAmount *
                          100,
                      )
                    : campaign.goalAmountUsd
                }
                donorCount={
                  campaign.donorCount
                }
              />
            </div>

            {/* =================================================
                HERO
            ================================================== */}

            <figure
              className="
                relative
                mt-8
                w-full
                min-w-0
                max-w-full
                overflow-hidden
                rounded-[24px]
                bg-[#173d76]
                shadow-[0_26px_80px_rgba(22,54,92,.15)]

                sm:rounded-[30px]
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
                  width={
                    heroWidth
                  }
                  height={
                    heroHeight
                  }
                  priority
                  className="block h-auto w-full max-w-full"
                />
              ) : (
                <Image
                  src="/sample-campaign-hero.svg"
                  alt={
                    content.title
                  }
                  width={1200}
                  height={760}
                  priority
                  className="block h-auto w-full max-w-full"
                />
              )}

              <figcaption
                className="
                  absolute
                  bottom-3
                  left-3
                  right-3
                  w-fit
                  max-w-[calc(100%-24px)]
                  rounded-full
                  bg-white/90
                  px-3
                  py-2
                  text-[11px]
                  font-semibold
                  leading-4
                  shadow-sm
                  backdrop-blur

                  sm:bottom-4
                  sm:left-4
                  sm:right-auto
                  sm:max-w-[calc(100%-32px)]
                  sm:px-4
                  sm:text-xs
                "
              >
                A little support can
                open a lifetime of
                possibility.
              </figcaption>
            </figure>
          </section>
        </div>

        {/* =====================================================
            RIGHT COLUMN
        ====================================================== */}

        <aside
          className="
            w-full
            min-w-0
            max-w-full

            lg:col-start-2
            lg:row-span-2
            lg:row-start-1
          "
          aria-label="Donation form"
        >
          <div className="w-full min-w-0 max-w-full lg:sticky lg:top-8">
            {/* ===============================================
                MOBILE STORY
            ================================================ */}

            <div className="mb-8 w-full min-w-0 max-w-full lg:hidden">
              <MobileStoryToggle>
                <CampaignStory
                  campaign={
                    campaign
                  }
                  content={
                    content
                  }
                />
              </MobileStoryToggle>
            </div>

            {/* ===============================================
                MOBILE RECENT DONATIONS
            ================================================ */}

            <div className="mb-7 w-full min-w-0 max-w-full overflow-hidden lg:hidden">
              <RecentDonations
                donations={
                  campaign.recentDonations
                }
                className="mt-0"
              />
            </div>

            {/* ===============================================
                DONATION PANEL
            ================================================ */}

            <div className="w-full min-w-0 max-w-full">
              <DonationPanel
                campaign={
                  campaign
                }
              />
            </div>
          </div>
        </aside>

        {/* =====================================================
            DESKTOP STORY
        ====================================================== */}

        <div
          className="
            hidden
            w-full
            min-w-0
            max-w-full

            lg:col-start-1
            lg:row-start-2
            lg:block
          "
        >
          <CampaignStory
            campaign={
              campaign
            }
            content={
              content
            }
          />

          <RecentDonations
            donations={
              campaign.recentDonations
            }
          />

          <SiteFooter
            content={
              content
            }
          />
        </div>

        {/* =====================================================
            MOBILE FOOTER
        ====================================================== */}

        <div className="w-full min-w-0 lg:hidden">
          <SiteFooter
            content={
              content
            }
          />
        </div>
      </div>

      <MobileDonateBar />
    </main>
  );
}
import type { Metadata } from "next";
import { cache } from "react";

import {
  notFound,
} from "next/navigation";

import {
  CampaignPage,
} from "@/components/campaign/campaign-page";

import {
  getLocale,
} from "@/lib/i18n-server";

import {
  getCurrencyContext,
} from "@/lib/currency-server";

import {
  localizeCampaign,
} from "@/lib/localize-campaign";

import { localizeAkramMonthlyCampaign } from "@/lib/akram-monthly-campaign";
import { getCampaignMetadata } from "@/lib/campaign-metadata";
import type { Locale } from "@/lib/i18n";

import {
  getCampaignBySlug,
} from "@/lib/queries/campaigns";

import {
  sanityClient,
} from "@/sanity/lib/client";

import {
  CAMPAIGN_QUERY,
} from "@/sanity/lib/queries";

import type {
  SanityCampaign,
} from "@/sanity/types/campaign";

const CAMPAIGN_SLUG =
  "akram-shake";

const getCampaignContent = cache(async (): Promise<SanityCampaign | null> =>
  sanityClient.fetch<SanityCampaign | null>(CAMPAIGN_QUERY, { slug: CAMPAIGN_SLUG }, { cache: "no-store" }),
);

function localizeDirectCampaign(content: SanityCampaign, locale: Locale): SanityCampaign {
  const headlineCopy = localizeAkramMonthlyCampaign(content, locale);
  return {
    ...localizeCampaign(content, locale),
    title: headlineCopy.title,
    summary: headlineCopy.summary,
    seoTitle: headlineCopy.seoTitle,
    seoDescription: headlineCopy.seoDescription,
  };
}

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

export async function generateMetadata(): Promise<Metadata> {
  const [content, locale] = await Promise.all([
    getCampaignContent(),
    getLocale(),
  ]);
  if (!content) notFound();
  return getCampaignMetadata(localizeDirectCampaign(content, locale), "/akram-shake-1");
}

export default async function AkramShakeDirectPage() {
  /*
   * /akram-shake-1 is a second public entry point only.
   * It intentionally loads the SAME Supabase campaign and
   * SAME Sanity document as /akram-shake.
   */
  const [
    campaign,
    content,
    locale,
    {
      currency,
      exchangeRate,
    },
  ] =
    await Promise.all([
      getCampaignBySlug(
        CAMPAIGN_SLUG,
      ),
      getCampaignContent(),
      getLocale(),
      getCurrencyContext(),
    ]);

  if (!campaign || !content) {
    notFound();
  }

  const localizedContent =
    localizeDirectCampaign(
      content,
      locale,
    );

  return (
    <CampaignPage
      campaign={
        campaign
      }
      content={
        localizedContent
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
  );
}

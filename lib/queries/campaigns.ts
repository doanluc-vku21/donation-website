import "server-only";
import { isCurrency } from "@/lib/currency";
import { formatRelativeTime } from "@/lib/relative-time";

import type {
  Campaign,
  DonationFrequency,
  DonationOption,
  RecentDonation,
} from "@/lib/sample-data";

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  createSupabaseServerClient,
} from "@/lib/supabase/server";

type CampaignRow = {
  id: string;
  slug: string;

  title: string;

  organization_name:
    string;

  eyebrow:
    string | null;

  summary:
    string | null;

  story:
    string[];

  goal_amount_cents:
    number;

  currency:
    string;
};

type DonationOptionRow = {
  id: string;

  amount_cents:
    number;

  impact_text:
    string;

  featured:
    boolean;

  sort_order:
    number;

  frequency:
    DonationFrequency;
};

type CampaignStatsRow = {
  raised_amount_cents:
    number;

  donor_count:
    number;
};

type RecentDonationRow = {
  id: string;

  display_name:
    string;

  amount_cents:
    number;

  charged_amount_cents?:
    number | null;

  charged_currency?:
    string | null;

  frequency:
    DonationFrequency;

  created_at:
    string;
};

type ChargedDonationRow = {
  id: string;
  charged_amount_cents: number | null;
  charged_currency: string | null;
};

export async function getCampaignBySlug(
  slug: string,
): Promise<
  Campaign | null
> {
  const supabase =
    createSupabaseServerClient();

  const {
    data:
      campaignData,

    error:
      campaignError,
  } =
    await supabase
      .from(
        "campaigns",
      )
      .select(
        `
          id,
          slug,
          title,
          organization_name,
          eyebrow,
          summary,
          story,
          goal_amount_cents,
          currency
        `,
      )
      .eq(
        "slug",
        slug,
      )
      .eq(
        "is_active",
        true,
      )
      .maybeSingle();

  if (
    campaignError
  ) {
    console.error(
      campaignError,
    );

    throw new Error(
      "Unable to load campaign",
    );
  }

  if (
    !campaignData
  ) {
    return null;
  }

  const campaign =
    campaignData as CampaignRow;

  const [
    donationOptionsResult,
    statsResult,
    recentResult,
    chargedDonationsResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "donation_options",
        )
        .select(
          `
            id,
            amount_cents,
            impact_text,
            featured,
            sort_order,
            frequency
          `,
        )
        .eq(
          "campaign_id",
          campaign.id,
        )
        .order(
          "sort_order",
          {
            ascending:
              true,
          },
        ),

      supabase.rpc(
        "get_campaign_public_stats",
        {
          campaign_uuid:
            campaign.id,
        },
      ),

      supabase.rpc(
        "get_recent_donations",
        {
          campaign_uuid:
            campaign.id,

          donation_limit:
            100,
        },
      ),

      Promise.resolve(
        supabaseAdmin
          .from("donations")
          .select("id, charged_amount_cents, charged_currency")
          .eq("campaign_id", campaign.id)
          .eq("status", "succeeded")
          .order("created_at", { ascending: false })
          .limit(100),
      ).catch(() => ({ data: null, error: null })),
    ]);

  if (
    donationOptionsResult.error
  ) {
    throw donationOptionsResult.error;
  }

  if (
    statsResult.error
  ) {
    throw statsResult.error;
  }

  if (
    recentResult.error
  ) {
    throw recentResult.error;
  }

  const donationOptions:
    DonationOption[] =
    (
      donationOptionsResult.data ??
      []
    ).map(
      (
        row:
          DonationOptionRow,
      ) => ({
        amountUsd:
          Number(
            row.amount_cents,
          ),

        impactText:
          row.impact_text,

        featured:
          row.featured,

        frequency:
          row.frequency,
      }),
    );

  const stats =
    (
      statsResult.data ??
      []
    )[0] as
      | CampaignStatsRow
      | undefined;

  const chargedByDonationId = new Map(
    ((chargedDonationsResult?.data ?? []) as ChargedDonationRow[]).map(row => [
      row.id,
      row,
    ]),
  );

  const recentDonations:
    RecentDonation[] =
    (
      recentResult.data ??
      []
    ).map(
      (
        row:
          RecentDonationRow,
      ) => {
        const chargedRow = chargedByDonationId.get(row.id);
        const rawChargedAmount = Number(
          chargedRow?.charged_amount_cents ?? row.charged_amount_cents,
        );
        const rawChargedCurrency = (
          chargedRow?.charged_currency ??
          row.charged_currency ??
          ""
        )
          .trim()
          .toUpperCase();
        const chargedCurrency = isCurrency(rawChargedCurrency)
          ? rawChargedCurrency
          : undefined;
        const chargedAmount =
          chargedCurrency &&
          Number.isFinite(rawChargedAmount) &&
          rawChargedAmount > 0
            ? Math.round(rawChargedAmount)
            : undefined;

        return {
          id:
            row.id,

          displayName:
            row.display_name,

          amountUsd:
            Number(
              row.amount_cents,
            ),

          ...(chargedAmount !== undefined && chargedCurrency
            ? { chargedAmount, chargedCurrency }
            : {}),

          frequency:
            row.frequency,

          relativeTime:
            formatRelativeTime(
              row.created_at,
            ),
        };
      },
    );

  const baseRaisedAmount =
    campaign.slug ===
    "give-a-child-a-brighter-tomorrow"
      ? 3_783_973
      : campaign.slug ===
          "akram-shake"
        ? 1_450_000
        : 0;

  return {
    id:
      campaign.id,

    slug:
      campaign.slug,

    title:
      campaign.title,

    organizationName:
      campaign.organization_name,

    eyebrow:
      campaign.eyebrow ??
      "",

    summary:
      campaign.summary ??
      "",

    story:
      campaign.story ??
      [],

    goalAmountUsd:
      Number(
        campaign
          .goal_amount_cents,
      ),

    raisedAmountUsd:
      baseRaisedAmount +
      Number(
        stats
          ?.raised_amount_cents ??
          0,
      ),

    donorCount:
      Number(
        stats
          ?.donor_count ??
          0,
      ),

    donationOptions,

    recentDonations,
  };
}

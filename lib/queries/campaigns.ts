import "server-only";

import type {
  Campaign,
  DonationFrequency,
  DonationOption,
  RecentDonation,
} from "@/lib/sample-data";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type CampaignRow = {
  id: string;
  slug: string;
  title: string;
  organization_name: string;
  eyebrow: string | null;
  summary: string | null;
  story: string[];
  goal_amount_cents: number;
  currency: string;
};

type DonationOptionRow = {
  id: string;
  amount_cents: number;
  impact_text: string;
  featured: boolean;
  sort_order: number;
};

type CampaignStatsRow = {
  raised_amount_cents: number;
  donor_count: number;
};

type RecentDonationRow = {
  id: string;
  display_name: string;
  amount_cents: number;
  frequency: DonationFrequency;
  created_at: string;
};

function formatRelativeTime(
  dateString: string,
) {
  const date = new Date(dateString);

  const diff =
    Date.now() - date.getTime();

  const minutes = Math.max(
    0,
    Math.floor(diff / 60000),
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} ${
      minutes === 1
        ? "minute"
        : "minutes"
    } ago`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `${hours} ${
      hours === 1
        ? "hour"
        : "hours"
    } ago`;
  }

  const days = Math.floor(
    hours / 24,
  );

  return `${days} ${
    days === 1
      ? "day"
      : "days"
  } ago`;
}

export async function getCampaignBySlug(
  slug: string,
): Promise<Campaign | null> {
  const supabase =
    createSupabaseServerClient();

  const {
    data: campaignData,
    error: campaignError,
  } = await supabase
    .from("campaigns")
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
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (campaignError) {
    console.error(
      campaignError,
    );

    throw new Error(
      "Unable to load campaign",
    );
  }

  if (!campaignData) {
    return null;
  }

  const campaign =
    campaignData as CampaignRow;

  const [
    donationOptionsResult,
    statsResult,
    recentResult,
  ] = await Promise.all([
    supabase
      .from("donation_options")
      .select(
        `
          id,
          amount_cents,
          impact_text,
          featured,
          sort_order
        `,
      )
      .eq(
        "campaign_id",
        campaign.id,
      )
      .order(
        "sort_order",
        {
          ascending: true,
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
        donation_limit: 5,
      },
    ),
  ]);

  if (
    donationOptionsResult.error
  ) {
    throw donationOptionsResult.error;
  }

  if (statsResult.error) {
    throw statsResult.error;
  }

  if (recentResult.error) {
    throw recentResult.error;
  }

  const donationOptions: DonationOption[] =
    (
      donationOptionsResult.data ??
      []
    ).map(
      (
        row: DonationOptionRow,
      ) => ({
        amountUsd:
          Number(
            row.amount_cents,
          ),

        impactText:
          row.impact_text,

        featured:
          row.featured,
      }),
    );

  const stats =
    (
      statsResult.data ??
      []
    )[0] as
      | CampaignStatsRow
      | undefined;

  const recentDonations: RecentDonation[] =
    (
      recentResult.data ??
      []
    ).map(
      (
        row: RecentDonationRow,
      ) => ({
        id: row.id,

        displayName:
          row.display_name,

        amountUsd:
          Number(
            row.amount_cents,
          ),

        frequency:
          row.frequency,

        relativeTime:
          formatRelativeTime(
            row.created_at,
          ),
      }),
    );

  return {
    id:
      campaign.id,

    title:
      campaign.title,

    organizationName:
      campaign.organization_name,

    eyebrow:
      campaign.eyebrow ?? "",

    summary:
      campaign.summary ?? "",

    story:
      campaign.story ?? [],

    goalAmountUsd:
      Number(
        campaign.goal_amount_cents,
      ),

    raisedAmountUsd:
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
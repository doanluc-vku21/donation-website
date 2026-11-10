import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Count confirmed payments, including repeat gifts, without the recent-list
// limit or donor deduplication. The webhook owns payment status and idempotency.
export async function getCampaignContributionCount(campaignId: string): Promise<number> {
  const { count, error } = await supabaseAdmin.from("donations")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("status", "succeeded");

  if (error || count === null || !Number.isSafeInteger(count) || count < 0) {
    throw new Error("Unable to load campaign contribution count.");
  }

  return count;
}

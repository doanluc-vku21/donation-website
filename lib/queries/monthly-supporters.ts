import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

type MonthlyDonationRow = {
  id: string;
  donor_id: string | null;
  stripe_subscription_id: string | null;
};

// Count people with a successfully paid monthly donation, not invoices. This is
// cumulative support; it does not claim to count currently active subscriptions.
// Return only the aggregate to the page, keeping donor identifiers server-side.
export async function getMonthlySupporterCount(campaignId: string): Promise<number | null> {
  const rows: MonthlyDonationRow[] = [];
  const pageSize = 1000;

  try {
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabaseAdmin.from("donations")
        .select("id,donor_id,stripe_subscription_id")
        .eq("campaign_id", campaignId)
        .eq("frequency", "monthly")
        .eq("status", "succeeded")
        .order("id", { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (error || !data) {
        console.error("Unable to load monthly supporter count.");
        return null;
      }

      rows.push(...data as MonthlyDonationRow[]);
      if (data.length < pageSize) break;
    }
  } catch {
    console.error("Unable to load monthly supporter count.");
    return null;
  }

  // Older invoices may lack a donor ID. Resolve them through any other payment
  // for the same subscription before considering the subscription a fallback.
  const subscriptionDonors = new Map<string, string>();
  for (const row of rows) {
    if (row.donor_id && row.stripe_subscription_id) {
      subscriptionDonors.set(row.stripe_subscription_id, row.donor_id);
    }
  }

  const supporters = new Set<string>();
  for (const row of rows) {
    const donorId = row.donor_id || (row.stripe_subscription_id
      ? subscriptionDonors.get(row.stripe_subscription_id) : undefined);
    if (donorId) supporters.add(`donor:${donorId}`);
    else if (row.stripe_subscription_id) supporters.add(`subscription:${row.stripe_subscription_id}`);
    // Unidentifiable historical payments cannot establish an additional person.
  }

  return supporters.size;
}

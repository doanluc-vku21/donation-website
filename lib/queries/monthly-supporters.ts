import "server-only";
import { formatRelativeTime } from "@/lib/relative-time";
import type { RecentDonation } from "@/lib/sample-data";
import { supabaseAdmin } from "@/lib/supabase/admin";

type MonthlyDonationRow = {
  id: string;
  donor_id: string | null;
  stripe_subscription_id: string | null;
  display_name: string | null;
  is_anonymous: boolean | null;
  amount_cents: number;
  created_at: string;
};

// Count people with a successfully paid monthly donation, not invoices. This is
// cumulative support; it does not claim to count currently active subscriptions.
// Return one public payment per person so the list and its count share a single
// snapshot. Donor and subscription identifiers must remain server-side.
export async function getMonthlySupporters(campaignId: string): Promise<RecentDonation[] | null> {
  const rows: MonthlyDonationRow[] = [];
  const pageSize = 1000;

  try {
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabaseAdmin.from("donations")
        .select("id,donor_id,stripe_subscription_id,display_name,is_anonymous,amount_cents,created_at")
        .eq("campaign_id", campaignId)
        .eq("frequency", "monthly")
        .eq("status", "succeeded")
        .order("id", { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (error || !data) {
        console.error("Unable to load monthly supporters.");
        return null;
      }

      rows.push(...data as MonthlyDonationRow[]);
      if (data.length < pageSize) break;
    }
  } catch {
    console.error("Unable to load monthly supporters.");
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

  const supporters = new Map<string, MonthlyDonationRow>();
  for (const row of rows) {
    const donorId = row.donor_id || (row.stripe_subscription_id
      ? subscriptionDonors.get(row.stripe_subscription_id) : undefined);
    const key = donorId ? `donor:${donorId}` : row.stripe_subscription_id
      ? `subscription:${row.stripe_subscription_id}` : null;
    // Unidentifiable historical payments cannot establish an additional person.
    if (!key) continue;
    const previous = supporters.get(key);
    if (!previous || compareRecentPayments(row, previous) < 0) supporters.set(key, row);
  }

  return [...supporters.values()].sort(compareRecentPayments).map((row) => ({
    id: row.id,
    displayName: row.is_anonymous === false ? row.display_name?.trim() || "Anonymous" : "Anonymous",
    amountUsd: Number(row.amount_cents),
    frequency: "monthly",
    relativeTime: formatRelativeTime(row.created_at),
  }));
}

function compareRecentPayments(a: MonthlyDonationRow, b: MonthlyDonationRow): number {
  return Date.parse(b.created_at) - Date.parse(a.created_at) || b.id.localeCompare(a.id);
}

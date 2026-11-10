import { createContributionStream } from "@/lib/contribution-stream";
import { getCampaignContributionCount } from "@/lib/queries/campaign-contributions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { STREET_VENDOR_SLUG } from "@/lib/street-vendor-campaign";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request, { params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId)) {
    return Response.json({ error: "Invalid campaign." }, { status: 400 });
  }
  try {
    // The public stream is scoped to this active campaign, never arbitrary
    // service-role access to another campaign or any donor/payment identity.
    const { data, error } = await createSupabaseServerClient().from("campaigns")
      .select("id").eq("id", campaignId).eq("slug", STREET_VENDOR_SLUG).eq("is_active", true).maybeSingle();
    if (error) throw new Error("Campaign lookup failed.");
    if (!data) return Response.json({ error: "Campaign not found." }, { status: 404 });
    const loadCount = () => getCampaignContributionCount(campaignId);
    return createContributionStream(request, await loadCount(), loadCount);
  } catch {
    return Response.json({ error: "Contribution updates are temporarily unavailable." }, { status: 503 });
  }
}

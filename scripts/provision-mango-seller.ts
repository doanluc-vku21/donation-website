import { createClient } from "@supabase/supabase-js";
import { MangoProvisioningError, provisionMangoSeller, type CampaignSeed, type MangoProvisioningStore, type ProvisionedCampaign, type ProvisionedOption } from "@/scripts/lib/mango-seller-provisioning";

function operationError(message: string, code?: string): MangoProvisioningError {
  const safeCode = code && /^[a-zA-Z0-9_]{1,32}$/.test(code) ? ` (${code})` : "";
  return new MangoProvisioningError(`${message}${safeCode}`);
}

// Run only for this authorized release, inside the confirmed production build.
// Credentials remain in Vercel's environment and are never retrieved or logged.
async function run(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (process.env.VERCEL_ENV !== "production" || url !== "https://tykwnwjmokbdnkqszqrh.supabase.co" ||
      (process.env.VERCEL_PROJECT_ID && process.env.VERCEL_PROJECT_ID !== "prj_Rf04c904XCMzz2JHgfapVx5Qnt8k") || !serviceKey) {
    console.error("Mango setup environment check:", {
      production: process.env.VERCEL_ENV === "production",
      databaseMatches: url === "https://tykwnwjmokbdnkqszqrh.supabase.co",
      projectMatches: !process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_ID === "prj_Rf04c904XCMzz2JHgfapVx5Qnt8k",
      serviceKeyConfigured: Boolean(serviceKey),
    });
    throw new MangoProvisioningError("Authorized production provisioning environment is unavailable.");
  }
  console.info("Mango setup: production target verified.");
  const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const columns = "id,slug,organization_name,is_active";
  const optionColumns = "amount_cents,impact_text,featured,sort_order,frequency";
  const store: MangoProvisioningStore = {
    async findCampaign(slug) {
      const { data, error } = await client.from("campaigns").select(columns).eq("slug", slug).maybeSingle();
      if (error) throw operationError("Unable to read campaign identity.", error.code);
      return data as ProvisionedCampaign | null;
    },
    async createCampaign(seed: CampaignSeed) {
      const { data, error } = await client.from("campaigns").insert(seed).select(columns).single();
      if (error || !data) throw operationError("Unable to create the independent mango campaign.", error?.code);
      return data as ProvisionedCampaign;
    },
    async listOptions(id) {
      const { data, error } = await client.from("donation_options").select(optionColumns).eq("campaign_id", id).order("sort_order");
      if (error) throw operationError("Unable to read donation options.", error.code);
      return (data ?? []) as ProvisionedOption[];
    },
    async insertOptions(id, options) {
      const { error } = await client.from("donation_options").insert(options.map(option => ({ ...option, campaign_id: id })));
      if (error) throw operationError("Unable to initialize mango donation options.", error.code);
    },
    async activateCampaign(id) {
      const { error } = await client.from("campaigns").update({ is_active: true }).eq("id", id).eq("slug", "help-mango-seller");
      if (error) throw operationError("Unable to activate the new campaign.", error.code);
    },
  };
  const result = await provisionMangoSeller(store);
  console.info("Mango campaign verified:", result.id, "donation options:", result.optionCount);
}

void run().catch(error => {
  // Never expose SDK responses or credential data in deployment logs.
  console.error(error instanceof MangoProvisioningError ? error.message : "Mango campaign provisioning failed with an unexpected error.");
  process.exitCode = 1;
});

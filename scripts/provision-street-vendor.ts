import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { localizeStreetVendorCampaign, STREET_VENDOR_GOAL_USD_CENTS, STREET_VENDOR_SLUG } from "@/lib/street-vendor-campaign";
import {
  provisionStreetVendor, streetVendorOptions, streetVendorSeed, StreetVendorProvisioningError,
  type StreetVendorIdentity, type StreetVendorOption, type StreetVendorStore,
} from "@/scripts/lib/street-vendor-provisioning";

function assertSuccess(error: unknown, operation: string): void {
  if (!error) return;
  const code = typeof error === "object" && "code" in error && typeof error.code === "string" && /^[A-Za-z0-9_]{1,32}$/.test(error.code)
    ? ` (${error.code})` : "";
  throw new StreetVendorProvisioningError(`Database ${operation} failed${code}; no service details were logged.`);
}

async function run(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const activate = process.argv.includes("--activate");
  const goalArgument = process.argv.find(argument => argument.startsWith("--goal-usd-cents="));
  const goal = goalArgument ? Number(goalArgument.split("=")[1]) : STREET_VENDOR_GOAL_USD_CENTS;
  if (activate && !apply) throw new StreetVendorProvisioningError("--activate requires --apply and release authorization.");
  streetVendorSeed(goal);
  const content = localizeStreetVendorCampaign({ _id: "drafts.campaign-help-street-vendor", slug: STREET_VENDOR_SLUG, title: "" }, "en");
  const outputDirectory = resolve(".local/help-street-vendor");
  await mkdir(outputDirectory, { recursive: true, mode: 0o700 });
  await writeFile(resolve(outputDirectory, "campaign.ndjson"), `${JSON.stringify({
    ...content, _type: "campaign", slug: { _type: "slug", current: STREET_VENDOR_SLUG },
    isActive: false, currency: "USD", goalAmount: goal / 100,
    // The local portrait ships with the app; Sanity asset references are added
    // through Studio only if a CMS-managed portrait is wanted later.
    heroImage: undefined,
  })}\n`, { mode: 0o600 });
  if (!apply) {
    console.info(JSON.stringify({ mode: "local-draft-only", slug: STREET_VENDOR_SLUG,
      goalUsdCents: goal, options: streetVendorOptions, remoteWrites: false }));
    return;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.info("Street vendor setup target checks:", {
    production: process.env.VERCEL_ENV === "production",
    projectMatches: process.env.VERCEL_PROJECT_ID === "prj_Rf04c904XCMzz2JHgfapVx5Qnt8k",
    databaseMatches: url === "https://tykwnwjmokbdnkqszqrh.supabase.co",
    serviceKeyConfigured: Boolean(key),
  });
  if (process.env.VERCEL_ENV !== "production" ||
      process.env.VERCEL_PROJECT_ID !== "prj_Rf04c904XCMzz2JHgfapVx5Qnt8k" ||
      url !== "https://tykwnwjmokbdnkqszqrh.supabase.co" || !key) {
    throw new StreetVendorProvisioningError("Confirmed production project/database environment is required for writes.");
  }
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const columns = "id,slug,organization_name,currency,goal_amount_cents,is_active";
  const optionColumns = "frequency,amount_cents,impact_text,featured,sort_order";
  const store: StreetVendorStore = {
    async findCampaign() {
      const { data, error } = await client.from("campaigns").select(columns).eq("slug", STREET_VENDOR_SLUG).maybeSingle();
      assertSuccess(error, "campaign lookup");
      return data as StreetVendorIdentity | null;
    },
    async createCampaign(seed) {
      const { data, error } = await client.from("campaigns").insert(seed).select(columns).single();
      assertSuccess(error, "campaign creation");
      if (!data) throw new StreetVendorProvisioningError("Campaign creation returned no identity.");
      return data as StreetVendorIdentity;
    },
    async listOptions(id) {
      const { data, error } = await client.from("donation_options").select(optionColumns).eq("campaign_id", id);
      assertSuccess(error, "donation option lookup");
      return (data ?? []) as StreetVendorOption[];
    },
    async insertOptions(id, options) {
      const { error } = await client.from("donation_options").insert(options.map(option => ({ ...option, campaign_id: id })));
      assertSuccess(error, "donation option initialization");
    },
    async activateCampaign(id) {
      const { error } = await client.from("campaigns").update({ is_active: true }).eq("id", id).eq("slug", STREET_VENDOR_SLUG);
      assertSuccess(error, "campaign activation");
    },
  };
  const verified = await provisionStreetVendor(store, goal, activate);
  console.info(JSON.stringify({ slug: verified.slug, id: verified.id, active: verified.is_active, verified: true }));
}

void run().catch(error => {
  console.error(error instanceof StreetVendorProvisioningError ? error.message : "Street vendor preparation failed; no service details were logged.");
  process.exitCode = 1;
});

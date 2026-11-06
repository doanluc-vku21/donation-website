import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { MANGO_SELLER_SLUG, withMangoSellerCopy } from "@/lib/mango-seller-campaign";

// Generates a local, inactive CMS draft only. No service credentials or remote
// writes are used. Add the approved portrait and organization assets in Studio.
async function run(): Promise<void> {
  const content = withMangoSellerCopy({
    _id: "drafts.campaign-help-mango-seller",
    slug: MANGO_SELLER_SLUG,
    title: "",
  });
  const document = {
    ...content,
    _type: "campaign",
    slug: { _type: "slug", current: MANGO_SELLER_SLUG },
    isActive: false,
    currency: "USD",
  };
  const outputDirectory = resolve(".local/help-mango-seller");
  await mkdir(outputDirectory, { recursive: true, mode: 0o700 });
  const outputPath = resolve(outputDirectory, "campaign.ndjson");
  await writeFile(outputPath, `${JSON.stringify(document)}\n`, { mode: 0o600 });
  console.info(`Prepared inactive local CMS draft: ${outputPath}`);
}

void run().catch(() => {
  console.error("Unable to prepare the local mango seller content draft.");
  process.exitCode = 1;
});

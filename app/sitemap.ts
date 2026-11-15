import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://donate.mealsupport.org";

/*
 * Public campaign and policy pages, in the order donors usually meet them.
 * Excluded on purpose: "/" (redirects to /gaza-food), "/thank-you" (post
 * payment), and "/studio" (Sanity Studio).
 */
const paths = [
  "/gaza-food",
  "/gaza-food/donate",
  "/akram-shake",
  "/akram-shake/donate",
  "/akram-shake-1",
  "/akram-shake-2",
  "/akram-shake-3",
  "/gaza-help",
  "/help-gaza",
  "/child-health",
  "/child-health-1",
  "/help-street-vendor",
  "/help-mango-seller",
  "/help-mango-seller-1",
  "/about",
  "/contact",
  "/terms",
  "/privacy-policy",
  "/donation-refund-policy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((path) => ({ url: new URL(path, siteUrl).href }));
}

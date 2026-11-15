import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://donate.mealsupport.org";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/studio", "/api/", "/thank-you"],
      },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).href,
  };
}

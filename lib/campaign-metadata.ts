import type { Metadata } from "next";
import type { SanityCampaign } from "@/sanity/types/campaign";

export function getCampaignMetadata(content: SanityCampaign, pathname: string): Metadata {
  const title = content.seoTitle?.trim() || content.title;
  const description = content.seoDescription?.trim() || content.summary?.trim() || title;
  const url = new URL(pathname, process.env.NEXT_PUBLIC_SITE_URL || "https://donate.mealsupport.org");
  const imageUrl = content.heroImage?.asset?.url;
  const images = imageUrl ? [{ url: imageUrl, alt: content.heroImage?.alt || content.title }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website", title, description, url,
      siteName: content.organizationName,
      images,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title, description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

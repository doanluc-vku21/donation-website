/*
 * Sanity holds editorial campaign content: story copy, imagery, allocation
 * notes, goal configuration. It changes when an editor publishes, not per
 * request, so caching it for a minute removes a full CMS round trip from every
 * page view without touching anything that must stay live.
 *
 * The live numbers are elsewhere on purpose: the raised amount and donor list
 * come from Supabase through getCampaignBySlug, and the locale and currency
 * context stay request-scoped. Those reads keep their no-store behavior, which
 * is why the pages still render dynamically and no whole-page caching is
 * involved.
 *
 * `campaign:<slug>` lets a Sanity webhook drop the entry before the window
 * closes: revalidateTag("campaign:<slug>") after a publish.
 */
export function campaignContentCache(slug: string): {
  next: { revalidate: number; tags: string[] };
} {
  return {
    next: {
      revalidate: 60,
      tags: [
        "campaign",
        `campaign:${slug}`,
      ],
    },
  };
}

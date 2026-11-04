import type { SanityCampaign } from "@/sanity/types/campaign";

// Apply only to the Ryan entry page, leaving the shared CMS document intact.
const rename = (text: string): string => text.replace(/\bakram\b/gi, "Ryan").replace(/أكرم/g, "رايان");
const optional = (text: string | undefined): string | undefined => text === undefined ? undefined : rename(text);

export function withRyanCampaignName(content: SanityCampaign): SanityCampaign {
  return {
    ...content,
    title: rename(content.title),
    summary: optional(content.summary),
    eyebrow: optional(content.eyebrow),
    storyHeading: optional(content.storyHeading),
    storyEyebrow: optional(content.storyEyebrow),
    seoTitle: optional(content.seoTitle),
    seoDescription: optional(content.seoDescription),
    heroImage: content.heroImage ? { ...content.heroImage, alt: optional(content.heroImage.alt) } : undefined,
    story: content.story?.map(block => ({ ...block, children: block.children?.map(span => ({ ...span, text: rename(span.text) })) })),
    fundUsageTitle: optional(content.fundUsageTitle),
    fundUsageSubtitle: optional(content.fundUsageSubtitle),
    fundUsageItems: content.fundUsageItems?.map(item => ({ ...item, title: optional(item.title), description: optional(item.description), content: optional(item.content) })),
    nourishmentCard: content.nourishmentCard ? { title: optional(content.nourishmentCard.title), description: optional(content.nourishmentCard.description) } : undefined,
    learningCard: content.learningCard ? { title: optional(content.learningCard.title), description: optional(content.learningCard.description) } : undefined,
    steadyCareCard: content.steadyCareCard ? { title: optional(content.steadyCareCard.title), description: optional(content.steadyCareCard.description) } : undefined,
  };
}

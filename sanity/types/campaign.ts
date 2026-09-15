export type StoryCardContent = {
  title?: string;
  description?: string;
};

export type FooterPopupContent = {
  label?: string;
  title?: string;
  content?: any[];
};

export type SanityCampaign = {
  _id: string;

  title: string;
  slug: string;

  // =========================================
  // GENERAL
  // =========================================

  organizationName?: string;
  eyebrow?: string;
  summary?: string;

  heroImage?: {
    asset?: {
      _id: string;
      url: string;

      metadata?: {
        dimensions?: {
          width: number;
          height: number;
          aspectRatio: number;
        };

        lqip?: string;
      };
    };

    alt?: string;
  };

  // =========================================
  // STORY
  // =========================================

  storyEyebrow?: string;
  storyHeading?: string;
  story?: any[];

  nourishmentCard?: StoryCardContent;
  learningCard?: StoryCardContent;
  steadyCareCard?: StoryCardContent;

  // =========================================
  // FOOTER
  // =========================================

  footerOrganizationName?: string;
  footerSubtitle?: string;
  footerSecureText?: string;

  footerAbout?: FooterPopupContent;
  footerContact?: FooterPopupContent;
  footerPrivacy?: FooterPopupContent;
  footerTerms?: FooterPopupContent;
  footerRefund?: FooterPopupContent;

  // =========================================
  // DONATION
  // =========================================

  goalAmount?: number;
  currency?: string;

  // =========================================
  // SEO
  // =========================================

  seoTitle?: string;
  seoDescription?: string;
};
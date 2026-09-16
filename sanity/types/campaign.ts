export type StoryCardContent = {
  title?: string;
  description?: string;
};

export type FooterPopupContent = {
  label?: string;
  title?: string;
  content?: any[];
};

export type SanityImage = {
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

export type SanityCampaign = {
  _id: string;

  title: string;
  slug: string;

  // =========================================
  // GENERAL
  // =========================================

  organizationName?: string;

  organizationLogo?: SanityImage;

  eyebrow?: string;

  summary?: string;

  heroImage?: SanityImage;

  // =========================================
  // STORY
  // =========================================

  storyEyebrow?: string;

  storyHeading?: string;

  story?: any[];

  /*
   * Giữ lại 3 field này để tương thích với
   * test/schema cũ.
   *
   * CampaignStory hiện tại có thể không render
   * chúng nhưng vẫn giữ type để build không lỗi.
   */
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
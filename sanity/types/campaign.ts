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
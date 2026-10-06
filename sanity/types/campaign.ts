import type {
  Locale,
} from "@/lib/i18n";
export type StoryCardContent = {
  title?: string;
  description?: string;
};

export type FooterPopupContent = {
  label?: string;

  title?: string;

  content?: any[];

  labelI18n?:
    LocalizedString;

  titleI18n?:
    LocalizedString;

  contentI18n?:
    LocalizedPortableText;
};

export type FundUsageItem = {
  _key: string;

  itemType?:
    | "allocation"
    | "text";

  amount?: number;

  // =========================================
  // ORIGINAL ENGLISH
  // =========================================

  title?: string;

  description?: string;

  content?: string;

  // =========================================
  // MULTILINGUAL
  // =========================================

  titleI18n?:
    LocalizedString;

  descriptionI18n?:
    LocalizedString;

  contentI18n?:
    LocalizedString;
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
export type LocalizedString =
  Partial<
    Record<
      Locale,
      string
    >
  >;

export type LocalizedPortableText =
  Partial<
    Record<
      Locale,
      any[]
    >
  >;
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

  nourishmentCard?: StoryCardContent;

  learningCard?: StoryCardContent;

  steadyCareCard?: StoryCardContent;

  // =========================================
  // FUND USAGE
  // =========================================

  fundUsageTitle?: string;

  fundUsageSubtitle?: string;

  fundUsageItems?: FundUsageItem[];

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
  footerSubtitleI18n?:
  LocalizedString;

footerSecureTextI18n?:
  LocalizedString;

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
  titleI18n?: LocalizedString;

eyebrowI18n?: LocalizedString;

summaryI18n?: LocalizedString;

storyEyebrowI18n?:
  LocalizedString;

storyHeadingI18n?:
  LocalizedString;

storyI18n?:
  LocalizedPortableText;

fundUsageTitleI18n?:
  LocalizedString;

fundUsageSubtitleI18n?:
  LocalizedString;

seoTitleI18n?:
  LocalizedString;

seoDescriptionI18n?:
  LocalizedString;
};

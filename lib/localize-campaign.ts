import type {
  Locale,
} from "@/lib/i18n";

import type {
  SanityCampaign,
} from "@/sanity/types/campaign";

function localizedText(
  translations:
    | Partial<
        Record<
          Locale,
          string
        >
      >
    | undefined,
  locale: Locale,
  fallback:
    | string
    | undefined,
) {
  return (
    translations?.[locale] ||
    translations?.en ||
    fallback ||
    ""
  );
}
function localizedFooterPopup(
  popup:
    | SanityCampaign[
        "footerAbout"
      ]
    | undefined,
  locale: Locale,
) {
  if (!popup) {
    return undefined;
  }

  return {
    ...popup,

    label:
      localizedText(
        popup.labelI18n,
        locale,
        popup.label,
      ),

    title:
      localizedText(
        popup.titleI18n,
        locale,
        popup.title,
      ),

    content:
      localizedPortableText(
        popup.contentI18n,
        locale,
        popup.content,
      ),
  };
}
function localizedPortableText(
  translations:
    | Partial<
        Record<
          Locale,
          any[]
        >
      >
    | undefined,
  locale: Locale,
  fallback:
    | any[]
    | undefined,
) {
  const selected =
    translations?.[locale];

  if (
    Array.isArray(selected) &&
    selected.length > 0
  ) {
    return selected;
  }

  const english =
    translations?.en;

  if (
    Array.isArray(english) &&
    english.length > 0
  ) {
    return english;
  }

  return fallback ?? [];
}

export function localizeCampaign(
  content: SanityCampaign,
  locale: Locale,
): SanityCampaign {
  return {
    ...content,

    title:
      localizedText(
        content.titleI18n,
        locale,
        content.title,
      ),

    eyebrow:
      localizedText(
        content.eyebrowI18n,
        locale,
        content.eyebrow,
      ),

    summary:
      localizedText(
        content.summaryI18n,
        locale,
        content.summary,
      ),

    storyEyebrow:
      localizedText(
        content.storyEyebrowI18n,
        locale,
        content.storyEyebrow,
      ),

    storyHeading:
      localizedText(
        content.storyHeadingI18n,
        locale,
        content.storyHeading,
      ),

    story:
      localizedPortableText(
        content.storyI18n,
        locale,
        content.story,
      ),

    fundUsageTitle:
      localizedText(
        content
          .fundUsageTitleI18n,
        locale,
        content.fundUsageTitle,
      ),

    fundUsageSubtitle:
      localizedText(
        content
          .fundUsageSubtitleI18n,
        locale,
        content.fundUsageSubtitle,
      ),
    fundUsageItems:
  content
    .fundUsageItems
    ?.map(
      (item) => ({
        ...item,

        title:
          localizedText(
            item.titleI18n,
            locale,
            item.title,
          ),

        description:
          localizedText(
            item.descriptionI18n,
            locale,
            item.description,
          ),

        content:
          localizedText(
            item.contentI18n,
            locale,
            item.content,
          ),
      }),
    ) ?? [],

    seoTitle:
      localizedText(
        content.seoTitleI18n,
        locale,
        content.seoTitle,
      ),

    seoDescription:
      localizedText(
        content
          .seoDescriptionI18n,
        locale,
        content.seoDescription,
      ),
    footerSubtitle:
  localizedText(
    content
      .footerSubtitleI18n,
    locale,
    content.footerSubtitle,
  ),

footerSecureText:
  localizedText(
    content
      .footerSecureTextI18n,
    locale,
    content.footerSecureText,
  ),

footerAbout:
  localizedFooterPopup(
    content.footerAbout,
    locale,
  ),

footerContact:
  localizedFooterPopup(
    content.footerContact,
    locale,
  ),

footerPrivacy:
  localizedFooterPopup(
    content.footerPrivacy,
    locale,
  ),

footerTerms:
  localizedFooterPopup(
    content.footerTerms,
    locale,
  ),

footerRefund:
  localizedFooterPopup(
    content.footerRefund,
    locale,
  ),
  };
}
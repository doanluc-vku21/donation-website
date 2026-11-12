import type {
  Locale,
} from "@/lib/i18n";
import type { PortableTextBlock } from "@portabletext/react";

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

  const {
    labelI18n,
    titleI18n,
    contentI18n,
    ...restPopup
  } = popup;

  return {
    ...restPopup,

    label:
      localizedText(
        labelI18n,
        locale,
        popup.label,
      ),

    title:
      localizedText(
        titleI18n,
        locale,
        popup.title,
      ),

    content:
      localizedPortableText(
        contentI18n,
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
          PortableTextBlock[]
        >
      >
    | undefined,
  locale: Locale,
  fallback:
    | PortableTextBlock[]
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
  const {
    titleI18n,
    eyebrowI18n,
    summaryI18n,
    storyEyebrowI18n,
    storyHeadingI18n,
    storyI18n,
    fundUsageTitleI18n,
    fundUsageSubtitleI18n,
    seoTitleI18n,
    seoDescriptionI18n,
    footerSubtitleI18n,
    footerSecureTextI18n,
    ...restContent
  } = content;

  return {
    ...restContent,

    title:
      localizedText(
        titleI18n,
        locale,
        content.title,
      ),

    eyebrow:
      localizedText(
        eyebrowI18n,
        locale,
        content.eyebrow,
      ),

    summary:
      localizedText(
        summaryI18n,
        locale,
        content.summary,
      ),

    storyEyebrow:
      localizedText(
        storyEyebrowI18n,
        locale,
        content.storyEyebrow,
      ),

    storyHeading:
      localizedText(
        storyHeadingI18n,
        locale,
        content.storyHeading,
      ),

    story:
      localizedPortableText(
        storyI18n,
        locale,
        content.story,
      ),

    fundUsageTitle:
      localizedText(
        fundUsageTitleI18n,
        locale,
        content.fundUsageTitle,
      ),

    fundUsageSubtitle:
      localizedText(
        fundUsageSubtitleI18n,
        locale,
        content.fundUsageSubtitle,
      ),
    fundUsageItems:
  content
    .fundUsageItems
    ?.map(
      ({
        titleI18n: itemTitleI18n,
        descriptionI18n: itemDescriptionI18n,
        contentI18n: itemContentI18n,
        ...restItem
      }) => ({
        ...restItem,

        title:
          localizedText(
            itemTitleI18n,
            locale,
            restItem.title,
          ),

        description:
          localizedText(
            itemDescriptionI18n,
            locale,
            restItem.description,
          ),

        content:
          localizedText(
            itemContentI18n,
            locale,
            restItem.content,
          ),
      }),
    ) ?? [],

    seoTitle:
      localizedText(
        seoTitleI18n,
        locale,
        content.seoTitle,
      ),

    seoDescription:
      localizedText(
        seoDescriptionI18n,
        locale,
        content.seoDescription,
      ),
    footerSubtitle:
  localizedText(
    footerSubtitleI18n,
    locale,
    content.footerSubtitle,
  ),

footerSecureText:
  localizedText(
    footerSecureTextI18n,
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

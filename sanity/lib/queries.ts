import {
  defineQuery,
} from "next-sanity";

export const CAMPAIGN_QUERY =
  defineQuery(`
    *[
      _type == "campaign" &&
      slug.current == $slug &&
      isActive == true
    ][0]{
      _id,

      title,
      titleI18n {
  en,
  fr,
  de,
  es,
  ar
},

      "slug": slug.current,

      organizationName,

      organizationLogo {
        asset-> {
          _id,
          url,

          metadata {
            dimensions,
            lqip
          }
        },

        alt,
        hotspot,
        crop
      },

      eyebrow,
      summary,
      eyebrowI18n {
  en,
  fr,
  de,
  es,
  ar
},

summaryI18n {
  en,
  fr,
  de,
  es,
  ar
},

      heroImage {
        asset-> {
          _id,
          url,

          metadata {
            dimensions,
            lqip
          }
        },

        alt,
        hotspot,
        crop
      },

      // =====================================
      // STORY
      // =====================================
storyEyebrowI18n {
  en,
  fr,
  de,
  es,
  ar
},

storyHeadingI18n {
  en,
  fr,
  de,
  es,
  ar
},

storyI18n {
  en,
  fr,
  de,
  es,
  ar
},
      storyEyebrow,
      storyHeading,
      story,

      nourishmentCard {
        title,
        description
      },

      learningCard {
        title,
        description
      },

      steadyCareCard {
        title,
        description
      },

      // =====================================
      // FUND USAGE
      // =====================================
fundUsageTitleI18n {
  en,
  fr,
  de,
  es,
  ar
},

fundUsageSubtitleI18n {
  en,
  fr,
  de,
  es,
  ar
},
      fundUsageTitle,
      fundUsageSubtitle,

     fundUsageItems[] {
  _key,
  itemType,
  amount,

  title,
  description,
  content,

  titleI18n {
    en,
    fr,
    de,
    es,
    ar
  },

  descriptionI18n {
    en,
    fr,
    de,
    es,
    ar
  },

  contentI18n {
    en,
    fr,
    de,
    es,
    ar
  }
},

      // =====================================
      // FOOTER
      // =====================================

      footerOrganizationName,

footerSubtitle,

footerSubtitleI18n {
  en,
  fr,
  de,
  es,
  ar
},

footerSecureText,

footerSecureTextI18n {
  en,
  fr,
  de,
  es,
  ar
},

footerAbout {
  label,
  title,
  content,

  labelI18n {
    en,
    fr,
    de,
    es,
    ar
  },

  titleI18n {
    en,
    fr,
    de,
    es,
    ar
  },

  contentI18n {
    en,
    fr,
    de,
    es,
    ar
  }
},

footerContact {
  label,
  title,
  content,

  labelI18n {
    en,
    fr,
    de,
    es,
    ar
  },

  titleI18n {
    en,
    fr,
    de,
    es,
    ar
  },

  contentI18n {
    en,
    fr,
    de,
    es,
    ar
  }
},

footerPrivacy {
  label,
  title,
  content,

  labelI18n {
    en,
    fr,
    de,
    es,
    ar
  },

  titleI18n {
    en,
    fr,
    de,
    es,
    ar
  },

  contentI18n {
    en,
    fr,
    de,
    es,
    ar
  }
},

footerTerms {
  label,
  title,
  content,

  labelI18n {
    en,
    fr,
    de,
    es,
    ar
  },

  titleI18n {
    en,
    fr,
    de,
    es,
    ar
  },

  contentI18n {
    en,
    fr,
    de,
    es,
    ar
  }
},

footerRefund {
  label,
  title,
  content,

  labelI18n {
    en,
    fr,
    de,
    es,
    ar
  },

  titleI18n {
    en,
    fr,
    de,
    es,
    ar
  },

  contentI18n {
    en,
    fr,
    de,
    es,
    ar
  }
},

      // =====================================
      // DONATION
      // =====================================

      goalAmount,
      currency,

      // =====================================
      // SEO
      // =====================================
seoTitleI18n {
  en,
  fr,
  de,
  es,
  ar
},

seoDescriptionI18n {
  en,
  fr,
  de,
  es,
  ar
},
      seoTitle,
      seoDescription
    }
  `);
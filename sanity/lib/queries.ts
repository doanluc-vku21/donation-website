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
      // FOOTER
      // =====================================

      footerOrganizationName,
      footerSubtitle,
      footerSecureText,

      footerAbout {
        label,
        title,
        content
      },

      footerContact {
        label,
        title,
        content
      },

      footerPrivacy {
        label,
        title,
        content
      },

      footerTerms {
        label,
        title,
        content
      },

      footerRefund {
        label,
        title,
        content
      },

      // =====================================
      // DONATION
      // =====================================

      goalAmount,
      currency,

      // =====================================
      // SEO
      // =====================================

      seoTitle,
      seoDescription
    }
  `);
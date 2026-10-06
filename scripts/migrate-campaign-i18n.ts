import {
  config,
} from "dotenv";

import {
  createClient,
} from "@sanity/client";

config({
  path: ".env.local",
});

const projectId =
  process.env
    .NEXT_PUBLIC_SANITY_PROJECT_ID;

const dataset =
  process.env
    .NEXT_PUBLIC_SANITY_DATASET;

const token =
  process.env
    .SANITY_API_WRITE_TOKEN;

if (!projectId) {
  throw new Error(
    "Missing NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local",
  );
}

if (!dataset) {
  throw new Error(
    "Missing NEXT_PUBLIC_SANITY_DATASET in .env.local",
  );
}

if (!token) {
  throw new Error(
    "Missing SANITY_API_WRITE_TOKEN in .env.local",
  );
}

console.log({
  projectId,
  dataset,
  hasToken:
    Boolean(token),
});

const client =
  createClient({
    projectId,
    dataset,

    apiVersion:
      "2026-01-01",

    useCdn:
      false,

    token,
  });

async function run() {
  const campaigns =
    await client.fetch(`
      *[_type == "campaign"]{
        _id,

        title,
        eyebrow,
        summary,

        storyEyebrow,
        storyHeading,
        story,

        fundUsageTitle,
        fundUsageSubtitle,
        fundUsageItems,
        footerSubtitle,
footerSecureText,

footerAbout,
footerContact,
footerPrivacy,
footerTerms,
footerRefund,
        seoTitle,
        seoDescription,

        
      }
    `);

  for (
    const campaign
    of campaigns
  ) {
    const patch:
      Record<
        string,
        unknown
      > = {};

    // =========================================
    // CAMPAIGN TITLE
    // =========================================

    if (
      campaign.title
    ) {
      patch[
        "titleI18n.en"
      ] =
        campaign.title;
    }

    // =========================================
    // EYEBROW
    // =========================================

    if (
      campaign.eyebrow
    ) {
      patch[
        "eyebrowI18n.en"
      ] =
        campaign.eyebrow;
    }

    // =========================================
    // SUMMARY
    // =========================================

    if (
      campaign.summary
    ) {
      patch[
        "summaryI18n.en"
      ] =
        campaign.summary;
    }

    // =========================================
    // STORY EYEBROW
    // =========================================

    if (
      campaign.storyEyebrow
    ) {
      patch[
        "storyEyebrowI18n.en"
      ] =
        campaign.storyEyebrow;
    }

    // =========================================
    // STORY HEADING
    // =========================================

    if (
      campaign.storyHeading
    ) {
      patch[
        "storyHeadingI18n.en"
      ] =
        campaign.storyHeading;
    }

    // =========================================
    // STORY
    // =========================================

    if (
      Array.isArray(
        campaign.story,
      )
    ) {
      patch[
        "storyI18n.en"
      ] =
        campaign.story;
    }

    // =========================================
    // FUND USAGE TITLE
    // =========================================

    if (
      campaign
        .fundUsageTitle
    ) {
      patch[
        "fundUsageTitleI18n.en"
      ] =
        campaign
          .fundUsageTitle;
    }

    // =========================================
    // FUND USAGE SUBTITLE
    // =========================================

    if (
      campaign
        .fundUsageSubtitle
    ) {
      patch[
        "fundUsageSubtitleI18n.en"
      ] =
        campaign
          .fundUsageSubtitle;
    }

    // =========================================
    // FUND USAGE ITEMS
    // =========================================

    if (
      Array.isArray(
        campaign
          .fundUsageItems,
      )
    ) {
      const migratedItems =
        campaign
          .fundUsageItems
          .map(
            (
              item: any,
            ) => {
              const nextItem = {
                ...item,
              };

              // -------------------------------
              // TITLE
              // -------------------------------

              if (
                item.title
              ) {
                nextItem
                  .titleI18n =
                  {
                    ...item
                      .titleI18n,

                    en:
                      item.title,
                  };
              }

              // -------------------------------
              // DESCRIPTION
              // -------------------------------

              if (
                item.description
              ) {
                nextItem
                  .descriptionI18n =
                  {
                    ...item
                      .descriptionI18n,

                    en:
                      item.description,
                  };
              }

              // -------------------------------
              // TEXT CONTENT
              // -------------------------------

              if (
                item.content
              ) {
                nextItem
                  .contentI18n =
                  {
                    ...item
                      .contentI18n,

                    en:
                      item.content,
                  };
              }

              return nextItem;
            },
          );

      patch[
        "fundUsageItems"
      ] =
        migratedItems;
    }
    // =========================================
// FOOTER SUBTITLE
// =========================================

if (
  campaign.footerSubtitle
) {
  patch[
    "footerSubtitleI18n.en"
  ] =
    campaign.footerSubtitle;
}

// =========================================
// FOOTER SECURE TEXT
// =========================================

if (
  campaign.footerSecureText
) {
  patch[
    "footerSecureTextI18n.en"
  ] =
    campaign.footerSecureText;
}

// =========================================
// FOOTER ABOUT
// =========================================

if (
  campaign.footerAbout
) {
  patch["footerAbout"] = {
    ...campaign.footerAbout,

    labelI18n: {
      ...campaign
        .footerAbout
        .labelI18n,

      ...(campaign
        .footerAbout
        .label
        ? {
            en:
              campaign
                .footerAbout
                .label,
          }
        : {}),
    },

    titleI18n: {
      ...campaign
        .footerAbout
        .titleI18n,

      ...(campaign
        .footerAbout
        .title
        ? {
            en:
              campaign
                .footerAbout
                .title,
          }
        : {}),
    },

    contentI18n: {
      ...campaign
        .footerAbout
        .contentI18n,

      ...(Array.isArray(
        campaign
          .footerAbout
          .content,
      )
        ? {
            en:
              campaign
                .footerAbout
                .content,
          }
        : {}),
    },
  };
}

// =========================================
// FOOTER CONTACT
// =========================================

if (
  campaign.footerContact
) {
  patch["footerContact"] = {
    ...campaign.footerContact,

    labelI18n: {
      ...campaign
        .footerContact
        .labelI18n,

      ...(campaign
        .footerContact
        .label
        ? {
            en:
              campaign
                .footerContact
                .label,
          }
        : {}),
    },

    titleI18n: {
      ...campaign
        .footerContact
        .titleI18n,

      ...(campaign
        .footerContact
        .title
        ? {
            en:
              campaign
                .footerContact
                .title,
          }
        : {}),
    },

    contentI18n: {
      ...campaign
        .footerContact
        .contentI18n,

      ...(Array.isArray(
        campaign
          .footerContact
          .content,
      )
        ? {
            en:
              campaign
                .footerContact
                .content,
          }
        : {}),
    },
  };
}

// =========================================
// FOOTER PRIVACY
// =========================================

if (
  campaign.footerPrivacy
) {
  patch["footerPrivacy"] = {
    ...campaign.footerPrivacy,

    labelI18n: {
      ...campaign
        .footerPrivacy
        .labelI18n,

      ...(campaign
        .footerPrivacy
        .label
        ? {
            en:
              campaign
                .footerPrivacy
                .label,
          }
        : {}),
    },

    titleI18n: {
      ...campaign
        .footerPrivacy
        .titleI18n,

      ...(campaign
        .footerPrivacy
        .title
        ? {
            en:
              campaign
                .footerPrivacy
                .title,
          }
        : {}),
    },

    contentI18n: {
      ...campaign
        .footerPrivacy
        .contentI18n,

      ...(Array.isArray(
        campaign
          .footerPrivacy
          .content,
      )
        ? {
            en:
              campaign
                .footerPrivacy
                .content,
          }
        : {}),
    },
  };
}

// =========================================
// FOOTER TERMS
// =========================================

if (
  campaign.footerTerms
) {
  patch["footerTerms"] = {
    ...campaign.footerTerms,

    labelI18n: {
      ...campaign
        .footerTerms
        .labelI18n,

      ...(campaign
        .footerTerms
        .label
        ? {
            en:
              campaign
                .footerTerms
                .label,
          }
        : {}),
    },

    titleI18n: {
      ...campaign
        .footerTerms
        .titleI18n,

      ...(campaign
        .footerTerms
        .title
        ? {
            en:
              campaign
                .footerTerms
                .title,
          }
        : {}),
    },

    contentI18n: {
      ...campaign
        .footerTerms
        .contentI18n,

      ...(Array.isArray(
        campaign
          .footerTerms
          .content,
      )
        ? {
            en:
              campaign
                .footerTerms
                .content,
          }
        : {}),
    },
  };
}

// =========================================
// FOOTER REFUND
// =========================================

if (
  campaign.footerRefund
) {
  patch["footerRefund"] = {
    ...campaign.footerRefund,

    labelI18n: {
      ...campaign
        .footerRefund
        .labelI18n,

      ...(campaign
        .footerRefund
        .label
        ? {
            en:
              campaign
                .footerRefund
                .label,
          }
        : {}),
    },

    titleI18n: {
      ...campaign
        .footerRefund
        .titleI18n,

      ...(campaign
        .footerRefund
        .title
        ? {
            en:
              campaign
                .footerRefund
                .title,
          }
        : {}),
    },

    contentI18n: {
      ...campaign
        .footerRefund
        .contentI18n,

      ...(Array.isArray(
        campaign
          .footerRefund
          .content,
      )
        ? {
            en:
              campaign
                .footerRefund
                .content,
          }
        : {}),
    },
  };
}
    // =========================================
    // SEO TITLE
    // =========================================

    if (
      campaign.seoTitle
    ) {
      patch[
        "seoTitleI18n.en"
      ] =
        campaign.seoTitle;
    }

    // =========================================
    // SEO DESCRIPTION
    // =========================================

    if (
      campaign
        .seoDescription
    ) {
      patch[
        "seoDescriptionI18n.en"
      ] =
        campaign
          .seoDescription;
    }

    // =========================================
    // NOTHING TO UPDATE
    // =========================================

    if (
      Object.keys(
        patch,
      ).length === 0
    ) {
      console.log(
        `Skipped ${campaign._id}`,
      );

      continue;
    }

    // =========================================
    // UPDATE SANITY
    // =========================================

    await client
      .patch(
        campaign._id,
      )
      .set(
        patch,
      )
      .commit();

    console.log(
      `Migrated ${campaign._id}`,
    );
  }

  console.log(
    "Migration completed.",
  );
}

run().catch(
  (error) => {
    console.error(
      error,
    );

    process.exit(1);
  },
);
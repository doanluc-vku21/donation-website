import {
  defineField,
  defineType,
} from "sanity";

export const campaignType = defineType({
  name: "campaign",
  title: "Campaign",
  type: "document",

  groups: [
    {
      name: "story",
      title: "Story",
    },
    {
      name: "fundUsage",
      title: "Fund Usage",
    },
    {
      name: "footer",
      title: "Footer",
    },
  ],

  fields: [
    // =========================================================
    // GENERAL
    // =========================================================

    defineField({
      name: "title",
      title: "Campaign title",
      type: "string",
      validation: (rule) =>
        rule.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) =>
        rule.required(),
    }),

    defineField({
      name: "organizationName",
      title: "Organization name",
      type: "string",
    }),

    defineField({
      name: "organizationLogo",
      title: "Organization logo",
      type: "image",

      options: {
        hotspot: true,
      },

      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",

          initialValue:
            "Organization logo",
        }),
      ],
    }),

    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
    }),

    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 4,
    }),

    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",

      options: {
        hotspot: true,
      },

      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
        }),
      ],
    }),

    // =========================================================
    // STORY
    // =========================================================

    defineField({
      name: "storyEyebrow",
      title: "Story eyebrow",
      type: "string",
      group: "story",

      initialValue:
        "Why this matters",
    }),

    defineField({
      name: "storyHeading",
      title: "Story heading",
      type: "string",
      group: "story",

      initialValue:
        "Care today becomes confidence tomorrow.",
    }),

    defineField({
      name: "story",
      title: "Campaign story",
      type: "array",
      group: "story",

      of: [
        {
          type: "block",
        },
      ],
    }),

    defineField({
      name: "nourishmentCard",
      title: "Nourishment card",
      type: "object",
      group: "story",

      options: {
        collapsible: true,
        collapsed: true,
      },

      initialValue: {
        title: "Nourishment",

        description:
          "Consistent access to balanced meals and clean water.",
      },

      fields: [
        defineField({
          name: "title",
          title: "Title",
          type: "string",

          validation: (rule) =>
            rule.required(),
        }),

        defineField({
          name: "description",
          title: "Description",
          type: "text",
          rows: 3,

          validation: (rule) =>
            rule.required(),
        }),
      ],
    }),

    defineField({
      name: "learningCard",
      title: "Learning card",
      type: "object",
      group: "story",

      options: {
        collapsible: true,
        collapsed: true,
      },

      initialValue: {
        title: "Learning",

        description:
          "School materials and supportive places to learn.",
      },

      fields: [
        defineField({
          name: "title",
          title: "Title",
          type: "string",

          validation: (rule) =>
            rule.required(),
        }),

        defineField({
          name: "description",
          title: "Description",
          type: "text",
          rows: 3,

          validation: (rule) =>
            rule.required(),
        }),
      ],
    }),

    defineField({
      name: "steadyCareCard",
      title: "Steady care card",
      type: "object",
      group: "story",

      options: {
        collapsible: true,
        collapsed: true,
      },

      initialValue: {
        title: "Steady care",

        description:
          "Practical help shaped around each local community.",
      },

      fields: [
        defineField({
          name: "title",
          title: "Title",
          type: "string",

          validation: (rule) =>
            rule.required(),
        }),

        defineField({
          name: "description",
          title: "Description",
          type: "text",
          rows: 3,

          validation: (rule) =>
            rule.required(),
        }),
      ],
    }),

    // =========================================================
    // FUND USAGE
    // =========================================================

    defineField({
      name: "fundUsageTitle",
      title: "Section title",
      type: "string",
      group: "fundUsage",

      initialValue:
        "How the funds will be used",
    }),

    defineField({
      name: "fundUsageSubtitle",
      title: "Section subtitle",
      type: "string",
      group: "fundUsage",

      initialValue:
        "The organizer’s plan for the campaign goal.",
    }),

    defineField({
      name: "fundUsageItems",
      title: "Fund usage items",
      type: "array",
      group: "fundUsage",

      of: [
        {
          type: "object",
          name: "fundUsageItem",
          title: "Fund usage item",

          fields: [
            defineField({
              name: "amount",
              title: "Amount",
              type: "number",

              description:
                "Enter amount in dollars. Example: 3000",

              validation: (rule) =>
                rule
                  .required()
                  .min(0),
            }),

            defineField({
              name: "title",
              title: "Title",
              type: "string",

              validation: (rule) =>
                rule.required(),
            }),

            defineField({
              name: "description",
              title: "Description",
              type: "text",
              rows: 6,

              description:
                "Put each detail on a new line if needed.",
            }),
          ],

          preview: {
            select: {
              title: "title",
              amount: "amount",
            },

            prepare({
              title,
              amount,
            }) {
              return {
                title:
                  title ||
                  "Fund usage item",

                subtitle:
                  typeof amount ===
                  "number"
                    ? `$${amount.toLocaleString(
                        "en-US",
                      )}`
                    : "No amount",
              };
            },
          },
        },
      ],

      validation: (rule) =>
        rule.max(20),
    }),

    // =========================================================
    // FOOTER
    // =========================================================

    defineField({
      name: "footerOrganizationName",
      title: "Organization name",
      type: "string",
      group: "footer",

      initialValue:
        "Open Hands Relief",
    }),

    defineField({
      name: "footerSubtitle",
      title: "Organization subtitle",
      type: "string",
      group: "footer",

      initialValue:
        "Sample organization · UI preview",
    }),

    defineField({
      name: "footerSecureText",
      title: "Secure payment text",
      type: "string",
      group: "footer",

      initialValue:
        "Secure payments are processed by Stripe.",
    }),

    defineField({
      name: "footerAbout",
      title: "About",
      type: "object",
      group: "footer",

      options: {
        collapsible: true,
        collapsed: false,
      },

      fields: [
        defineField({
          name: "label",
          title: "Link label",
          type: "string",
          initialValue: "About",
        }),

        defineField({
          name: "title",
          title: "Popup title",
          type: "string",
          initialValue: "About",
        }),

        defineField({
          name: "content",
          title: "Popup content",
          type: "array",

          of: [
            {
              type: "block",
            },
          ],
        }),
      ],
    }),

    defineField({
      name: "footerContact",
      title: "Contact",
      type: "object",
      group: "footer",

      options: {
        collapsible: true,
        collapsed: true,
      },

      fields: [
        defineField({
          name: "label",
          title: "Link label",
          type: "string",
          initialValue: "Contact",
        }),

        defineField({
          name: "title",
          title: "Popup title",
          type: "string",
          initialValue: "Contact",
        }),

        defineField({
          name: "content",
          title: "Popup content",
          type: "array",

          of: [
            {
              type: "block",
            },
          ],
        }),
      ],
    }),

    defineField({
      name: "footerPrivacy",
      title: "Privacy",
      type: "object",
      group: "footer",

      options: {
        collapsible: true,
        collapsed: true,
      },

      fields: [
        defineField({
          name: "label",
          title: "Link label",
          type: "string",
          initialValue: "Privacy",
        }),

        defineField({
          name: "title",
          title: "Popup title",
          type: "string",
          initialValue:
            "Privacy Policy",
        }),

        defineField({
          name: "content",
          title: "Popup content",
          type: "array",

          of: [
            {
              type: "block",
            },
          ],
        }),
      ],
    }),

    defineField({
      name: "footerTerms",
      title: "Terms",
      type: "object",
      group: "footer",

      options: {
        collapsible: true,
        collapsed: true,
      },

      fields: [
        defineField({
          name: "label",
          title: "Link label",
          type: "string",
          initialValue: "Terms",
        }),

        defineField({
          name: "title",
          title: "Popup title",
          type: "string",
          initialValue:
            "Terms & Conditions",
        }),

        defineField({
          name: "content",
          title: "Popup content",
          type: "array",

          of: [
            {
              type: "block",
            },
          ],
        }),
      ],
    }),

    defineField({
      name: "footerRefund",
      title: "Refund policy",
      type: "object",
      group: "footer",

      options: {
        collapsible: true,
        collapsed: true,
      },

      fields: [
        defineField({
          name: "label",
          title: "Link label",
          type: "string",

          initialValue:
            "Refund policy",
        }),

        defineField({
          name: "title",
          title: "Popup title",
          type: "string",

          initialValue:
            "Donation / Refund Policy",
        }),

        defineField({
          name: "content",
          title: "Popup content",
          type: "array",

          of: [
            {
              type: "block",
            },
          ],
        }),
      ],
    }),

    // =========================================================
    // DONATION
    // =========================================================

    defineField({
      name: "goalAmount",
      title: "Donation goal",
      type: "number",

      validation: (rule) =>
        rule.min(0),
    }),

    defineField({
      name: "currency",
      title: "Currency",
      type: "string",

      initialValue: "USD",

      options: {
        list: [
          {
            title: "USD",
            value: "USD",
          },
          {
            title: "EUR",
            value: "EUR",
          },
          {
            title: "GBP",
            value: "GBP",
          },
          {
            title: "CAD",
            value: "CAD",
          },
          {
            title: "AUD",
            value: "AUD",
          },
        ],
      },
    }),

    defineField({
      name: "isActive",
      title: "Active campaign",
      type: "boolean",

      initialValue: true,
    }),

    // =========================================================
    // SEO
    // =========================================================

    defineField({
      name: "seoTitle",
      title: "SEO title",
      type: "string",
    }),

    defineField({
      name: "seoDescription",
      title: "SEO description",
      type: "text",
      rows: 3,
    }),
  ],

  preview: {
    select: {
      title: "title",
      subtitle:
        "organizationName",

      media:
        "organizationLogo",
    },
  },
});
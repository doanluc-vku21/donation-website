import {
  defineField,
  defineType,
} from "sanity";

function languageFields() {
  return [
    defineField({
      name: "en",
      title: "English",
      type: "string",
    }),

    defineField({
      name: "fr",
      title: "French",
      type: "string",
    }),

    defineField({
      name: "de",
      title: "German",
      type: "string",
    }),

    defineField({
      name: "es",
      title: "Spanish",
      type: "string",
    }),

    defineField({
      name: "ar",
      title: "Arabic",
      type: "string",
    }),
  ];
}

export const localeStringType =
  defineType({
    name: "localeString",
    title: "Localized string",
    type: "object",

    options: {
      aiAssist: {
        translateAction: true,
      },
    },

    fields: languageFields(),
  });

export const localeTextType =
  defineType({
    name: "localeText",
    title: "Localized text",
    type: "object",

    options: {
      aiAssist: {
        translateAction: true,
      },
    },

    fields: [
      defineField({
        name: "en",
        title: "English",
        type: "text",
        rows: 5,
      }),

      defineField({
        name: "fr",
        title: "French",
        type: "text",
        rows: 5,
      }),

      defineField({
        name: "de",
        title: "German",
        type: "text",
        rows: 5,
      }),

      defineField({
        name: "es",
        title: "Spanish",
        type: "text",
        rows: 5,
      }),

      defineField({
        name: "ar",
        title: "Arabic",
        type: "text",
        rows: 5,
      }),
    ],
  });

export const localePortableTextType =
  defineType({
    name: "localePortableText",
    title: "Localized rich text",
    type: "object",

    options: {
      aiAssist: {
        translateAction: true,
      },
    },

    fields: [
      defineField({
        name: "en",
        title: "English",
        type: "array",
        of: [
          {
            type: "block",
          },
        ],
      }),

      defineField({
        name: "fr",
        title: "French",
        type: "array",
        of: [
          {
            type: "block",
          },
        ],
      }),

      defineField({
        name: "de",
        title: "German",
        type: "array",
        of: [
          {
            type: "block",
          },
        ],
      }),

      defineField({
        name: "es",
        title: "Spanish",
        type: "array",
        of: [
          {
            type: "block",
          },
        ],
      }),

      defineField({
        name: "ar",
        title: "Arabic",
        type: "array",
        of: [
          {
            type: "block",
          },
        ],
      }),
    ],
  });
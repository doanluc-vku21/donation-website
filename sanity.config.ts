"use client";

import {
  visionTool,
} from "@sanity/vision";

import {
  defineConfig,
} from "sanity";

import {
  structureTool,
} from "sanity/structure";

import {
  assist,
} from "@sanity/assist";

import {
  apiVersion,
  dataset,
  projectId,
} from "./sanity/env";

import {
  schema,
} from "./sanity/schemaTypes";

import {
  structure,
} from "./sanity/structure";

export default defineConfig({
  basePath: "/studio",

  projectId,

  dataset,

  schema,

  plugins: [
    structureTool({
      structure,
    }),

    visionTool({
      defaultApiVersion:
        apiVersion,
    }),

    assist({
      translate: {
        field: {
          documentTypes: [
            "campaign",
          ],

          languages: [
            {
              id: "en",
              title:
                "English",
            },
            {
              id: "fr",
              title:
                "French",
            },
            {
              id: "de",
              title:
                "German",
            },
            {
              id: "es",
              title:
                "Spanish",
            },
            {
              id: "ar",
              title:
                "Arabic",
            },
          ],

          maxPathDepth: 12,
        },

        styleguide:
          "Translate accurately and naturally. Preserve meaning, names, currency amounts, donation amounts, organization names, and URLs. Do not add new facts. Use a compassionate, trustworthy nonprofit fundraising tone.",
      },
    }),
  ],
});
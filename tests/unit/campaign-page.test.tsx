import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  CampaignPage,
} from "@/components/campaign/campaign-page";

import {
  sampleCampaign,
} from "@/lib/sample-data";

import type {
  SanityCampaign,
} from "@/sanity/types/campaign";

const sanityContent:
  SanityCampaign = {
  _id:
    "campaign-content",

  title:
    sampleCampaign.title,

  slug:
    "give-a-child-a-brighter-tomorrow",
};

describe(
  "CampaignPage",
  () => {
    it(
      "renders the campaign page",
      () => {
        render(
          <CampaignPage
            campaign={
              sampleCampaign
            }
            content={
              sanityContent
            }
            locale="en"
            currency="USD"
            exchangeRate={
              1
            }
          />,
        );

        expect(
          screen.getByRole(
            "heading",
            {
              level: 1,
              name:
                sampleCampaign.title,
            },
          ),
        ).toBeVisible();
      },
    );

    it(
      "uses original sample campaign media",
      () => {
        render(
          <CampaignPage
            campaign={
              sampleCampaign
            }
            content={
              sanityContent
            }
            locale="en"
            currency="USD"
            exchangeRate={
              1
            }
          />,
        );

        expect(
          screen.getByRole(
            "img",
            {
              name:
                sampleCampaign.title,
            },
          ),
        ).toHaveAttribute(
          "src",
          expect.stringContaining(
            "sample-campaign-hero.svg",
          ),
        );
      },
    );
  },
);

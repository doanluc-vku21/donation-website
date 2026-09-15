import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CampaignStory } from "@/components/campaign/campaign-story";
import { sampleCampaign } from "@/lib/sample-data";
import type { SanityCampaign } from "@/sanity/types/campaign";

type StoryContent = Pick<
  SanityCampaign,
  | "story"
  | "storyEyebrow"
  | "storyHeading"
  | "nourishmentCard"
  | "learningCard"
  | "steadyCareCard"
>;

describe("CampaignStory", () => {
  it("renders the complete Story copy from Sanity", () => {
    const content: StoryContent = {
      storyEyebrow: "A custom story label",
      storyHeading: "A custom story heading",
      nourishmentCard: {
        title: "Custom nourishment",
        description: "Custom nourishment description.",
      },
      learningCard: {
        title: "Custom learning",
        description: "Custom learning description.",
      },
      steadyCareCard: {
        title: "Custom steady care",
        description: "Custom steady care description.",
      },
    };

    render(
      <CampaignStory
        campaign={sampleCampaign}
        content={content}
      />,
    );

    expect(
      screen.getByText("A custom story label"),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "A custom story heading",
      }),
    ).toBeVisible();
    expect(
      screen.getByText("Custom nourishment"),
    ).toBeVisible();
    expect(
      screen.getByText("Custom nourishment description."),
    ).toBeVisible();
    expect(
      screen.getByText("Custom learning"),
    ).toBeVisible();
    expect(
      screen.getByText("Custom learning description."),
    ).toBeVisible();
    expect(
      screen.getByText("Custom steady care"),
    ).toBeVisible();
    expect(
      screen.getByText("Custom steady care description."),
    ).toBeVisible();
  });

  it("uses the existing Story copy when new Sanity fields are missing", () => {
    render(
      <CampaignStory
        campaign={sampleCampaign}
        content={{}}
      />,
    );

    expect(
      screen.getByText("Why this matters"),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Care today becomes confidence tomorrow.",
      }),
    ).toBeVisible();
    expect(
      screen.getByText("Nourishment"),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Consistent access to balanced meals and clean water.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText("Learning"),
    ).toBeVisible();
    expect(
      screen.getByText(
        "School materials and supportive places to learn.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText("Steady care"),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Practical help shaped around each local community.",
      ),
    ).toBeVisible();
  });
});

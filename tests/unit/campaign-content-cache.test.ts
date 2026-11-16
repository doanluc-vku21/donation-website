// @vitest-environment node
import { describe, expect, it } from "vitest";
import { campaignContentCache } from "@/lib/queries/campaign-content-cache";

describe("campaign content cache", () => {
  it("revalidates editorial content on a one-minute window", () => {
    expect(campaignContentCache("give-a-child-a-brighter-tomorrow")).toEqual({
      next: {
        revalidate: 60,
        tags: ["campaign", "campaign:give-a-child-a-brighter-tomorrow"],
      },
    });
  });

  it("tags each campaign separately so one publish drops one entry", () => {
    expect(campaignContentCache("akram-shake").next.tags)
      .not.toEqual(campaignContentCache("give-a-child-a-brighter-tomorrow").next.tags);
  });
});

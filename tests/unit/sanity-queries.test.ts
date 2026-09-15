import { describe, expect, it } from "vitest";

import { CAMPAIGN_QUERY } from "@/sanity/lib/queries";

describe("CAMPAIGN_QUERY", () => {
  it("projects all editable Story fields", () => {
    const normalizedQuery = CAMPAIGN_QUERY.replace(/\s+/g, " ");

    expect(normalizedQuery).toContain("storyEyebrow");
    expect(normalizedQuery).toContain("storyHeading");
    expect(normalizedQuery).toContain(
      "nourishmentCard { title, description }",
    );
    expect(normalizedQuery).toContain(
      "learningCard { title, description }",
    );
    expect(normalizedQuery).toContain(
      "steadyCareCard { title, description }",
    );
  });
});

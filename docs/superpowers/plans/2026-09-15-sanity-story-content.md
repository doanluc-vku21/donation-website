# Sanity Story Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the complete campaign Story copy editable in Sanity while retaining the three fixed card icons and current layout.

**Architecture:** Extend the campaign schema and GROQ projection with two Story heading fields and three named card objects. Pass the typed CMS content into `CampaignStory`, which uses current copy as backward-compatible field-level fallbacks.

**Tech Stack:** Next.js 16 App Router, React 19, Sanity 5, next-sanity, Portable Text, Vitest, Testing Library.

---

### Task 1: Define and query Story content

**Files:**
- Modify: `sanity/schemaTypes/campaign.ts`
- Modify: `sanity/lib/queries.ts`
- Modify: `sanity/types/campaign.ts`
- Test: `tests/unit/sanity-queries.test.ts`

- [ ] **Step 1: Write the failing query contract test**

Assert that `CAMPAIGN_QUERY` projects `storyEyebrow`, `storyHeading`, and each named card object with `title` and `description`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- tests/unit/sanity-queries.test.ts`

Expected: FAIL because the new Story fields are absent from the projection.

- [ ] **Step 3: Add the minimal schema and data contract**

Use `defineField` for `storyEyebrow`, `storyHeading`, and the three named object fields. Each object contains required string fields named `title` and `description`. Assign all Story fields, including existing `story`, to a `story` field group. Add matching optional properties to `SanityCampaign`.

- [ ] **Step 4: Project the new fields**

Add this shape to `CAMPAIGN_QUERY`:

```groq
storyEyebrow,
storyHeading,
nourishmentCard { title, description },
learningCard { title, description },
steadyCareCard { title, description },
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `npm test -- tests/unit/sanity-queries.test.ts`

Expected: PASS.

### Task 2: Render editable Story copy with safe fallbacks

**Files:**
- Modify: `components/campaign/campaign-story.tsx`
- Modify: `components/campaign/campaign-page.tsx`
- Test: `tests/unit/campaign-story.test.tsx`
- Test: `tests/unit/campaign-page.test.tsx`

- [ ] **Step 1: Write failing component tests**

Render `CampaignStory` with CMS values and assert the CMS eyebrow, heading, and all six card strings are visible. Render it without the new fields and assert the current English eyebrow, heading, card titles, and descriptions remain visible.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- tests/unit/campaign-story.test.tsx tests/unit/campaign-page.test.tsx`

Expected: FAIL because `CampaignStory` does not accept or render the new fields and the page test lacks required Sanity content.

- [ ] **Step 3: Implement the typed rendering path**

Replace the module-level hard-coded card array with fixed icon definitions combined with CMS field values. Accept `content: Pick<SanityCampaign, "story" | "storyEyebrow" | "storyHeading" | "nourishmentCard" | "learningCard" | "steadyCareCard">`. Use nullish or non-empty string fallbacks to current copy. Continue using the Supabase campaign story when Portable Text is empty.

- [ ] **Step 4: Wire the content object through CampaignPage**

Pass `content={content}` to both mobile and desktop `CampaignStory` instances. Update the campaign page test fixture to pass the minimum valid `SanityCampaign`.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- tests/unit/campaign-story.test.tsx tests/unit/campaign-page.test.tsx`

Expected: PASS.

### Task 3: Verify the integration

**Files:**
- Verify all modified production and test files.

- [ ] **Step 1: Run all unit tests**

Run: `npm test`

Expected: all tests PASS without runtime errors.

- [ ] **Step 2: Run static checks**

Run: `npm run typecheck`
Run: `npm run lint`

Expected: both commands exit 0.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: build exits 0 and includes the homepage and Studio route.

- [ ] **Step 4: Review the final diff**

Run: `git diff --check` and inspect only the intended Story/schema/query/test changes.

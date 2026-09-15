# Sanity-managed campaign story

## Goal

Allow clients to edit the complete Story section in Sanity while preserving the existing layout and three fixed icons.

## Content model

Add `storyEyebrow` and `storyHeading` strings to the campaign document. Keep the existing Portable Text `story` field. Add three named objects-`nourishmentCard`, `learningCard`, and `steadyCareCard`-each with required `title` and `description` strings.

Named objects prevent deletion or reordering and keep each fixed icon attached to its intended card. Group all Story fields together in Studio.

## Data flow and compatibility

Project the new fields in the campaign GROQ query, type them in `SanityCampaign`, and pass them from `CampaignPage` to `CampaignStory`. The component renders Sanity values when present and falls back to the current English copy for existing documents. Empty Portable Text continues to fall back to the Supabase campaign story.

## Testing

Add component coverage for CMS-provided Story headings and card copy, plus fallback coverage. Run unit tests, typecheck, lint, and production build.

## Out of scope

Icons, card order, card count, styling, layout, and unrelated hard-coded content remain controlled by the application.

# Akram direct page headline and description — 2026-11-02

## Requested scope

The user clarified: “Change the headline, description. That it.” This update is
limited to `/akram-shake-1` and uses the headline and summary already supplied for
the newer Akram page in all five supported languages.

- Headline: “❤️ Help More People Like Akram Build a Better Future”.
- Description begins: “Akram's story is just one of many.” The complete summary
  is the first paragraph from the approved Akram community copy.
- Add page-specific HTML title/description, Open Graph and Twitter metadata,
  the existing campaign hero image, and the canonical URL for this entry page.

The original localized story, fund allocations, monetary progress, donation
presets, one-time/monthly choices, and Stripe Hosted Checkout are retained.
No shared CMS document, other page, payment endpoint, wallet warm-up policy,
database, environment variable, or attribution configuration is changed.

## Cause and implementation

Before the change, the live entry page inherited the root layout's generic
“Give a Child a Brighter Tomorrow | Open Hands Relief” title and child-campaign
description. It did not provide its own Open Graph metadata. The screenshot's
share card therefore did not describe Akram's campaign.

The entry page now supplies metadata from the same localized headline and
description it passes to the page renderer. React's request-scoped cache shares
the CMS content lookup between metadata generation and rendering. Metadata
generation does not query donor/supporter records.

## Validation and release

- 61 relevant tests pass, including preview fields and canonical URL, Arabic
  metadata, unavailable CMS content, unchanged story/fund/campaign data, both
  donation frequencies, and continued disabled wallet warm-up on the direct page.
- ESLint with zero warnings, type checking, and a production build use isolated
  placeholder environment values. No real charge or donor email is used.
- A fresh full-suite baseline before application edits retains the existing
  eight unrelated failures; focused validation is reported separately.

Publish through the previously authorized commit/push/deploy workflow for
`darklife / donation-website`. Verify the live HTML with a link-crawler user agent
as well as the visible headline. Rollback is the previous production deployment
for `eca4b61`; there are no data or CMS migrations to reverse.

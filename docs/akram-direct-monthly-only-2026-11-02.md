# Akram direct page: monthly donations only — 2026-11-02

The user subsequently requested removing one-time donations from
`/akram-shake-1`. This supersedes the donation-frequency scope recorded in
`akram-direct-headline-preview-2026-11-02.md`.

## Change

- Add this entry page to the existing monthly-only presentation policy. Its
  donation form displays Monthly alone, including after closing and reopening.
- Reject one-time requests in its Hosted Checkout endpoint before creating any
  Stripe Session. The endpoint's canonical direct-page mapping also applies when
  the browser omits or supplies an untrusted campaign path.
- Preserve `/akram-shake-1` in the embedded card and wallet endpoint allowlists,
  so their existing monthly-only check also applies to this entry path.
- Retain the existing Hosted Checkout flow and disabled background wallet/card
  initialization on this direct page. Monthly subscriptions, custom amounts,
  currency conversion, fee contribution, accounting metadata, and return paths
  keep their existing behavior.

No existing subscription is changed or cancelled. Earlier Akram entry pages
retain their existing donation choices; unrelated Hosted Checkout campaigns
retain one-time donations. Headline, summary, sharing metadata, story, funds,
and progress are unchanged by this follow-up.

## Validation and release

Relevant checks cover monthly-only UI, close/reopen behavior, no hosted-page
wallet prefetch, one-time rejection across all three checkout endpoints, USD/GBP
monthly subscriptions, exact fee contribution, canonical return paths, and
one-time checkout on unaffected pages. External payment services are mocked;
validation does not make a charge or send a donor email.

All 72 focused tests pass, along with ESLint with zero warnings, type checking,
and a complete production build using isolated placeholder configuration. The
full suite has 206 passing tests and the same eight unrelated failures recorded
in the preceding baseline (campaign-page router setup, campaign-story cards,
legacy donation-panel expectations, and Meta Pixel setup).

Deployment uses the authorized `origin/main` workflow for Vercel project
`darklife / donation-website`, serving `donate.mealsupport.org`. Roll back to the
previous successful deployment for `45d2254` if necessary. No database migration,
CMS write, environment update, or Stripe account setting is required.

# Palestine monthly donation entry pages — 2026-11-01

## Scope

The requested changes apply to both `/gaza-food` and the new `/akram-shake-3`.
The companion `/gaza-food/donate` page uses the same copy and monthly-only policy.

- Remove the Give once option and retain the existing monthly payment flow.
- Headline: “🇵🇸 ❤️ Bring Hope and Relief to Palestine”.
- Story label: “Why this matters”.
- Story heading: “🇵🇸 ❤️ Every Life Matters. Every Act of Kindness Brings Hope.”
- Replace the story with the supplied six paragraphs, including the $25/month
  message. This message does not change preset amounts or lock the donation amount.
- Include English, French, German, Spanish, and Arabic copy; render Arabic stories
  right to left.

The new Akram entry page retains the original `akram-shake` Supabase campaign,
Sanity media, goal, donations, and accounting. The Gaza page retains its existing
`give-a-child-a-brighter-tomorrow` campaign. Page-specific copy is applied through
the existing localization helper without changing the shared CMS documents.
Existing Akram entry pages, including `/akram-shake-2`, retain their copy and
one-time donation options.

Both embedded card and Express Checkout reject one-time requests for the affected
pages. Monthly Checkout Sessions preserve `campaign_path` for the new Akram entry,
use subscription mode with a monthly recurring price, and retain the original
campaign slug in payment/subscription metadata. Wallet preloading, amount reuse,
fee calculation, webhooks, email, and Meta attribution are unchanged.

## Validation

- Targeted coverage: 61 tests pass across the monthly-page, content, checkout,
  and wallet-loading suites. Checks cover removal of Give once, modal reopen,
  monthly requests, subscription metadata, charged minor units, local-currency
  custom amounts with fees, existing Akram one-time behavior, content isolation,
  missing-campaign handling, and Arabic story direction.
- ESLint passes with zero warnings. Type checking passes.
- A complete Next.js production build passes using isolated placeholder values
  for the variables listed in `.env.example`. The build includes
  `/akram-shake-3`. It does not establish production service connectivity or
  successful payment processing.
- The full suite before the changes had 130 passing tests and eight failures.
  The same eight failures remain after the changes: two campaign-page router
  setup failures, two campaign-story expectations for removed cards, three
  legacy donation-panel expectations, and one Meta Pixel setup expectation.
  These unrelated failures were not changed as part of this request.
- Validation used no real charges, donor emails, or CMS/database writes.

## Release and rollback

The user authorized committing, pushing, and deploying this change on 2026-11-01.
The repository's Vercel integration deploys `origin/main` to the existing
`darklife / donation-website` production project serving `donate.mealsupport.org`.
The preceding successful production deployment is `26ThmY5SPakfz9YzSFoVwagQdd6x`
(commit `6f2527b`), verified through GitHub deployment/status records before pushing.
Check both entry pages,
their mobile/desktop donation forms, localized content, and monthly Session
metadata. Native wallet/payment confirmation remains a separate verification;
mocked regression tests do not establish real-device behavior.

Rollback by restoring the previous Vercel deployment. There are no CMS or database
migrations to reverse.

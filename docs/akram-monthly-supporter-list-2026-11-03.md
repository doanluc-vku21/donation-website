# Akram monthly supporter list — 2026-11-03

## Change

On `/akram-shake-3`, the community list now uses the same successful monthly
supporters as the progress indicator. Previously its badge counted recent
payment records, including other donation frequencies and repeat payments.

- Fetch successful monthly donations with pagination and resolve historical
  subscription records using the existing donor/subscription deduplication rules.
- Keep each supporter's latest successful payment, ordered newest first. Derive
  the progress count from this same list rather than a separate query.
- Use monthly-supporter wording for the title, badge and modal controls in all
  five languages. Stack the longer title and badge on small screens.
- Keep anonymous names private and donor/subscription identifiers server-side.
  Public amounts use the existing normalized USD minor units and currency helper.
- Show zero only after a successful empty query. On query failure, both progress
  and community sections show unavailable without reusing the old donation list.

This remains a cumulative count of people who have paid monthly, rather than a
count of currently active subscriptions. Other campaign entry pages retain their
contribution lists and payment counts. Relative-time formatting is shared with
the existing campaign query without changing its output.

## Validation

- 46 tests pass across the supporter query, community list, monthly entry routes,
  progress displays and Akram monthly content. Coverage includes renewals,
  multiple subscriptions, historical missing donor IDs, more than 1000 supporters,
  anonymity, failed/partial queries, zero, five languages and modal controls.
- ESLint with zero warnings, TypeScript and a production build pass. The build
  uses isolated placeholder service configuration with CAPI disabled.
- A fresh full-suite baseline before edits had 237 passing and six failing tests,
  plus a campaign-page suite initialization error for the missing Stripe public
  key. After edits, 249 pass with the same six failures and initialization error.
  Those failures are in campaign-story, donation-panel and Meta Pixel setup.

Local validation performed no production deployment, database/CMS write, real
charge or donor email. Counts and presentation have mocked coverage; native
device rendering was not verified.

## Authorized release

The user subsequently authorized commit, push and production deployment. The
verified target is `darklife / donation-website`
(`prj_Rf04c904XCMzz2JHgfapVx5Qnt8k`), serving `donate.mealsupport.org`.
Before release, the live page returned HTTP 200 with 20 monthly supporters and
83 contributions. Rollback is the preceding production deployment
`dpl_5E7AugHrSxmw3JokuRUHXtHpwrcp` for commit `d436ca9`, available at
`donation-website-27kc777m0-darklife.vercel.app`. There are no data or CMS
migrations to reverse. Deployment status and live verification are reported
in the release handoff.

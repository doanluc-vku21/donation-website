# Production rebuild and verification — 2026-11-10

## Published result

The owner authorized publishing the latest code and checking the live result.
The source was clean `main` at `ca8878a6a4124fa64c42700963158d0f08015bde`,
matching a fresh fetch of `origin/main`. Before this operation, the formal
domain already served that same Git revision through deployment
`dpl_2j4H4AChCmY35Rto681WHKN562Jr`.

The release rebuilt an exact Git archive of that revision in an isolated,
ignored directory. A dry-run source inventory contained 209 uploaded files;
local credentials, installed dependencies and diagnostic files were excluded.
No application source, production configuration, CMS content or database
records were changed by the release process.

- Project: `darklife/donation-website`.
- Project ID: `prj_Rf04c904XCMzz2JHgfapVx5Qnt8k`.
- Environment: Production.
- Deployment: `dpl_5BcJJxMkb4HPzj9oQ5fSU7k1DoZs`.
- Candidate URL: <https://donation-website-crxmc6o8g-darklife.vercel.app>.
- Build state: READY; cloud build passed.
- Formal domain: <https://donate.mealsupport.org>.
- The candidate was staged without domain assignment, checked, then promoted.
  A subsequent domain inspection resolved the exact new deployment.

## Validation

Local checks used the committed lockfile and npm 12.2.1. The computer's default
Node 24.13.0 produced an engine warning during installation; checks then ran
with an isolated Node 24.22.1 runtime. No global Node upgrade was performed.
Unit tests used placeholder service configuration and mocked external calls.

- ESLint with zero warnings: passed.
- Type checking: passed. Its generated tracked compiler-cache change was
  restored afterward.
- Full suite: **396 passed, 7 failed, 403 total**. Failures comprise two
  campaign-page router-context failures, two campaign-story copy assertions
  and three donation-panel assertions. These are the same named cases in the
  reproduced baseline documented in `mango-seller-one-time-minimum-2026-11-10.md`.
  Their three test files and corresponding components are unchanged between
  that baseline (`f8bb1a7`) and the release revision. The suite is not fully green.
- All payment, webhook and Meta test files passed in that full-suite run.
- Authenticated candidate checks returned HTTP 200 for street-vendor and
  mango-seller English/USD pages and street-vendor Arabic/EUR.
- The same three formal-domain checks returned HTTP 200 without Vercel bypass.
  Parsed campaign props confirmed locale/currency and single-gift presets of
  2,000 / 5,000 / 7,500 USD cents on both campaign pages.
- Street-vendor rendered `742 donors`, with the previous fixed `700+` label
  absent. The count retains the implementation's historical base and display
  seed entries; it is not an exclusively payment-confirmed online donor count.
- Candidate and public `/api/stripe/checkout` checks rejected USD 19.99 on both
  campaigns with HTTP 400 and the expected USD 20 minimum message. These checks
  supplied no donor identity and did not create below-minimum payment Sessions.
- A real browser on the formal domain displayed the street-vendor donation
  modal, monthly and single-gift controls, the single-gift USD 20 / 50 / 75
  presets, USD 20 minimum hint, custom USD 20 total and card button. Apple Pay
  and Google Pay buttons rendered after ordinary wallet preparation. No wallet
  confirmation, card submission, donor identity or real charge was used.
- The checked public stylesheet and two Next.js JavaScript assets returned 200.
- Rendered pages contained the configured primary browser Pixel ID. This does
  not establish Meta receipt, CAPI donor-field coverage, deduplication or EMQ.
- The new deployment's runtime error/fatal query returned zero records for
  2026-11-10 13:57:00–14:12:00 UTC, with no excluded intervals or further page.
  This is a bounded observation, not a guarantee about future traffic.

No real donor emails, synthetic Purchase events or historical payment replays
were sent. Genuine payment completion, real-device wallet behavior and Meta's
receipt of the new CAPI matching fields remain unverified.

## Evidence and rollback

Restricted, ignored `.local/release-2026-11-10/` contains the source archive,
dry-run inventories, full-suite report, candidate/public response checks and
bounded runtime-log summary. Do not publish response snapshots or credentials.

To restore the preceding production build within the same project, promote
`dpl_2j4H4AChCmY35Rto681WHKN562Jr` using the existing authorized Vercel account
and `--scope darklife`, then inspect the formal domain and repeat public checks.
No migration or configuration rollback is needed. This rollback was recorded,
not executed.

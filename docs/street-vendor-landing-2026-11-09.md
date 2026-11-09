# Street vendor landing page — 2026-11-09

## Scope and content

Prepared a separate `/help-street-vendor` route using the existing campaign
layout and donation flow. The supplied mountain portrait is
`public/street-vendor.jpg`; the mango seller's portrait and campaign identity
remain separate. The mobile hero has a page-specific crop to keep the new
beneficiary's face visible.

The requested English headline is:

> ❤️ He Works Hard Every Day to Support His Family. Now It’s Our Turn to Help Him.

Initial English, French, German, Spanish and Arabic copy uses only the supplied
headline's background, with general support language. It is a draft for review.
It does not claim a disability, mango selling, medical needs, a verified
biography or a $2,500 monthly commitment. A separately authored CMS story,
allocations, goal and portrait can replace the initial fallback.

The user subsequently confirmed a **$2,500 USD campaign goal**, stored as
250,000 minor units. This is the campaign fundraising goal, not a commitment to
provide $2,500 every month. The initialization script now defaults to this
confirmed amount, and the local CMS draft and previews use it.

The new page loads only `help-street-vendor` accounting and donation options.
Missing/inactive accounting returns not-found; it never substitutes the mango
seller's totals, campaign ID, seed donations or donor names. Share metadata uses
the new title, canonical path and supplied portrait.

The existing minimums and checkout behavior apply: $25 one-time and $20 monthly
(or the converted equivalent), optional names, monthly upsell, and existing
card/wallet confirmation. Presets prepared for initialization are $25/$50/$75
one-time and $25/$50/$100 monthly. Existing signed wallet updates, fee
calculation, paid-webhook accounting and receipt/Meta deduplication are reused.

## Performance work and limits

The old entry loaded accounting before content/currency. Its CMS fallback also
made a second sequential request for organization branding. Both beneficiary
pages now start independent accounting, content, locale and currency work
together. A combined CMS query retrieves the beneficiary document and a narrow
organization branding projection in one round trip. Request-local React cache
shares CMS work with metadata generation; personalized HTML and donation totals
remain uncached across visitors.

Read-only production checks found the old page returning HTTP 200 and the new
route unavailable. The existing production deployment was Ready in `iad1`,
with a matching public domain. A public HTML request took 3.65 seconds in this
environment, including connection and body transfer; this is **not an LCP
measurement**. A remote PageSpeed API request did not establish a connection
and was stopped. No current US LCP score or before/after improvement has been
verified. Repeat the same US mobile/desktop measurements after an authorized
deployment, retaining the full reports and LCP phase breakdown.

## Meta findings and remaining investigation

Public HTML initializes primary Pixel `1116237120993773`, consistent with the
current CAPI configuration and the screenshot. `.env.example` and the old
bootstrap test still described the earlier two-Pixel setup. Updated the example
and tests to match the current single-primary implementation. Removed obsolete
commented configuration; production tracking settings were not changed.

The isolated browser queues exactly `init` for this dataset and one `PageView`.
Repository callers use named `PageView`, `InitiateCheckout` and `Purchase`
events; no `_missing_event` emitter was found. Paid Purchase gating, matching
browser/server IDs, normalized matching data and retry tests pass.

The screenshot alone does not identify the cause of the dashboard warning or
the source of `_missing_event`. No connected Meta Events Manager session/tool
was available. Remaining administrator checks:

1. Open Donation Pixel 2 → Diagnostics and record the exact active warning,
   affected event, last occurrence and sample source URL.
2. Inspect `_missing_event` details for the sending URL, integration and event
   parameters; do not assume the donation site is the source.
3. Use Test Events with isolated Stripe test configuration to check Purchase
   coverage and deduplication, following `meta-capi-runbook.md`.
4. Check for another Purchase sender before changing any integration.

No production test events, historical payment replays, charges or emails were
sent. Event match quality changes and resolution of the Meta warning remain
unverified.

## Validation

Used Node 24.15.0 and the committed npm version, 12.2.1, without changing
dependencies or lockfiles.

- Lint with `--max-warnings 0`: passed.
- Type checking: passed.
- Thirteen relevant unit test files: **220 tests passed**, including campaign
  isolation, concurrent loading, provisioning retries, fee/currency/amount
  handling, signed wallet minimums and Meta behavior.
- Full unit suite with an explicitly local placeholder Stripe public key:
  **377 passed, 7 failed, 384 total**. All seven failures were reproduced in an
  untouched current HEAD archive: two campaign-page assertions, two
  campaign-story assertions and three donation-panel assertions. That baseline
  also failed the obsolete two-Pixel test, which now passes. No new full-suite
  failures were introduced.
- Production build: passed with isolated placeholder environment values. This
  validates compilation/page generation, not production credentials or payments.
- Combined GROQ query: parsed successfully offline with the installed parser.
- Built Next.js route served HTTP 200 with local CMS/Supabase fixtures. Browser
  checks passed at 390px, 1440px, 320px and Arabic RTL, with no horizontal
  overflow or page errors. The $24/$25 one-time and $19/$20 monthly boundaries
  and Escape-to-close passed. Wallet preparation requests used the independent
  fixture campaign ID and new slug/path. External services and payment APIs
  were blocked in browser verification.

The initial layout screenshots used a $1,000 local fixture goal. They were
regenerated with the subsequently confirmed $2,500 goal; donation totals remain
local zero-history fixtures. Reports, fixture configuration, local CMS draft
and screenshots are under ignored
`.local/help-street-vendor/`; test baselines are under ignored `.local/`.

## Release prerequisites and rollback

The user subsequently requested publication and testing. The intended release
is the new page with the confirmed $2,500 goal and reviewed draft content.
No production database/CMS writes, tracking changes, pushes or deployments have
yet succeeded.

`scripts/provision-street-vendor.ts` defaults to generating only a local inactive
CMS draft, without credentials or remote writes:

```sh
npx tsx scripts/provision-street-vendor.ts
```

For an authorized release, use `--apply` in the confirmed production project's
environment. The default goal is 250,000 USD cents ($2,500); a separately approved
goal change can be passed with `--goal-usd-cents=<confirmed integer>`. The script requires
the exact project ID and database origin, initializes an inactive independent
campaign, verifies donation options, and reads back the result. Add `--activate`
only when activation is approved. Repeated runs fill missing options without
overwriting an existing goal, campaign, payment history or preset. It is not
attached to the build command. No Sanity import is required for the fallback
content or local portrait.

The prior mango-seller release record documents missing `service_role` INSERT
privileges for `campaigns` and `donation_options`; bypassing RLS did not grant
INSERT. This is historical evidence to recheck, not a fresh permission audit.
If those privileges are unchanged, an administrator can initialize the approved
project through `scripts/setup-street-vendor.sql` in Supabase project
`tykwnwjmokbdnkqszqrh`. The transaction uses an advisory lock, validates the
independent identity/goal, fills missing presets, reads them back and activates
only `help-street-vendor`. It changes no grants, policies or donation history.

## Publication attempt and fresh checks

The publication preflight could list the `darklife` team but could not resolve
the previously confirmed project ID or live deployment: both returned HTTP 404,
and the team's filtered project list was empty. A Vercel team access request
was generated and returned `requires_user_action`. No deployment was submitted
without resolving the intended project first. The local CLI and its login were
unavailable as a fallback.

Fresh public HTTP checks still return 404 for `/help-street-vendor` and 200 for
`/help-mango-seller`. Lint with zero warnings, type checking, all 220 relevant
tests and the isolated production build pass. The build used local placeholder
configuration, so it does not establish production provisioning or publication.

After the user manually completed the team access page, the browser context
reported `/sso/session-requests/done`. The connection still returned 404 for the
known project by ID/name and for the production deployment/domain alias. The
authenticated account and `darklife` team match the earlier release records,
but listing all projects in that team returned an empty list. The repository's
remote `main` remains at `3e2162331df050d2b3fcbe4f26d6bebb1d76cf89`.
Fresh public responses still show the old campaign as HTTP 200, hosted on
Vercel, and the new route as HTTP 404. This establishes a remaining discrepancy
in project visibility or ownership, not a failed user authorization or proof
that the project was deleted. No new deployment was submitted to an unverified
target. The administrator was asked to confirm the current project dashboard
URL and team instead of repeating the same authorization flow.

Deploy the reviewed source after provisioning and release approval, then check
the real domain, new campaign identity, locale/currency, share metadata and US
performance. Follow the Meta runbook for any separately authorized tracking
changes. For rollback, restore the preceding Ready deployment and, if needed,
deactivate only the new campaign; retain any payment records and avoid deletion.

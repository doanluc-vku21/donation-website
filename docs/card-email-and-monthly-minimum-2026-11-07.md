# Card email confirmation and monthly offer minimum — 2026-11-07

## Reported failures and changes

The donor's screenshot reports that card confirmation requires an email through
`updateEmail` or `confirm`. The existing donor form validates an email, but the
shared card component called `checkout.confirm()` without passing that value.
`DonationFlow` now supplies the current email to every visible and preloaded
`DonationPayment`; confirmation passes the trimmed value to Stripe. No email
is fabricated. For the existing optional-information path, Stripe's
`ContactDetailsElement` collects the required email in the payment step.
Preparing the component still does not confirm a payment.

The recommended monthly offer uses 40% of the selected one-time amount: a $25
gift produces a $10 monthly recommendation. On `/akram-shake-2` and
`/help-mango-seller`, both the UI and payment endpoints previously required $25
for either frequency. The user explicitly chose a $10 monthly minimum while
keeping the $25 one-time minimum.

The shared page policy now accepts payment frequency. The UI, card and wallet
Session creation, and signed/legacy wallet amount updates use the same minimum
for these two entry pages, converted to the selected currency. Monthly
recommendations cannot fall below the monthly minimum. Wallet updates derive
frequency from the verified context or original Stripe Session, rather than
trusting a client-supplied frequency. Fees cannot satisfy the donation minimum.
Other entry pages retain their existing minimum checks and payment behavior.

## Validation

- 145 focused tests pass across card confirmation, donor-flow integration,
  campaign checkout, wallet preparation and amount updates. These cover both
  entry pages, the monthly offer, one-time gifts, USD/GBP conversion, fee
  coverage, signed and legacy amount updates, decline/retry recovery, and a
  pending optional donation-attempt request.
- The pre-fix card component fails the new email-forwarding, email-collection,
  and decline/retry regressions.
- ESLint with zero warnings, TypeScript checking and `git diff --check` pass.
- The full suite reports 314 passed and 8 failed. The same eight assertions
  fail against a fresh snapshot of the current HEAD: two campaign-page router
  context failures, two old story-copy assertions, three old DonationPanel
  assertions and one Pixel configuration assertion. Diagnostic results are
  retained under ignored `.local/payment-fix-*` files.
- A complete production build passes using isolated placeholder configuration.
  This establishes compilation and page-data collection, not external service
  connectivity. The build uses the repository's npm 12.2.1; the installed Node
  22.14.0 produces npm's engine warning. Dependencies and lockfile are unchanged.

## Real Stripe sandbox verification

Complete test credentials were subsequently supplied and stored only in the
ignored, mode-0600 `.local/stripe-sandbox.env`. Stripe authentication succeeded
and `balance.livemode` was false. No sandbox webhook endpoints were configured.

An isolated loopback Vite harness loads the actual working-tree `DonationFlow`,
`DonationPayment`, wallet components and card/wallet API handlers. Only
`next/navigation` and the server-only import marker are adapted to the harness.
It uses a clearly identified fixture campaign and has no Supabase, Sanity,
Resend or Meta connection. Optional donation-attempt requests return a deliberate
503, demonstrating that their failure does not prevent card payment.

Headless Chrome at a 390-pixel viewport completed these real sandbox flows:

- `/akram-shake-2`: a $25 one-time card payment and the $10 monthly offer.
- `/help-mango-seller`: a $25 one-time card payment after an insufficient-funds
  decline and retry, plus the $10 monthly offer.
- `/akram-shake-2`: an additional $25 card payment after completing a real
  Stripe sandbox 3D Secure 2 challenge. An initial automated attempt timed out
  with authentication still pending and its Session was expired. The rerun
  completed the test challenge and Stripe confirmed a succeeded PaymentIntent;
  no application code was changed for that rerun.

Each result was retrieved server-side from Stripe and confirmed as test mode,
`payment_status: paid`, with the expected amount, currency, mode and donor email.
The monthly subscriptions were confirmed active before cleanup. Card payments
were confirmed with succeeded PaymentIntents. The harness return page performs
this actual server retrieval; it does not substitute for the application's
Next.js thank-you page, whose existing mocked tests pass in the full suite.

Four additional real API scenarios cover both pages and frequencies: invalid
card/wallet creation amounts, valid wallet creation at the minimum, rejected
below-minimum wallet changes and successful signed amount changes. The final
amount and accounting metadata were read back from Stripe.

Sanitized results, screenshots, session scope and cleanup records are kept under
ignored `.local/stripe-sandbox/`. Native wallet authorization, live campaign-page
rendering and webhook persistence in a real isolated test database remain
unverified. The sandbox has no webhook receiver; no production receiver was
enabled to work around that limit. Real email delivery and advertising events
were excluded from the test.

Both created test subscriptions were canceled and their canceled status read
back from Stripe. Open validation Sessions are expired by the scoped cleanup
script, which checks test mode and the fixture campaign ID before mutations.
Completed test payment records are retained for audit. Credentials remain
ignored and are not copied into application or production configuration.

Validation did not perform a live-mode payment, donor email, production
database/CMS write or production environment change. Credentials remain local.

## Release

The user subsequently authorized committing, pushing and publishing this fix.
The target is the existing `darklife / donation-website` production workflow
for `doanluc-vku21/donation-website`, branch `main`, serving
`donate.mealsupport.org`. Before this release the branch was synchronized at
`0f5e0e5f30053ea90474cbc9970cc05231a7009e`; GitHub records a successful Vercel
production deployment for that commit at
`https://donation-website-1hpxks54f-darklife.vercel.app`
(`2CKB4DztQiKALg7BXKeYorTVNScD`).

Release through the repository's existing Git integration, without changing
Stripe keys, production environment variables, CMS content or database schema.
The release requires no data migration. Rollback is to revert the payment fix
and publish the restored source, or restore the preceding production deployment
through Vercel. Deployment status and live HTTP/source readback are checked after
the push; sandbox payment success alone does not establish a successful release.

Stripe documents both supported email approaches in its
[Checkout Elements guide](https://docs.stripe.com/payments/accept-a-payment?payment-ui=elements&api-integration=checkout#collect-customer-email).

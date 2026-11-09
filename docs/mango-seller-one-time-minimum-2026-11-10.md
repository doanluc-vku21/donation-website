# Mango-seller one-time minimum — 2026-11-10

## Change and scope

The owner requested that `/help-mango-seller` accept one-time donations starting
at USD 20, with the amount hint and actual payment validation updated together.
The existing monthly minimum on that page is already USD 20. Other entry-page
minimums remain unchanged, including the street-vendor page's USD 25 one-time
floor.

The frontend, card Checkout creation, wallet Checkout creation and both signed
and legacy wallet amount updates already call
`getDonationPageMinimumUsdCents`. A page-specific USD 2,000-minor-unit return
updates these paths consistently without changing payment confirmation,
preloading, fees, amount normalization, donor identity or webhook behavior.
Existing translated amount hints interpolate this value. The dedicated Hosted
Checkout endpoint does not allow this campaign slug and is not modified.

The threshold applies to the donation before the optional fee contribution.
The same currency conversion helpers continue to produce the corresponding
local-currency minimum. Server path resolution continues to prevent another
campaign from claiming the mango-seller path to obtain its lower threshold.
The existing presets are unchanged; separate unpublished preset edits are
retained in the working directory and excluded from this release.

## Validation before publication

- Lint with zero warnings and type checking passed.
- Four targeted payment files passed all 175 working-directory tests. This
  includes one previously uncommitted preset test excluded from the release;
  the exact release source contains 174 passing targeted payment tests.
- Coverage includes USD 19.99 rejection / USD 20 acceptance, the GBP equivalent,
  fee coverage on/off, card and wallet creation, signed and legacy wallet amount
  updates, one-time card confirmation with mocked Stripe, other-page minimums,
  and rejection of a mismatched campaign/path.
- The exact staged application source passed a production build with isolated
  placeholder credentials. This does not establish live Stripe access.
- Full suite on that source: **385 passed, 7 failed, 392 total**. A fresh archive
  of baseline `f8bb1a7d95683c425ad106786b556b87553dff9a` produced **375 passed,
  the same 7 failed, 382 total**. The shared failing assertions are two
  campaign-page tests, two campaign-story tests and three donation-panel tests.
  The ten added boundary cases introduce no new full-suite failures.

Baseline and candidate were tested with the same isolated configuration and
bounded workers. Site-origin overrides were omitted for unit tests so that
tests of default origins and referrer handling retain their intended inputs.
Raw reports and the exact failure comparison are under ignored
`.local/mango-one-time-minimum-20/`.

## Publication and live checks

Publish through the authorized Git push to the existing
`darklife/donation-website` production project. After deployment, verify the
new hint and disabled/enabled amount boundaries in the browser, and check the
public API's below-minimum rejection, USD 20 unpaid Checkout preparation and
signed amount updates. Do not submit payment confirmation, donor email/name
details or real charges. Store only sanitized outcomes, never client secrets,
signed update capabilities or full Stripe responses. Existing signed webhook
and email behavior is outside this change.

For rollback, revert the page-specific policy exception or restore the preceding
Ready production deployment, then verify public-domain readback. No database
migration or production configuration change is required.

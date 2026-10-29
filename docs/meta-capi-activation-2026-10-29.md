# Server Purchase reporting activation — 2026-10-29

Reusable procedure: [Meta Purchase reporting operations](meta-capi-runbook.md).

## Outcome

Production server Purchase delivery is enabled for dataset `1116237120993773`
(`Donation Pixel 2`, Grow Mark). This replaces reliance on browser completion
alone after the earlier removal of that dataset from Stripe Conversions App's
asset permissions. The old Stripe permission was not restored.

Vercel deployment `D7aGBUHZ3EQ3zg6QjhRDWeaJV1n4` is Ready in Production and
serves `donate.mealsupport.org`. It redeploys existing commit
`d7290edc0e63e01fca4bf451ce8a09b210b39ae0`; no application code was changed
for this activation.

## Configuration and behavior

- `META_CAPI_ACCESS_TOKEN`: stored as a Production Secret, never a public
  environment variable. A new credential was generated with explicit user
  approval, without adding Dataset Quality API permissions.
- `META_CAPI_ENABLED=true`: verified by reading back the saved Config value.
- `NEXT_PUBLIC_META_PIXEL_ID=1116237120993773`: verified by reading back the
  saved Config value and inspecting the public pages.
- `META_TEST_EVENT_CODE`: absent from Production. The test code was used only
  in the isolated transport test.

The existing signed Stripe webhook sends only verified paid Checkout Sessions
with a positive charged amount. Browser and server use the same
`purchase_<Stripe Checkout Session ID>`. The server records accepted delivery
in `meta_purchase_sent_at`; failed delivery remains retryable. The existing
Meta automatic web connection is retained. Ad budgets, payment configuration,
and the other dataset's permissions were not changed.

## Evidence and limits

- Eighteen focused browser/server/webhook tests passed.
- An isolated test bundled the actual server sender, routed a synthetic
  non-live Session through Meta's Test Events code, and received HTTP 200 with
  `events_received=1`. Events Manager displayed Purchase / Processed / Server
  with the expected `purchase_cs_test_capi_...` ID.
- No Stripe transaction or real customer information was used in that test.
  No historical donation events were replayed.
- All three public campaign checks returned HTTP 200 and initialized only
  Pixel `1116237120993773` after deployment.
- The earlier four ad purchases were observed in the account's last-30-days
  range, using Eastern Time. That is not proof that one USD 10 payment was
  counted four times. The two reported new USD 10 donations remain unreconciled
  individually, and live payment-to-ad attribution is not yet verified.

Test-event acceptance and successful deployment establish configuration and
transport readiness, not a completed live-payment verification. Check the next
genuine paid Checkout Session against Meta's received event ID, amount, currency,
delivery marker, and ad attribution. Do not make an unnecessary real charge or
invent ad-click identifiers to validate reporting.

After deployment, the user reported success on 2026-10-29 and requested that
the procedure be retained in the project. This is user confirmation, not an
additional operator audit of a live Stripe Session or Ads Manager attribution.

Redacted reports and screenshots are under ignored `.local/diagnostics/`.
Temporary plaintext credential files were removed after an owner-restricted
Windows DPAPI backup was created and verified under ignored `.local/auth/`.
No credential values belong in this document, logs, screenshots, or Git.

## Rollback

Set `META_CAPI_ENABLED=false` in Vercel Production and redeploy to stop this
server sender while keeping browser tracking. Reconnecting the old Stripe
Conversions App source, if needed, requires restoring this specific dataset in
the existing Stripe Meta app with administrator access; do not disconnect or
reconnect unrelated business datasets.

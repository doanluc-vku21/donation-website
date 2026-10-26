# Meta Purchase matching and deployment

The checked-in implementation previously emitted only browser Purchase events
on `/thank-you`, without an event ID or server delivery. The screenshot's
`Multiple` integration label means an external integration may also be sending
events; that integration is not represented in this repository.

## Configuration

Browser tracking initializes both `2187720428848027` (the default primary Pixel)
and `1116237120993773` (added at the user's request). The SDK loads once and a
single PageView call follows both initializations. Existing InitiateCheckout
and paid Purchase calls broadcast to both initialized Pixels with the existing
Purchase event ID and reload/remount deduplication. Each Pixel also has a
JavaScript-disabled PageView image. Duplicate IDs are initialized only once.

The additional Pixel receives browser events only. It does not change the
primary CAPI dataset, reuse its token for another dataset, or enable CAPI.

Use `.env.example` for variable names. Set `NEXT_PUBLIC_SITE_URL` to the actual
HTTPS site origin. Configure `META_CAPI_ACCESS_TOKEN` as a **server-only** secret
in the deployment platform. `NEXT_PUBLIC_META_PIXEL_ID` must equal the dataset
that issued the token (default: the existing `2187720428848027`).

The sender is disabled until `META_CAPI_ENABLED=true`. When disabled, existing
browser tracking and payments continue. On Vercel the original visitor IP comes
from `x-vercel-forwarded-for`. Elsewhere, enable `META_TRUST_PROXY_HEADERS` only
after verifying your reverse proxy overwrites `X-Forwarded-For` and direct access
to the app cannot bypass it. Missing IP is omitted rather than replaced with
the payment provider/server IP.

## Validate before enabling production

1. Check Events Manager's Purchase integration details. If another CAPI sender
   already sends these Stripe payments, disable that overlapping Purchase sender
   or align its event ID before enabling this implementation. Unrelated event
   integrations can remain in use.
2. Use a preview deployment with Stripe test keys/webhook and Meta's Test Events
   code in `META_TEST_EVENT_CODE`. Set `META_CAPI_ENABLED=true`. Do not run tests
   with real charges. Non-live Stripe sessions are skipped unless a test code
   is configured.
3. Exercise embedded card checkout, wallet/express checkout, and hosted checkout
   with an actual ad click if available. Check that `_fbp` is the real Pixel
   cookie and `_fbc` preserves the actual `fbclid`. Organic visits without
   `fbclid` must have no invented `_fbc`.
4. Complete payment. Confirm Test Events receives browser and server Purchase
   with identical `event_id = purchase_<Stripe Checkout Session ID>`, actual
   charged amount/currency, and matching fields. Refreshing the thank-you page
   and redelivering the signed webhook must not create another conversion.
5. Test an unpaid session: no Purchase. Test a declined Meta response: the
   signed Stripe webhook returns 500; retry must recover after the issue is
   fixed, even if the donation/receipt already exists. The accepted delivery is
   marked in Stripe Session metadata as `meta_purchase_sent_at`.
6. Remove `META_TEST_EVENT_CODE` from production, deploy the same version, then
   enable production delivery. Verify the next genuine donation in Events
   Manager and the deployment logs. Do not replay historical payments to try
   to improve the score.

Meta API acceptance is checked (`events_received=1`), with a 10-second timeout.
Failures raise a sanitized error and use Stripe webhook retries. A stable event
ID covers concurrent delivery and ambiguous timeouts; a fresh Session metadata
read suppresses later redeliveries. A process failure between Meta acceptance
and saving the marker can resend the same ID; Meta's deduplication window still
applies. No separate database migration is required.

The integration sends the first paid Checkout Session, including the first
monthly payment. Recurring invoice renewals do not reuse an old browser's
attribution as a fresh website Purchase.

## Matching data

Landing-page attribution is retained in first-party cookies and copied into
Stripe Session metadata at checkout creation (and refreshed during express
donor updates or donation-attempt attachment). The webhook uses that original
context, never its own IP/UA.
Email, international phone, real names, billing city/state/postal code/country,
and the stable visitor ID are normalized and SHA-256 hashed server-side.
`fbp`, `fbc`, IP and UA remain unhashed. Missing data is omitted. Local phone
numbers without an international calling code are not guessed. No new required
donor form fields were added. Query strings are excluded from source URLs.

Existing site consent controls must govern analytics collection/sending when
applicable; this change introduces no consent bypass. If adding a consent
manager later, gate both browser collection and CAPI rather than hiding only
the Pixel script.

## Rollback and expected outcome

Disable `META_CAPI_ENABLED` and redeploy to stop server delivery; browser Pixel
and payment persistence remain in place. No payment data needs to be rolled back.

EMQ is computed by Meta from received matching data. A code change cannot
guarantee a particular score or immediately change the dashboard. Confirm field
coverage and deduplication on new genuine purchases, then review EMQ after Meta
has processed sufficient traffic.

References: [Meta customer information parameters](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters/),
[Meta fbp/fbc](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc/),
[Meta parameter builder](https://github.com/facebook/capi-param-builder),
[Meta Business SDK](https://github.com/facebook/facebook-nodejs-business-sdk).

## Verification on 2026-10-24

- 18 targeted tests passed: attribution, field normalization, sandbox isolation,
  verified-payment gating, browser/server event IDs, delayed Pixel startup,
  restricted browser storage, Meta API acknowledgment, webhook retries and
  delivery markers. TypeScript checking passed.
- Production build compiled successfully and passed Next.js's TypeScript step;
  collecting page data requires the project's unavailable local
  `STRIPE_SECRET_KEY`, so a full build is not yet verified.
- The complete suite has five pre-existing assertion failures in donation-panel
  and campaign-story, plus campaign-page cannot load without the Stripe public
  key. These failures were reproduced from an untouched HEAD archive.
- ESLint cannot initialize because the repository's existing TypeScript 7
  version is unsupported by its installed typescript-eslint version.
- Vercel dashboard inspection: `darklife/donation-website` has 11 project
  variables and no linked shared variables. No Meta/CAPI token is configured.
  Existing Secret variables cannot be copied/exported after creation; no
  credentials were exported or changed. Meta Business requires account login.
  Server delivery remains disabled pending token configuration and Test Events
  validation. No live payments, production deployments or settings changes were
  performed.

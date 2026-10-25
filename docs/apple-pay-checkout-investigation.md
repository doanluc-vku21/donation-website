# Apple Pay checkout investigation — 2026-10-25

## Confirmed findings and changes

### 1. Wallet warm-up never matched the mounted checkout

The campaign's `DonationModal` created a monthly Stripe Checkout Session in the
background, keyed as:

`campaign:path:frequency:amount:currency:no-fee:public:locale`

`DonationFlow` looked for the same selection in a different order:

`campaign:frequency:amount:currency:no-fee:public:locale:path`

The comparison could never match. Opening the modal discarded the already
prepared Session and started another `/api/stripe/express-checkout` request.
That adds another application/Stripe request to the wait before wallet buttons
are ready. Both mismatching expressions were verified in public production
assets served by `https://donate.mealsupport.org/gaza-food`:

- `/_next/static/immutable/chunks/0iwrnvnfd46d6.js` (warm-up)
- `/_next/static/immutable/chunks/43-yw5-z_au1z.js` (wallet consumer)

Both components now use `lib/stripe/express-checkout-key.ts`. A completed or
in-flight warm-up is reused. Changing the selected amount creates the correctly
priced Session. Rejected warm-ups are handled while the modal is closed and
retried when needed; reopening can replace a rejected promise even when the
selection's key is unchanged.

Regression reproduced before the change: one page warm-up followed by opening
the modal mounted `cs_duplicate_secret` instead of `cs_prefetched_secret`.
After the change, the same test mounts the prepared Session and records only
one Express creation request across warm-up and modal opening. These are
deterministic application tests, not measured live Apple Pay timings.

### 2. Optional tracking could abort an authorized wallet payment

`onExpressConfirm` executes before `checkout.confirm`. The caller accesses
`sessionStorage` and the Meta Pixel. A thrown analytics/storage exception was
caught as a payment failure, and Stripe confirmation was never called.
Synchronous errors starting optional bookkeeping had the same effect.

Tests reproduced both failures with zero calls to Stripe confirmation. These
optional callbacks are now isolated, while actual Stripe payment errors still
reach the payment error UI. Existing background bookkeeping stays non-blocking,
and the actual wallet event is still passed to Stripe as
`expressCheckoutConfirmEvent`.

This is an exception path that could look like a stuck or failed wallet to a
donor. We have not established that the reported donor's device hit it.

## Source and deployment consistency

The initial local checkout was at `c7c7706`, three commits behind `origin/main`.
Production already included the later fixes to forward the wallet event and
run donation-attempt bookkeeping in the background. Those were not reported as
current production slowness causes.

The local branch was fast-forwarded to `f5dbc47` after saving the existing EMQ
work; that work was reapplied without conflicts. Upstream's subscription
identity/webhook fixes are preserved. The saved EMQ stash remains available as
a recovery copy. The investigation did not trigger a deployment; committing
and pushing the combined fixes was subsequently authorized by the site owner.

## Verification and limits

- 10 Apple Pay regression tests passed: completed and in-flight prefetch reuse,
  recovery from rejected warm-ups before/after modal opening, correct amount
  after selection changes, wallet-event forwarding, slow/rejected optional
  bookkeeping, tracking exceptions, and real Stripe-error handling.
- The existing 18 Meta tracking tests also passed, for 28 targeted tests total.
- `npm run typecheck` and `git diff --check` passed.
- Only public production HTML and JavaScript were fetched. No production
  Checkout Session was created, no charge was attempted, no credentials were
  retrieved, and no external settings were changed.
- Public HTML and diagnostic asset metadata are in the Git-ignored
  `.local/diagnostics` directory. One GET from the current machine returned the
  campaign HTML in about 3.90 seconds (first byte 3.18 seconds). This includes
  that machine's network path and is not an Apple Pay checkout benchmark.
- There is no iPhone/Safari wallet trace or recording from the affected donor.
  This investigation confirms avoidable application work and error paths,
  rather than attributing all reported delay to Stripe, Apple, the network, or
  the issuing bank. Real end-to-end speed remains to be verified after deployment.
- A full local production build still needs the application credentials, as
  recorded in `docs/meta-emq.md`. No live keys were substituted for testing.

## Validation after release

On an Apple Pay-capable iPhone/Safari, measure separately (a) opening the donation
modal until the wallet button is usable, (b) opening the Apple Pay sheet, and
(c) authorizing payment until completion. Use a Stripe sandbox deployment first.
Confirm that a ready warm-up causes no second Express creation request when the
modal opens. Check both monthly and one-time donations, selected amount/currency,
and webhook persistence. Do not use an actual charge merely to benchmark speed.

For residual delay, collect the affected page URL, device/browser, which of
those three stages is slow, and a network timing trace with sensitive data
removed. Compare `/api/stripe/express-checkout` duration, cached/cold application
response time, FX lookup for non-USD payments, Stripe initialization and wallet
confirmation separately.

Stripe's [Express Checkout integration guide](https://docs.stripe.com/elements/express-checkout-element/accept-a-payment?payment-ui=embedded-components)
documents the `confirm` event and forwarding `expressCheckoutConfirmEvent`.

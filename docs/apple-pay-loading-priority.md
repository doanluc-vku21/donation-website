# Wallet loading priority and preset reuse — 2026-10-27

## Observed baseline

The production review of `/akram-shake-2` used the Chromium in-app browser,
not native iPhone Safari. The donation modal became visible about 11 ms after
the click. Its monthly wallet became ready after 4,628 ms; switching to Give
once took about 4,257 ms from selection. A custom amount became payable after
1,633 ms. These are individual browser observations, not universal latency
figures or evidence of a completed payment.

The page prepared a separate card Checkout Session 120 ms after opening the
amount step. That created a second Checkout SDK and Payment Element while the
Express Checkout wallet was still initializing. Preset amount changes also
created a new Session and iframe even when an initialized wallet already
supported a verified in-place amount update.

## Changes

- Prepare the card checkout when the donor chooses Card or enters the donor
  step, rather than during wallet amount selection. The existing in-flight
  card request is still shared; card selection does not wait for the wallet
  to finish or require a second click.
- Reuse a compatible initialized wallet for preset amounts as well as custom
  amounts. Use the existing signed amount-update endpoint and Stripe
  `runServerUpdate`; enable the button only after Stripe's refreshed total
  matches the server's expected total.
- Preserve separate Sessions for frequency, currency, campaign/path, locale,
  fee coverage, and visibility changes. Presets below the update endpoint's
  minimum retain Session creation. A failed update discards the uncertain
  Session and creates a fresh one. Updates remain serialized, and mutating a
  prefetched Session invalidates its original cache entry.
- Preconnect to `js.stripe.com` and `api.stripe.com` from the document head so
  connection setup can overlap page loading. These hints do not initialize
  Stripe, Google Pay, or card Elements. The shared pure Stripe loader and iOS
  wallet warm-up remain in place.
- On iPhone/iPad, start downloading the official async Stripe SDK before React
  hydration, rather than waiting for the modal's effect. The normal pure loader
  discovers the existing script and initializes one controller. Hosted checkout
  entry pages, Android, and desktop retain deferred SDK loading. A failed
  speculative script is removed so the normal loader can retry.

No payment method, fraud protection, consent handling, payment confirmation,
webhook accounting, or Meta attribution is disabled. Switching frequency
still requires its own Session; this change does not claim to eliminate that
initialization cost.

## Validation

Six additional regressions cover card initialization on explicit intent,
preset iframe reuse, rapid preset changes with stale-amount blocking,
frequency separation, failed-update replacement, and presets below the amount
update minimum. The first three failed against the previous implementation.

The focused payment, wallet, Meta, and thank-you checks pass 127 tests across
14 files, including eleven bootstrap cases and an integration case exercising
the actual pure loader's script discovery without network access. Type checking
and ESLint with zero warnings pass. The full suite
before the last two additional regressions passed 117 tests with five failed
assertions in unchanged campaign-story/donation-panel files; campaign-page
also cannot initialize without `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. This is
not a full-suite pass.

The production build compiled and completed its TypeScript step, then stopped
while collecting `/thank-you` page data because local `STRIPE_SECRET_KEY` is
unavailable. No production credentials were copied to bypass that failure.

## First production release: `7b56f80`

Vercel reported a successful deployment. All three public campaign pages
returned HTTP 200 and served the preconnect hints, preset reuse, and card-intent
logic. A live Chromium/GBP review measured:

| Action | Observed time |
| --- | ---: |
| Open the donation modal | 8 ms |
| First monthly wallet readiness | 9,291 ms |
| Change a preset amount | 1,666 ms |
| Change a custom amount | 1,830 ms |
| Switch to Give once | 4,823 ms |
| Return to monthly and restore its default amount | 1,537 ms |

Preset/custom changes retained the same wallet iframe and used only the amount
endpoint. No card Session was created until Card was selected; that request
returned HTTP 200 and the donor-information screen opened normally.

The slow first-wallet sample is retained. It spent about 4.3 seconds reaching
Stripe SDK readiness and another 4.9 seconds reaching wallet availability;
removing card initialization does not establish a first-load speed gain.
Frequency changes still initialize a separate Session. These observations
motivated the additional iOS-only download bootstrap; Chromium desktop does
not execute that bootstrap.

Native iPhone/Safari wallet presentation and authorization remain separate
checks. Unit tests and user-agent emulation do not establish real-device
performance. No actual charge is used for performance validation. Raw timing
reports and screenshots remain under Git-ignored `.local/diagnostics/`.

Reference: [Stripe Express Checkout integration](https://docs.stripe.com/elements/express-checkout-element/accept-a-payment?payment-ui=embedded-components).

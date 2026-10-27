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

No payment method, fraud protection, consent handling, payment confirmation,
webhook accounting, or Meta attribution is disabled. Switching frequency
still requires its own Session; this change does not claim to eliminate that
initialization cost.

## Validation

Six additional regressions cover card initialization on explicit intent,
preset iframe reuse, rapid preset changes with stale-amount blocking,
frequency separation, failed-update replacement, and presets below the amount
update minimum. The first three failed against the previous implementation.

The focused payment, wallet, Meta, and thank-you suite passes 115 tests across
12 files. Type checking and ESLint with zero warnings pass. The full suite
before the last two additional regressions passed 117 tests with five failed
assertions in unchanged campaign-story/donation-panel files; campaign-page
also cannot initialize without `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. This is
not a full-suite pass.

The production build compiled and completed its TypeScript step, then stopped
while collecting `/thank-you` page data because local `STRIPE_SECRET_KEY` is
unavailable. No production credentials were copied to bypass that failure.

The change is verified locally. New production timings must be measured after
deployment, including default wallet opening, preset/custom amount changes,
monthly/one-time switching, and card fallback. Native iPhone/Safari wallet
presentation and authorization remain separate checks; mocked tests do not
establish a real-device speed improvement. No actual charge is used for
performance validation.

Reference: [Stripe Express Checkout integration](https://docs.stripe.com/elements/express-checkout-element/accept-a-payment?payment-ui=embedded-components).

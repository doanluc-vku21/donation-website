# Apple Pay button warm-up — 2026-10-26

## Recording evidence

The supplied iPhone recording is approximately 8.67 seconds long at 29.88 fps.
After the page is refreshed, the donation modal first appears at about 6.4 s.
The Apple Pay button appears at about 7.6–7.8 s: approximately 1.2–1.4 seconds
of visible waiting after the modal opens. These estimates come from 0.2-second
frame samples, not a browser network trace. The user confirmed that this black
button is the slow part. The system Apple Pay payment sheet is not shown.

The previous warm-up created a Checkout Session early, but `DonationFlow` only
mounted when `open` became true. Stripe's Checkout SDK and Express Checkout
iframe therefore still initialized after clicking Donate. Fixing the Session
cache alone did not eliminate this client-side work.

## Change

Once the default monthly warm-up is scheduled, the matching donation flow mounts
inside the closed modal. It initializes the actual Stripe wallet subtree while
the visitor is still viewing the campaign. Opening the modal retains that same
subtree and iframe instead of starting their initialization at click time.

The closed modal has zero opacity, is `aria-hidden` and `inert`, and ignores
pointer events. Its layout remains measurable for Stripe initialization. No
replacement/fake Apple Pay button or automatic payment confirmation is added.

An `active` flag prevents the separate card Checkout Session from being created
while the modal is closed. Hosted-checkout entry pages retain their existing
no-wallet-warm-up behavior. Currency/campaign mismatches cannot mount an old
prefetch as the new selection. Closing the modal resets the donation form as
before, and starts a fresh default wallet subtree for the next opening.

If a hidden warm-up fails, it waits for the next opening to retry rather than
creating another background Session. The existing foreground failure recovery
and amount-selection checks remain in place.

## Validation

- Regression tests fail on the previous implementation when requiring the
  wallet subtree to exist before opening and survive the opening unchanged.
- 40 focused tests pass after the change, including early wallet initialization,
  retained DOM identity on open, no hidden card-session creation, immediate
  opening, hosted-page behavior, currency changes, close/reset/reopen, and the
  existing payment, Meta and thank-you page checks.
- Lint passes with zero warnings; TypeScript checking passes.
- Raw recording frames, timing samples and tool dependencies remain under the
  Git-ignored `.local` directory. The video and extracted frames are not committed.
- Mocked tests verify the lifecycle and request behavior; they do not measure
  real iPhone network performance. An immediate click before warm-up finishes
  can still require loading. iPhone/Safari validation is needed to measure the
  resulting visible delay under the donor's actual network conditions.

Stripe's [Express Checkout guide](https://docs.stripe.com/elements/express-checkout-element/accept-a-payment?payment-ui=embedded-components)
describes the Checkout provider, iframe mounting, and the period before payment
buttons become available. Payment authorization still uses its standard wallet
`confirm` event.

# Custom amount and Apple Pay interaction — 2026-10-26

The user reported having to tap payment twice after entering a custom amount.
They clarified the interaction issue; two actual bank charges have not been
established. No live payment is used to reproduce the issue.

## Reproduced code paths

- A changed amount kept the previous Apple Pay iframe visibly active while a
  transparent overlay intercepted interaction. The first tap could therefore
  hit the overlay while the new Session/iframe was preparing.
- An intermediate custom value below the minimum removed the wallet subtree
  entirely. Re-entering a valid amount mounted it again, even when its Session
  was already cached.
- The confirmation handler relied on React state to prevent re-entry. Two
  events in the same browser turn could both call `checkout.confirm` before
  React rerendered. This is a duplicate invocation path, not evidence of two
  successful Stripe charges.
- A cached stale wallet had no explicit authorization guard tied to the
  currently selected amount.

Tests failed on these four paths before the change.

## Changes

Wallet Session readiness is now separate from device payment-method
availability. A device reporting no wallet does not remain in an endless
preparing state. While the chosen amount is preparing, the interface displays
a localized status instead of an apparently clickable old Apple Pay button.
Only the ready Session matching the current amount can receive interaction.
All other wallet containers are hidden from accessibility and marked inert.

Wallet instances remain mounted through invalid intermediate input values, but
are hidden, inert and unable to authorize an old amount. No Session is created
for an invalid amount. Re-entering an already-ready amount can reuse the same
wallet DOM without another initialization.

The existing 450 ms typing debounce remains. Blurring the custom amount input
flushes a still-pending update immediately. A once-only pending flag prevents
the old timer or repeated blur from starting the same request again. An update
already in flight is not restarted by blur.

An enabled flag rejects stale wallet authorizations with `paymentFailed` before
calling Stripe. A synchronous ref lock prevents duplicate confirmation events
in the same browser turn. A real declined/failed confirmation releases the
lock for a deliberate retry; a successful one remains locked during redirect.
The actual payment still requires the normal user-triggered Stripe wallet flow.
Nothing automatically opens or authorizes a payment after an asynchronous wait.

## Verification and limits

- 46 focused tests pass: custom amount 123.45 submits 12345 minor units, pending
  updates are visible, blur flushes once, invalid intermediate values retain
  the wallet without enabling it, cached valid amounts remain usable, stale
  authorizations are rejected, duplicate events confirm once and declines allow
  a new attempt. Existing warm-up, payment, Meta and thank-you tests also pass.
- Type checking passes and lint passes with zero warnings.
- Amount, fee, currency, Stripe Session creation and webhook accounting logic
  are unchanged. No production financial transactions or bank-statement audit
  are performed in this repair.
- The original double-tap report has no custom-amount recording/network trace.
  The identified UI and event paths are reproducible, but exact iPhone gesture
  behavior still needs verification on the reporting device after release.
  While an amount is updating, the status represents necessary preparation;
  the real Apple Pay button becomes usable when the selected amount is ready.

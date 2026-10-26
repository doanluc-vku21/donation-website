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

The typing debounce is now 200 ms (previously 450 ms). Blurring the custom amount input
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
- No production financial transactions or bank-statement audit are performed.
- The original double-tap report has no custom-amount recording/network trace.
  The identified UI and event paths are reproducible, but exact iPhone gesture
  behavior still needs verification on the reporting device after release.
  While an amount is updating, the status represents necessary preparation;
  the real Apple Pay button becomes usable when the selected amount is ready.

## Further latency repair — 2026-10-26

The follow-up report specifically identified custom-amount preparation as slow.
Previously each new custom amount created another Checkout Session, initialized
another CheckoutElementsProvider and loaded another Express Checkout iframe.
Only returning to an exactly cached amount avoided that complete sequence.

Custom amounts now reuse an initialized wallet with matching campaign, entry
path, currency, frequency, fee setting, anonymity and locale. The client calls
Stripe's supported `runServerUpdate`, while the new amount endpoint replaces
the Session line item and updates financial metadata. The existing Stripe
product, monthly recurrence and iframe remain in use. The SDK's refreshed total
must equal the server's calculated total before the wallet becomes usable.
Preset/frequency/currency and other configuration changes retain the existing
Session-creation path. A missing updater or failed update also uses that path.

The endpoint requires the matching Session client secret, an open unpaid
elements Session from this express flow, a single line item and a valid custom
amount. It derives currency, fee coverage and payment frequency from Stripe,
reuses the same amount calculations as Session creation, and does not log
client secrets. It does not authorize, confirm or charge a payment.

Writes are serialized. A new selection cannot abort a write already received
by Stripe: the flow records its result, then synchronizes the latest selection.
Mutating or ambiguous Sessions cannot be paid or reused under an old cache key.
Changed prefetch results are invalidated, including on modal close/reopen.
On update/refresh failure, the ambiguous Session is discarded and a fresh one
is created. The existing duplicate-confirmation lock stays in place.

Initial monthly invoice handling reads final Checkout Session metadata before
calculating donation/fee amounts. The checkout-completed handler copies final
values to subscription metadata even if the invoice event already saved the
donation. This protects renewals and either webhook arrival order from the
creation-time `subscription_data.metadata` snapshot.

85 focused tests pass, including 31 added checks for update authorization,
currency/fee arithmetic, SDK-total verification, rapid edits, original-amount
reselection, failed-update recovery, prefetch invalidation and monthly webhook
ordering. Type checking and lint with zero warnings also pass.

The fixed typing wait is reduced by 250 ms and the successful update path
avoids an entire wallet reinitialization. This is an implementation improvement,
not a measured end-to-end iPhone speed claim. Stripe/network latency remains;
the reporting iPhone still needs a post-release custom-amount retest.

Official references:
- https://docs.stripe.com/payments/advanced/dynamically-update-line-items
- https://docs.stripe.com/api/checkout/sessions/update

## Follow-up: delay still reported — 2026-10-26

The reporter said the delay felt unchanged. This remains unresolved on the
reporting iPhone; a deployed optimization and passing unit tests do not establish
a faster native-device interaction.

Production logs show iPhone Safari requests to `/api/stripe/express-checkout/amount`
around 17:56–17:57 Asia/Shanghai, on the current deployment, returning HTTP 200.
One request at 17:57:17 took 962 ms overall, with 660 ms of function execution
(Stripe retrieval 138 ms and update 515 ms). The request entered in Mumbai and
ran in Washington, D.C. These observations establish use of the update path,
but cannot identify the individual caller or measure the browser's subsequent
Stripe refresh/rendering time. No real payment was made in this investigation.

Use `/akram-shake?wallet_debug=1` for an opt-in timing panel inside the donation
modal. It records selection, Session preparation, Stripe SDK readiness, wallet
readiness, amount API start/end, SDK amount refresh completion and the point at
which the selected amount becomes payable. Late completions retain their
original selection number. A failed refresh is explicitly recorded before the
existing fresh-Session fallback. This instrumentation does not change payment
amounts, authorization or confirmation behavior.

The panel is lazy-loaded only for that diagnostic URL. Ordinary visits record
nothing. The report contains only numbered selections, phase names and relative
milliseconds; it excludes donor data, amounts, Session identifiers/secrets,
request/response bodies and URL query strings. It stays in browser memory,
bounded to 60 events, with no server upload. Copy requires a user tap; a
selectable text fallback is available when clipboard access is denied.

Ask the reporter to open the diagnostic URL in Safari, open Donate, enter a
custom amount, wait for the button, and copy the timing report. No payment or
card details are needed. Those timings are needed to locate the remaining delay
before claiming another device-speed fix. The controlled Windows Chrome session
cannot reproduce native iPhone Apple Pay, and raw browser network inspection is
unavailable in the current browser automation session.

## Recording IMG_8837 and removing a redundant Stripe round trip

The 30.77-second recording shows custom values 55, 66 and 88. Sampling the
custom-entry portion at 0.5-second intervals shows approximately 1.5–2 seconds
between the completed amount and the black Apple Pay button becoming usable.
The keyboard remains open; there is no native payment authorization or double
charge in this recording. The recording does not show the diagnostic panel,
so it cannot split the server interval from Stripe's client refresh interval.

New Sessions expand line items in the existing create request and return a
short-lived, server-signed update context. It binds Session, product, currency,
frequency, fee coverage and the FX quote, plus a hash of the actual client
secret. HMAC-SHA256 uses a purpose-separated message with the existing
server-only Stripe secret; neither that key nor a raw client secret is included
in the signed context. The context expires within 20 minutes or at Session
expiry, whichever is earlier. It is a browser-held capability and must not be
logged, shared or placed in URLs.

Amount updates verify the signature, expiry, Session binding and client-secret
hash locally before issuing one Stripe update. This removes the prior Stripe
retrieve request; it does not remove Stripe's authoritative update, the SDK
refresh or the check that the SDK total equals the server total. Stripe still
rejects line-item updates for a Session that can no longer be changed. No charge
or authorization is performed by this endpoint. Client-supplied currency, fee
coverage and product are ignored. Accounting uses the signed FX quote and the
same calculation helper as Session creation. All existing amount/UI locks and
monthly webhook handling remain in place.

Old open tabs without a signed context retain the retrieve-and-verify path.
Expired, modified, mismatched or key-rotated contexts fail closed and use the
existing fresh-Session fallback. This is one fewer Stripe request on the normal
custom-amount path, not a claim that the whole native iPhone flow is instant.
